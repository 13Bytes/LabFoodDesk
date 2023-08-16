import { type NextPage } from "next"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const BuyPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()

  return (
    <>
      <CenteredPage>
        {allItemsRequest.data?.map((item) => (
          <p key={item.id}>{item.name}</p>
        ))}
      </CenteredPage>
    </>
  )
}

export default BuyPage
