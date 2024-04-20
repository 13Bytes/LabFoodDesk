import { type NextPage } from "next"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/PageComponents/SendMoney"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()

  return (
    <>
      <CenteredPage>
        <h3 className="mt-12 self-start text-xl">Geld senden</h3>
        <SendMoney />

        <h3 className="mt-12 self-start text-xl">Übersicht</h3>
        <div className="flex flex-row flex-wrap items-center gap-1">
          <div className="flex flex-row items-center overflow-x-auto">
            <table className="table">
              <tbody>
                {allBalancesRequest.data?.map((user) => (
                  <tr key={user.id}>
                    <th>{user.name}</th>
                    <td className={`${user.balance >= 0 ? "text-green-600" : "text-red-700"}`}>
                      {user.balance.toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CenteredPage>
    </>
  )
}

export default SplitPage
