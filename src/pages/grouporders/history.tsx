import { User } from "@prisma/client"
import { TRPCClientErrorLike } from "@trpc/client"
import { group } from "console"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import GroupOrderDetailView from "~/components/FormElements/GroupOrderDetailView"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import ItemCard from "~/components/General/ItemCard"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { api } from "~/utils/api"

const GroupOrdersHistory: NextPage = () => {
  const trpcUtils = api.useContext()

  const groupOrdersLatelyClosed = api.groupOrders.getLatelyClosed.useQuery()

  const sessionUser = useSession().data?.user

  return (
    <>
      <CenteredPage>
        <div className="container">
          {groupOrdersLatelyClosed.data?.map((group) => (
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
                    <div className="flex flex-row flex-wrap gap-2 overflow-x-auto">
                      <h2 className="font-bold">Artikel-Übersicht</h2>
                      <table className="table-zebra table-sm table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Artikel</th>
                            <th>Preis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orders.map((transaction) => { if (transaction.type < 3) { return(
                            <tr key={`${transaction.id}`}>
                              <td>
                                <p className="font-semibold">{transaction.user.name}</p>
                              </td>
                              <td>
                                {[...transaction.items, ...transaction.procurementItems]
                                  .map((item) => item.item.name)
                                  .concat(", ")}
                              </td>
                              <td>{transaction.totalAmount.toFixed(2)}€</td>
                            </tr>
                          )}
                          else{
                            return null
                          }})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end px-3">
                    <div className="flex flex-col items-end">
                    <p className="text-xs">Abgerechnet durch <span className="font-semibold">{group.closedBy?.name}</span></p>
                    <p className="text-xs">Gutschrift an <span className="font-semibold">{group.orders.find(order => order.type === 3)?.moneyDestination?.name ?? "LabEats"}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CenteredPage>
    </>
  )
}

export default GroupOrdersHistory
