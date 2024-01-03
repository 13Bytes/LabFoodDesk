import { User } from "@prisma/client"
import { TRPCClientErrorLike } from "@trpc/client"
import { group } from "console"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import GroupOrderDetailView from "~/components/FormElements/GroupOrderDetailView"
import ActionResponsePopup, { AnimationHandle } from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import ItemCard from "~/components/General/temCard"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { api } from "~/utils/api"

const GroupOrders: NextPage = () => {
  const trpcUtils = api.useContext()

  const groupOrderRequest = api.groupOrders.getRelevant.useQuery()
  const groupOrdersInProgress = api.groupOrders.getInProgress.useQuery()
  const groupOrderItems = api.item.getGroupBuyItems.useQuery()
  const groupOrderPocurementItems = api.item.getGroupBuyProcurementItems.useQuery()
  const buyItemRequest = api.groupOrders.buyGroupOrderItem.useMutation()
  const procureItemRequest = api.groupOrders.procureGroupOrderItem.useMutation()
  const stopOrderRequest = api.groupOrders.stopOrders.useMutation()
  const sessionUser = useSession().data?.user
  const animationRef = useRef<AnimationHandle>(null)

  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [selectedGroupOrder, setSetselectedGroupOrder] = useState<string>()

  const joinGroupOrder = (groupOrderID: string) => {
    setSetselectedGroupOrder(groupOrderID)
    setOpenBuyModal(true)
  }

  const buyItemInGroupOrder = async (
    groupId: string,
    itemID: string,
    type: "procurement" | "order"
  ) => {
    if (type === "order") {
      await buyItemRequest.mutateAsync(
        { groupId, items: [itemID] },
        {
          onError: (error) => {
            console.error(error)
            if (animationRef.current) {
              animationRef.current.failure()
            }
          },
          onSuccess: () => {
            if (animationRef.current) {
              animationRef.current.success()
            }
          },
        }
      )
    } else if (type === "procurement") {
      await procureItemRequest.mutateAsync(
        { groupId, items: [itemID] },
        {
          onError: (error) => {
            console.error(error)
            if (animationRef.current) {
              animationRef.current.failure()
            }
          },
          onSuccess: () => {
            if(animationRef.current){
              animationRef.current.success()
            }
          },
        }
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
          {groupOrderRequest.data?.map((group) => (
            <div key={group.id} className="card mb-5 max-w-5xl bg-base-200 p-3">
              <div className="flex  flex-col justify-start gap-1 p-1">
                <div className="flex flex-row items-end justify-between">
                  <h1 className="text-2xl font-bold">
                    {group.ordersCloseAt.toLocaleString("de", localStringOptions)}
                  </h1>
                  <p className="mr-5 text-lg font-bold">{group.name}</p>
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {[...group.orders, ...group.procurementWishes].map((o) => (
                    <UserItem key={o.id} orderId={o.id} userName={o.user.name} />
                  ))}
                </div>

                <div className="flex flex-row  justify-between">
                  <button className="btn-primary btn btn-sm mt-7" onClick={() => joinGroupOrder(group.id)}>
                    {group.orders.some((order) => order.userId === sessionUser?.id) ||
                    group.procurementWishes.some((wish) => wish.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                  {new Date() > group.ordersCloseAt && sessionUser?.is_admin && (
                    <button
                      className="btn-warning btn mt-7"
                      onClick={() => {
                        stopOrderRequest.mutate({ groupId: group.id })
                        trpcUtils.groupOrders.invalidate()
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
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal} className="!w-9/12 !max-w-5xl pr-10">
        <div className="flex flex-row flex-wrap gap-4">
          {groupOrderPocurementItems.data?.map((item) => (
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
      <div className="placeholder avatar">
        <div className="w-12 rounded-full bg-neutral-focus text-neutral-content">
          <span>{getUsernameLetters(props.userName)}</span>
        </div>
      </div>
    </div>
  )
}

export default GroupOrders
