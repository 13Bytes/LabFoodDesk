import { type NextPage } from "next"

import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const GroupOrders: NextPage = () => {
  const groupOrderRequest = api.groupOrders.getRelevant.useQuery()

  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          {groupOrderRequest.data?.map((groupOrder) => (
            <p>{groupOrder.name}</p>
          ))}
        </div>
      </CenteredPage>
    </>
  )
}

export default GroupOrders
