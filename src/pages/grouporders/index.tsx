import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRef, useState } from "react"
import GroupOrderDetailView from "~/components/FormElements/GroupOrderDetailView"
import ActionResponsePopup, {
  animate,
  type AnimationHandle,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import ItemCard from "~/components/General/ItemCard"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

const GroupOrders: NextPage = () => {
  const trpcUtils = api.useUtils()

  const groupOrderRequest = api.groupOrders.getRelevant.useQuery()
  const groupOrdersInProgress = api.groupOrders.getInProgress.useQuery()
  const groupOrderItems = api.item.getGroupBuyItems.useQuery()
  const groupOrderProcurementItems = api.item.getGroupBuyProcurementItems.useQuery()
  const buyItemRequest = api.groupOrders.buyGroupOrderItem.useMutation()
  const procureItemRequest = api.groupOrders.procureGroupOrderItem.useMutation()
  const undoProcureGroupOrderItemRequest = api.groupOrders.undoProcureGroupOrderItem.useMutation()
  const stopOrderRequest = api.groupOrders.stopOrders.useMutation()
  const sessionUser = useSession().data?.user
  const animationRef = useRef<AnimationHandle>(null)

  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [selectedGroupOrder, setSetselectedGroupOrder] = useState<string>()

  const joinGroupOrder = (groupOrderID: string) => {
    setSetselectedGroupOrder(groupOrderID)
    setOpenBuyModal(true)
  }
  const rescindProcurement = async (procurementWishId: Tid) => {
    await undoProcureGroupOrderItemRequest.mutateAsync({ procurementWishId })
    await trpcUtils.transaction.invalidate()
    await trpcUtils.groupOrders.invalidate()
    await trpcUtils.user.invalidate()
  }

  const buyItemInGroupOrder = async (
    groupId: string,
    itemID: string,
    type: "procurement" | "order",
  ) => {
    if (type === "order") {
      await buyItemRequest.mutateAsync(
        { groupId, item: itemID },
        {
          onError: (error) => {
            console.error(error)
            animate(animationRef, "failure", error.message)
          },
          onSuccess: () => {
            animate(animationRef, "success")
          },
        },
      )
    } else if (type === "procurement") {
      await procureItemRequest.mutateAsync(
        { groupId, items: [itemID] },
        {
          onError: (error) => {
            console.error(error)
            animate(animationRef, "failure", error.message)
          },
          onSuccess: () => {
            animate(animationRef, "success")
          },
        },
      )
    }
    setOpenBuyModal(false)
    await trpcUtils.groupOrders.invalidate()
  }

  return (
    <>
      <CenteredPage>
        <div className="container">
          {groupOrdersInProgress.data?.map((group) => (
            <GroupOrderDetailView key={group.id} group={group} />
          ))}
        </div>

        <div className="container">
          {groupOrderRequest.data?.map((groupOrder) => (
            <div key={groupOrder.id} className="card mb-5 max-w-5xl bg-base-200 p-3">
              <div className="flex  flex-col justify-start gap-1 p-1">
                <div className="flex flex-row items-end justify-between">
                  <h1 className="text-2xl font-bold">
                    {groupOrder.ordersCloseAt.toLocaleString("de", localStringOptions)}
                  </h1>
                  <p className="mr-5 text-lg font-bold">{groupOrder.name}</p>
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {[...groupOrder.orders, ...groupOrder.procurementWishes].map((o) => (
                    <UserItem key={o.id} orderId={o.id} userName={o.user.name} />
                  ))}
                </div>

                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Artikel</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupOrder.procurementWishes.map((pc) => {
                      return (
                        <tr key={`${pc.id}`}>
                          <td>
                            <p className="font-semibold">{pc.user.name}</p>
                          </td>
                          <td>{pc.items.map((item) => item.name).join(", ")}</td>
                          <td>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={() => rescindProcurement(pc.id)}
                            >
                              stornieren
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {groupOrder.orders.map((o) => {
                      return (
                        <tr key={`${o.id}`}>
                          <td>
                            <p className="font-semibold">{o.user.name}</p>
                          </td>
                          <td>{o.items.map((item) => item.item.name).join(", ")}</td>
                          <td></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="flex flex-row  justify-between">
                  <button
                    className="btn btn-primary btn-sm mt-7"
                    onClick={() => joinGroupOrder(groupOrder.id)}
                  >
                    {groupOrder.orders.some((order) => order.userId === sessionUser?.id) ||
                    groupOrder.procurementWishes.some((wish) => wish.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                  {new Date() > groupOrder.ordersCloseAt && sessionUser?.is_admin && (
                    <button
                      className="btn btn-warning mt-7"
                      onClick={() => {
                        stopOrderRequest.mutate({ groupId: groupOrder.id })
                        setTimeout(() => trpcUtils.groupOrders.invalidate(), 50)
                      }}
                    >
                      Beenden
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="container ">
          <Link href="/grouporders/history" role="button" className="btn btn-ghost">
            History
          </Link>
        </div>
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal} className="!w-9/12 !max-w-5xl pr-10">
        <div className="flex flex-row flex-wrap gap-4">
          {groupOrderProcurementItems.data?.map((item) => (
            <ItemCard
              id={item.id}
              key={item.id}
              name={item.name}
              categories={item.categories}
              buttonName="Wünschen"
              buyAction={() =>
                void buyItemInGroupOrder(selectedGroupOrder!, item.id, "procurement")
              }
            />
          ))}
          {groupOrderItems.data?.map((item) => (
            <BuyItemCard
              key={item.id}
              item={item}
              buyAction={() => void buyItemInGroupOrder(selectedGroupOrder!, item.id, "order")}
            />
          ))}
        </div>
      </Modal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

const UserItem = (props: { orderId: string; userName: string | null }) => {
  return (
    <div key={props.orderId} className="tooltip tooltip-top" data-tip={props.userName}>
      <div className="avatar placeholder">
        <div className="bg-neutral-focus w-12 rounded-full text-neutral-content">
          <span>{getUsernameLetters(props.userName)}</span>
        </div>
      </div>
    </div>
  )
}

export default GroupOrders
