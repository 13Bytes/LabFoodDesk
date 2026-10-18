import type { inferRouterOutputs } from "@trpc/server"
import { Coins, ListTodo, Undo2 } from "lucide-react"
import { useState } from "react"
import { localStringOptions } from "~/helper/globalTypes"
import type { AppRouter } from "../../server/api/root"
import OrderSummaryModal from "../PageComponents/OrderSummaryModal"
import GroupOrderSplit from "./GroupOrderSplit"

type RouterOutput = inferRouterOutputs<AppRouter>

type Props = {
  group: RouterOutput["groupOrders"]["getInProgress"][number]
}
const GroupOrderDetailView = (props: Props) => {
  const { group } = props

  const [openOrderSummaryModal, setOpenOrderSummaryModal] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const itemBuys = group.orders.filter((o) => !o.canceled && o.items.length > 0)

  const actions = (
    <div className="flex flex-row gap-2">
      <button className="btn btn-primary btn-sm" onClick={() => setShowSplit(!showSplit)}>
        {showSplit ? <Undo2 className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
        {showSplit ? "Zurück" : "Abrechnung"}
      </button>
      {!showSplit && (
        <button className="btn btn-primary btn-sm" onClick={() => setOpenOrderSummaryModal(true)}>
          <ListTodo className="h-4 w-4" />
          Einkaufsliste
        </button>
      )}
    </div>
  )
  return (
    <>
      <div className="container">
        <div key={group.id} className="card mx-auto mb-5 max-w-5xl border border-base-300 dither bg-linear-to-br from-base-100 to-base-200 p-3 shadow-sm">
          <div className="flex  flex-col justify-start gap-1 p-1">
            <div className="flex flex-row items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <p className="mt-1 mb-3 text-sm text-base-content/70">
                  Einkauf: <span className="font-semibold">{group.shopper?.name ?? "noch offen"}</span>
                </p>
              </div>
              {!!group.closedBy && (
                <p className="text-sm text-red-500">
                  <span className="font-bold">{group.revertedBy?.name} </span> hat Abrechnung von{" "}
                  {group.closedBy?.name} storniert!
                </p>
              )}
              <p className="text-md font-bold">
                {group.ordersCloseAt.toLocaleString("de", localStringOptions)}
              </p>
            </div>

            {showSplit ? (
              <GroupOrderSplit group={group} actions={actions} />
            ) : (
              <>
                <div>
                  {group.procurementWishes.length > 0 && (
                    <div>
                      <div className="divider text-sm text-base-content/60">Gruppen-Artikel</div>
                      <table className="table">
                        <tbody>
                          {group.procurementWishes.map((o) =>
                            o.items.map((item, id) => (
                              <tr key={`${item.id}-${o.id}-${id}`}>
                                <th>{o.user?.name}</th>
                                <td>{item.name}</td>
                              </tr>
                            )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {itemBuys.length > 0 && (
                    <div>
                      <div className="divider text-sm text-base-content/60">Einzel-Artikel</div>
                      <table className="table">
                        <tbody>
                          {itemBuys.map((o) => (
                            <tr key={o.id}>
                              <th>{o.user?.name}</th>
                              <td>{o.items.map((mpng) => mpng.item.name).join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">{actions}</div>
              </>
            )}
          </div>
        </div>
      </div>
      <OrderSummaryModal
        order={group}
        open={openOrderSummaryModal}
        setOpen={setOpenOrderSummaryModal}
      />
    </>
  )
}

export default GroupOrderDetailView
