import { type NextPage } from "next"
import { useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle, animate } from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getBuyable.useQuery()
  const [searchString, setSearchString] = useState("")
  const animationRef = useRef<AnimationHandle>(null)

  const displayedItems = allItemsRequest.data?.filter((item) => {
    return item.name.toLowerCase().includes(searchString.toLowerCase())
  })

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const buyAction = (itemID: string) => {
      apiBuyOneItem.mutate(
        { productID: itemID },
        {
          onError: (error) => {
            console.error(error)
            animate(animationRef, "failure", error.message)
          },
          onSuccess: () => {
            animate(animationRef, "success")
          }
        }
      )
  }

  return (
    <RegularPage>
      <div className="flex flex-grow flex-col">
        <div className="self-end pt-1">
          <input
            type="text"
            placeholder="Suche"
            className="input-bordered input w-full max-w-xs"
            onChange={(e) => {
              setSearchString(e.target.value)
            }}
          />
        </div>

        <div className="flex flex-row flex-wrap justify-center gap-2 mt-7 sm:p-4 md:p-7">
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
