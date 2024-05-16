import type { inferRouterOutputs } from "@trpc/server"
import { localStringOptions } from "~/helper/globalTypes"
import type { AppRouter } from "../../server/api/root"
import GroupOrderSplit from "./GroupOrderSplit"

type RouterOutput = inferRouterOutputs<AppRouter>

type Props = {
  group: RouterOutput["groupOrders"]["getInProgress"][number]
}
const GroupOrderDetailView = (props: Props) => {
  const { group } = props

  return (
    <div className="container">
      <div key={group.id} className="card mb-5 max-w-5xl bg-base-200 p-3">
        <div className="flex  flex-col justify-start gap-1 p-1">
          <div className="flex flex-row items-end justify-between">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-md font-bold">
                    {group.ordersCloseAt.toLocaleString("de", localStringOptions)}
            </p>
          </div>

          <div>
            <div className="flex flex-row flex-wrap gap-2">
              <h2 className="font-bold">Gruppen-Artikel</h2>
              <table className="table table-sm">
                <tbody>
                  {group.procurementWishes.map((o) =>
                    o.items.map((item, id) => (
                      <tr key={`${item.id}-${o.id}-${id}`}>
                        <th>{o.user?.name}</th>
                        <td>{item.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {group.orders.length >= 1 && (
              <div className="mt-5">
                <h2 className="font-bold">Gekaufte Einzel-Artikel</h2>
                <div className="flex flex-row flex-wrap gap-2">
                  <table className="table">
                    <tbody>
                      {group.orders.map((o) => (
                        <tr key={o.id}>
                          <th>{o.user?.name}</th>
                          <td>{o.items.map(mpng => mpng.item.name)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="divider"></div> 
          <h1 className="text-lg font-bold">Gruppen-Artikel Abrechnung</h1>
          <GroupOrderSplit group={group} />
        </div>
      </div>
    </div>
  )
}

export default GroupOrderDetailView
