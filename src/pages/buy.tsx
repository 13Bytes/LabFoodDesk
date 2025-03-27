import { type NextPage } from "next"
import { useEffect, useRef, useState } from "react"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getBuyable.useQuery()
  const allCategoriesRequest = api.category.getAll.useQuery()
  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const [searchString, setSearchString] = useState("")
  const [displayCategories, setDisplayCategories] = useState<{ [index: string]: boolean }>({})

  const displayedItems = allItemsRequest.data?.filter((item) => {
    const categoryShown = item.categories.some((category) => displayCategories[category.id] == true)
    const searchShown = item.name.toLowerCase().includes(searchString.toLowerCase())
    return (categoryShown && searchShown)
  }).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const buyAction = async (itemID: string) => {
    await apiBuyOneItem.mutateAsync(
      { productID: itemID },
      {
        onError: (error) => {
          console.error(error)
          animate(animationRef, "failure", error.message)
        },
        onSuccess: async () => {
          animate(animationRef, "success")
          await trpcUtils.user.invalidate()
        },
      },
    )
  }

  useEffect(() => {
    if (allCategoriesRequest.data) {
      const categories = allCategoriesRequest.data
      const displayCategories: { [index: string]: boolean } = {}
      categories.forEach((category) => {
        displayCategories[category.id] = category.defaultUnfoldedDisplay
      })
      setDisplayCategories(displayCategories)
    }
  }, [setDisplayCategories, allCategoriesRequest.data])

  return (
    <RegularPage>
      <div className="flex flex-col">
        <div className="flex flex-row justify-end">
          <div className="">
            <input
              type="text"
              placeholder="Suche"
              className="input input-bordered w-full max-w-xs"
              onChange={(e) => {
                setSearchString(e.target.value)
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-row flex-wrap justify-center gap-2">
          {allCategoriesRequest.data?.filter( 
            (category) => allItemsRequest.data?.filter( 
              (item) => {
                return item.categories.some((item_category) => item_category == category)
              }).length !== 0 
            )
            .map((category) => (
            <div
              className={`badge ${displayCategories[category.id] == true ? "badge-outline" : "badge-ghost"}  cursor-pointer`}
              onClick={() => {
                const id = category.id
                setDisplayCategories((dc) => ({ ...dc, [id]: !dc[id] }))
              }}
            >
              {category.name}
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-row flex-wrap justify-center gap-2">
          {displayedItems?.map((item) => (
            <BuyItemCard key={item.id} item={item} buyAction={buyAction} />
          ))}
        </div>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </RegularPage>
  )
}

export default BuyPage
