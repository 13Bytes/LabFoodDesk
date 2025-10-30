import { type NextPage } from "next"
import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Package } from "lucide-react"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getBuyable.useQuery()
  const allCategoriesRequest = api.category.getAllWithItems.useQuery()
  const userDataRequest = api.user.getMe.useQuery()
  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const [searchString, setSearchString] = useState("")
  const [displayCategories, setDisplayCategories] = useState<{ [index: string]: boolean }>({})

  const displayedItems = allItemsRequest.data
    ?.filter((item) => {
      const categoryShown = item.categories.some(
        (category) => displayCategories[category.id] == true,
      )
      const searchShown = item.name.toLowerCase().includes(searchString.toLowerCase())
      return categoryShown && searchShown
    })
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  const apiBuyOneItem = api.item.buyOneItem.useMutation()

  const buyAction = async (itemID: string, quantity: number = 1): Promise<void> => {
    try {
      // Buy the item multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        await apiBuyOneItem.mutateAsync({ productID: itemID })
      }
      
      const message = quantity === 1 
        ? "Erfolgreich gekauft!" 
        : `${quantity}x erfolgreich gekauft!`
      animate(animationRef, "success", message)
      await trpcUtils.user.invalidate()
    } catch (error: any) {
      console.error(error)
      animate(animationRef, "failure", error.message)
      throw error
    }
  }

  const allRelevantCategories = useMemo(() => {
    return allCategoriesRequest.data?.filter((category) => {
      // filter out categories that are not relevant for the buy page (e.g. group orders)
      return category.items.filter((item) => !item.for_grouporders).length > 0
    })
  }, [allCategoriesRequest.data])

  useEffect(() => {
    const displayCategories: { [index: string]: boolean } = {}
    allRelevantCategories?.forEach((category) => {
      displayCategories[category.id] = category.defaultUnfoldedDisplay
    })
    setDisplayCategories(displayCategories)
  }, [setDisplayCategories, allRelevantCategories])
  const selectedCategoriesCount = Object.values(displayCategories).filter(Boolean).length
  const allCategoriesSelected = selectedCategoriesCount === allRelevantCategories?.length
  const noCategoriesSelected = selectedCategoriesCount === 0

  const handleSelectAllCategories = () => {
    const newState: { [index: string]: boolean } = {}
    allRelevantCategories?.forEach((category) => {
      newState[category.id] = true
    })
    setDisplayCategories(newState)
  }

  const handleClearAllCategories = () => {
    const newState: { [index: string]: boolean } = {}
    allRelevantCategories?.forEach((category) => {
      newState[category.id] = false
    })
    setDisplayCategories(newState)
  }

  const clearSearch = () => {
    setSearchString("")
  }

  return (
    <RegularPage>
      <div className="flex flex-col space-y-6">
        {/* Search and Filter Section */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Produktsuche</span>
                  </label>                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nach Produkten suchen..."
                      className="input input-bordered w-full pr-20 pl-10"
                      value={searchString}
                      onChange={(e) => setSearchString(e.target.value)}
                    />
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                    {searchString && (
                      <button
                        onClick={clearSearch}
                        className="btn btn-ghost btn-sm absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="text-sm text-base-content/70">
                {displayedItems ? (
                  <span>
                    {displayedItems.length} Produkt{displayedItems.length !== 1 ? "e" : ""} gefunden
                  </span>
                ) : (
                  <span>Lade...</span>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="space-y-3">
              <div className="flex flex-row gap-2 items-center justify-start flex-wrap">
                <label className="label">
                  <span className="label-text font-medium">Kategorien filtern</span>
                </label>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllCategories}
                    className="btn btn-xs btn-outline"
                    disabled={allCategoriesSelected}
                  >
                    Alle auswählen
                  </button>
                  <button
                    onClick={handleClearAllCategories}
                    className="btn btn-xs btn-ghost"
                    disabled={noCategoriesSelected}
                  >
                    Alle abwählen
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {allRelevantCategories?.filter(i => i.is_active).map((category) => {
                  const isSelected = displayCategories[category.id] === true
                  const itemCount = category.items.filter(item => !item.for_grouporders && item.is_active).length
                  
                  return (
                    <button
                      key={category.id}
                      className={`btn btn-sm transition-all duration-200 ${
                        isSelected 
                          ? "btn-primary" 
                          : "btn-outline hover:btn-primary hover:btn-outline-primary"
                      }`}
                      onClick={() => {
                        const id = category.id
                        setDisplayCategories((dc) => ({ ...dc, [id]: !dc[id] }))
                      }}
                    >
                      <span>{category.name}</span>
                      <div className="badge badge-sm ml-1 opacity-70">
                        {itemCount}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-4">
          {/* No Results Message */}          {displayedItems?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-base-content/50 space-y-2">
                <Package className="h-16 w-16 mx-auto opacity-30" />
                <p className="text-lg">Keine Produkte gefunden</p>
                <p className="text-sm">
                  {searchString 
                    ? `Versuche einen anderen Suchbegriff als "${searchString}"` 
                    : "Wähle mindestens eine Kategorie aus"}
                </p>
              </div>
            </div>
          )}

          {/* Items Grid */}
          {displayedItems && displayedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {displayedItems.map((item) => (
                <BuyItemCard 
                  key={item.id} 
                  item={item} 
                  buyAction={buyAction}
                  userBalance={userDataRequest.data?.balance}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </RegularPage>
  )
}

export default BuyPage
