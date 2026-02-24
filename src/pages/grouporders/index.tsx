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
import { ConfirmationModal } from "~/components/General/ConfirmationModal"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { type Tid } from "~/helper/zodTypes"
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

  const [closeOrderId, setCloseOrderId] = useState<Tid>()

  const closeOrderAction = async () => {
    if (closeOrderId) {
      await stopOrderRequest.mutateAsync({ groupId: closeOrderId })
      trpcUtils.groupOrders.invalidate()
    }
    setCloseOrderId(undefined)
  }

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
          {groupOrderRequest.data?.map((groupOrder) => (
            <div key={groupOrder.id} className="card mb-5 max-w-5xl bg-base-200 p-3">
              <div className="flex flex-col justify-start gap-1 p-1">
                <div className="flex flex-col items-start justify-between md:flex-row md:items-end">
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
                    </tr>
                  </thead>
                  <tbody>
                    {groupOrder.procurementWishes.map((pc) => {
                      return (
                        <tr key={`${pc.id}`}>
                          <td>
                            <p className="font-semibold">{pc.user.name}</p>
                          </td>
                          <td>
                            {pc.items.map((item) => item.name).join(", ")}
                            {pc.userId === sessionUser?.id && (
                              <button
                                className="btn btn-outline btn-xs ml-3"
                                onClick={() => rescindProcurement(pc.id)}
                              >
                                stornieren
                              </button>
                            )}
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

                <div className="flex flex-row justify-between items-center">
                  <button
                    className="btn btn-primary btn-sm mt-7"
                    onClick={() => joinGroupOrder(groupOrder.id)}
                  >
                    {groupOrder.orders.some((order) => order.userId === sessionUser?.id) ||
                      groupOrder.procurementWishes.some((wish) => wish.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                  {new Date() > groupOrder.ordersCloseAt && (
                    <button
                      className="btn btn-warning btn-sm !flex !flex-col items-center justify-center mt-7 max-md:h-12 py-0 leading-tight"
                      onClick={() => {
                        setCloseOrderId(groupOrder.id)
                      }}
                    >
                      Bestellung schließen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="container">
          {groupOrdersInProgress.data?.map((group) => (
            <GroupOrderDetailView key={group.id} group={group} />
          ))}
        </div>

        <div className="container ">
          <Link href="/grouporders/history" role="button" className="btn btn-ghost">
            History
          </Link>
        </div>
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal} className="!w-11/12 !max-w-5xl pt-11">
        <div className="flex flex-row flex-wrap justify-center gap-4">
          {groupOrderProcurementItems.data?.map((item) => (
            <BuyItemCard
              key={item.id}
              item={item}
              buttonName="Wünschen"
              buyAction={async () => {
                await buyItemInGroupOrder(selectedGroupOrder!, item.id, "procurement")
              }}
            />
          ))}
          {groupOrderItems.data?.map((item) => (
            <BuyItemCard
              key={item.id}
              item={item}
              buyAction={async () => {
                await buyItemInGroupOrder(selectedGroupOrder!, item.id, "order")
              }}
            />
          ))}
        </div>
      </Modal>

      <ConfirmationModal
        open={!!closeOrderId}
        proceed={closeOrderAction}
        close={() => setCloseOrderId(undefined)}
      >
        <p className="py-4">
          Ich kaufe jetzt ein - Bestellung für <span className="font-bold">ALLE</span> stoppen!
        </p>
      </ConfirmationModal>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

const UserItem = (props: { orderId: string; userName: string | null }) => {
  return (
    <div key={props.orderId} className="tooltip tooltip-top" data-tip={props.userName}>
      <div className="avatar placeholder">
        <div className="w-12 rounded-full bg-base-100 text-neutral-content">
          <span>{getUsernameLetters(props.userName)}</span>
        </div>
      </div>
    </div>
  )
}

export default GroupOrders
