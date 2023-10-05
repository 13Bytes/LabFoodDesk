import { type NextPage } from "next"
import { useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle } from "~/components/General/ActionResponsePopup"
import ItemCard from "~/components/General/ItemCard"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const [searchString, setSearchString] = useState("")
  const animationRef = useRef<AnimationHandle>(null)

  const displayedItems = allItemsRequest.data?.filter((item) => {
    return item.name.toLowerCase().includes(searchString.toLowerCase())
  })

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const buyAction = (itemID: string) => {
    try {
      apiBuyOneItem.mutate({ productID: itemID })
      if (animationRef.current) {
        animationRef.current.success()
      }
    } catch (error) {
      console.error(error)
      if (animationRef.current) {
        animationRef.current.failure()
      }
    }
  }

  return (
    <>
      <div className="flex flex-grow flex-col">
        <div className="self-end pr-3 pt-1">
          <input
            type="text"
            placeholder="Suche"
            className="input-bordered input w-full max-w-xs"
            onChange={(e) => {
              setSearchString(e.target.value)
            }}
          />
        </div>

        <div className="flex flex-row flex-wrap items-center justify-start gap-2 sm:p-4 md:p-7">
          {displayedItems?.map((item) => (
            <ItemCard item={item} buyAction={buyAction} />
          ))}
        </div>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default BuyPage
