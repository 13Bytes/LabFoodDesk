import { type NextPage } from "next"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import { ArrowUpDown, Check, Package, Search, X } from "lucide-react"
import ActionResponsePopup, {
  type AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

type SortMode = "recent" | "alphabetic" | "mostBought"

const SORT_MODE_STORAGE_KEY = "buyPageSortMode"
const SORT_MODE_STORAGE_EVENT = "buyPageSortModeChange"
const sortModes: SortMode[] = ["recent", "alphabetic", "mostBought"]

const isSortMode = (value: string | null): value is SortMode => {
  return sortModes.includes(value as SortMode)
}

const getStoredSortMode = (): SortMode => {
  if (typeof window === "undefined") {
    return "recent"
  }

  const storedSortMode = window.localStorage.getItem(SORT_MODE_STORAGE_KEY)
  return isSortMode(storedSortMode) ? storedSortMode : "recent"
}

const subscribeToSortMode = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(SORT_MODE_STORAGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(SORT_MODE_STORAGE_EVENT, onStoreChange)
  }
}

const CATEGORY_FILTER_STORAGE_KEY_PREFIX = "buyPageCategoryFilter:"

type CategoryOverrides = { [index: string]: boolean }

const parseCategoryOverrides = (value: string | null): CategoryOverrides => {
  if (!value) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
      ),
    )
  } catch {
    return {}
  }
}

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getBuyable.useQuery()
  const allCategoriesRequest = api.category.getAll.useQuery()
  const userDataRequest = api.user.getMe.useQuery()
  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const [searchString, setSearchString] = useState("")
  const sortMode = useSyncExternalStore(subscribeToSortMode, getStoredSortMode, () => "recent")
  // category filter is remembered per user (in this browser)
  const categoryFilterStorageKey = userDataRequest.data?.id
    ? CATEGORY_FILTER_STORAGE_KEY_PREFIX + userDataRequest.data.id
    : null
  const storedCategoryOverrides = useSyncExternalStore(
    subscribeToSortMode,
    () => (categoryFilterStorageKey ? window.localStorage.getItem(categoryFilterStorageKey) : null),
    () => null,
  )
  const categoryOverrides = useMemo(
    () => parseCategoryOverrides(storedCategoryOverrides),
    [storedCategoryOverrides],
  )
  const setCategoryOverrides = (
    update: CategoryOverrides | ((current: CategoryOverrides) => CategoryOverrides),
  ) => {
    if (!categoryFilterStorageKey) {
      return
    }
    const newOverrides = typeof update === "function" ? update(categoryOverrides) : update
    window.localStorage.setItem(categoryFilterStorageKey, JSON.stringify(newOverrides))
    window.dispatchEvent(new Event(SORT_MODE_STORAGE_EVENT))
  }

  const apiBuyOneItemMultiple = api.item.buyItem.useMutation()
  const apiBuyDeposit = api.item.buyDeposit.useMutation()

  const handleSortModeChange = (newSortMode: SortMode) => {
    window.localStorage.setItem(SORT_MODE_STORAGE_KEY, newSortMode)
    window.dispatchEvent(new Event(SORT_MODE_STORAGE_EVENT))
  }

  const buyAction = async (itemID: string, quantity: number = 1): Promise<void> => {
    try {
      await apiBuyOneItemMultiple.mutateAsync({ productID: itemID, quantity })

      const message = quantity === 1
        ? "Erfolgreich gekauft!"
        : `${quantity}x erfolgreich gekauft!`
      animate(animationRef, "success", message)
      await trpcUtils.user.invalidate()
      await trpcUtils.item.getBuyable.invalidate()
    } catch (error: any) {
      console.error(error)
      animate(animationRef, "failure", error.message)
      throw error
    }
  }

  const buyDepositAction = async (itemID: string, quantity: number = 1): Promise<void> => {
    try {
      await apiBuyDeposit.mutateAsync({ productID: itemID, quantity })
      const message = quantity === 1
        ? "Pfand erfolgreich gekauft!"
        : `${quantity}x Pfand erfolgreich gekauft!`
      animate(animationRef, "success", message)
      await trpcUtils.user.invalidate()
    } catch (error: any) {
      console.error(error)
      animate(animationRef, "failure", error.message)
      throw error
    }
  }

  const allRelevantCategories = allCategoriesRequest.data?.filter((category) => {
    // filter out categories that are not relevant for the buy page (e.g. group orders)
    return category.items.filter((item) => !item.for_grouporders).length > 0
  })

  const defaultDisplayCategories: { [index: string]: boolean } = {}
  allRelevantCategories?.forEach((category) => {
    defaultDisplayCategories[category.id] = category.defaultUnfoldedDisplay
  })

  const displayCategories = {
    ...defaultDisplayCategories,
    ...categoryOverrides,
  }

  const displayedItems = allItemsRequest.data
    ?.filter((item) => {
      const categoryShown = item.categories.some(
        (category) => displayCategories[category.id] == true,
      )
      const searchShown = item.name.toLowerCase().includes(searchString.toLowerCase())
      return categoryShown && searchShown
    })
    .sort((a, b) => {
      const nameComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase())

      if (sortMode === "alphabetic") {
        return nameComparison
      }
      else if (sortMode === "mostBought") {
        if (a.userOrderCount !== b.userOrderCount) {
          return b.userOrderCount - a.userOrderCount
        }
        return nameComparison
      }
      else {
        const aLastBoughtAt = a.userLastBoughtAt?.getTime() ?? 0
        const bLastBoughtAt = b.userLastBoughtAt?.getTime() ?? 0
        if (aLastBoughtAt !== bLastBoughtAt) {
          return bLastBoughtAt - aLastBoughtAt
        }
        return nameComparison
      }
    })

  const selectedCategoriesCount = Object.values(displayCategories).filter(Boolean).length
  const allCategoriesSelected = selectedCategoriesCount === allRelevantCategories?.length
  const noCategoriesSelected = selectedCategoriesCount === 0

  const handleSelectAllCategories = () => {
    const newState: { [index: string]: boolean } = {}
    allRelevantCategories?.forEach((category) => {
      newState[category.id] = true
    })
    setCategoryOverrides(newState)
  }

  const handleClearAllCategories = () => {
    const newState: { [index: string]: boolean } = {}
    allRelevantCategories?.forEach((category) => {
      newState[category.id] = false
    })
    setCategoryOverrides(newState)
  }

  const clearSearch = () => {
    setSearchString("")
  }

  return (
    <RegularPage>
      <div className="flex flex-col space-y-6">
        {/* Search and Filter Section */}
        <div className="card border border-base-300 bg-base-200 shadow-sm">
          <div className="card-body gap-4 p-4">
            {/* Search and Sorting */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="input w-full sm:flex-1">
                <Search className="h-4 w-4 shrink-0 text-base-content/50" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Nach Produkten suchen..."
                  aria-label="Produktsuche"
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                />
                {searchString && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="btn btn-ghost btn-circle btn-xs"
                    aria-label="Suche leeren"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>

              <label className="select w-full sm:w-56">
                <ArrowUpDown className="h-4 w-4 shrink-0 text-base-content/50" />
                <select
                  aria-label="Sortierung"
                  value={sortMode}
                  onChange={(e) => handleSortModeChange(e.target.value as SortMode)}
                >
                  <option value="recent">Zuletzt gekauft</option>
                  <option value="alphabetic">Alphabetisch</option>
                  <option value="mostBought">AI (activity indicator)</option>
                </select>
              </label>
            </div>

            <div className="border-t border-base-300" />

            {/* Category Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">Kategorien</span>
                  <span className="text-xs text-base-content/60">
                    {displayedItems ? (
                      <>
                        {displayedItems.length} Produkt{displayedItems.length !== 1 ? "e" : ""}
                      </>
                    ) : (
                      "Lade..."
                    )}
                  </span>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="btn btn-ghost btn-xs"
                    disabled={allCategoriesSelected}
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllCategories}
                    className="btn btn-ghost btn-xs"
                    disabled={noCategoriesSelected}
                  >
                    Keine
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {allRelevantCategories?.filter(i => i.is_active).map((category) => {
                  const isSelected = displayCategories[category.id] === true
                  const itemCount = category.items.filter(item => !item.for_grouporders && item.is_active).length

                  return (
                    <button
                      type="button"
                      key={category.id}
                      aria-pressed={isSelected}
                      className={`btn btn-sm rounded-full font-normal transition-colors ${isSelected
                        ? "btn-primary"
                        : "btn-outline border-base-300"
                        }`}
                      onClick={() => {
                        const id = category.id
                        setCategoryOverrides((dc) => ({ ...dc, [id]: !displayCategories[id] }))
                      }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      <span>{category.name}</span>
                      <span className="text-xs opacity-60">{itemCount}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-4">
          {/* No Results Message */}
          {displayedItems?.length === 0 && (
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
                  buyDepositAction={buyDepositAction}
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
