import { type NextPage } from "next"
import { useEffect, useRef } from "react"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import BuyItemCardBig from "~/components/General/BuyItemCardBig"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

import { useRouter } from "next/router"
import CenteredPage from "~/components/Layout/CenteredPage"

const BuySingleItemPage: NextPage = () => {
  const router = useRouter()
  const trpcUtils = api.useUtils()

  const allItemsRequest = api.item.getBuyable.useQuery()
  const animationRef = useRef<AnimationHandle>(null)

  const userQuery = router.query.filter_string ?? ""
  const filterString = !Array.isArray(userQuery) ? (userQuery ?? "") : (userQuery[0] ?? "")

  const displayedItems = allItemsRequest.data?.filter((item) => {
    return item.name.toLowerCase().includes(filterString.toLowerCase())
  })

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
          setTimeout(() => router.push("/buy"), 1800)
        },
      },
    )
  }

  return (
    <CenteredPage className="gap-4">
      <p>
        <b>Items:</b> {filterString}
      </p>
      {displayedItems?.map((item) => (
        <BuyItemCardBig key={item.id} item={item} buyAction={buyAction} />
      ))}
      <ActionResponsePopup ref={animationRef} />
    </CenteredPage>
  )
}

export default BuySingleItemPage
