import { type NextPage } from "next"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/PageComponents/SendMoney"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()

  return (
    <>
      <CenteredPage>
        <h3 className="text-xl">Guthaben aller User</h3>
        <div className="mt-5 flex items-center gap-1 overflow-auto">
          <div className="grid grid-cols-2 items-center gap-y-1">
            {allBalancesRequest.data?.map((user) => (
              <>
                  <div className="bg-base-300 px-4 p-2 rounded-l-lg">{user.name}</div>
                  <div className={`bg-base-300 p-2 rounded-r-lg ${user.balance >= 0 ? "text-green-600" : "text-red-700"}`}>
                    {user.balance.toFixed(2)}€
                  </div>
              </>
            ))}
          </div>
        </div>
      </CenteredPage>
    </>
  )
}

export default SplitPage
