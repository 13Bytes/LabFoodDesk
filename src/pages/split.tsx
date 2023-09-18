import { type NextPage } from "next"
import { useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const [searchString, setSearchString] = useState("")
  const displayedItems = allItemsRequest.data?.filter((item) => {
    return item.name.toLowerCase().includes(searchString.toLowerCase())
  })

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const buyAction = (itemID:string) => {
    apiBuyOneItem.mutate({productID: itemID})
  }

  return (
    <>
    
    </>
  )
}

export default SplitPage
