import { group } from "console"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle } from "~/components/General/ActionResponsePopup"
import ItemCard from "~/components/General/ItemCard"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { api } from "~/utils/api"

const GroupOrders: NextPage = () => {
  const groupOrderRequest = api.groupOrders.getRelevant.useQuery()
  const groupOrderItems = api.item.getGroupBuyOptions.useQuery()
  const buyItemRequest = api.groupOrders.buyGroupOrderItem.useMutation()
  const sessionUser = useSession().data?.user
  const animationRef = useRef<AnimationHandle>(null)

  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [selectedGroupOrder, setSetselectedGroupOrder] = useState<string>()

  const joinGroupOrder = (groupOrderID: string) => {
    setSetselectedGroupOrder(groupOrderID)
    setOpenBuyModal(true)
  }

  const buyItemInGroupOrder = async (groupId: string, itemID: string) => {
    await buyItemRequest.mutateAsync({ groupId, items: [itemID] })
    setOpenBuyModal(false)
    if (animationRef.current) {
      animationRef.current.success()
    }
  }

  return (
    <>
      <CenteredPage>
        <div className="container">
          {groupOrderRequest.data?.map((group) => (
            <div key={group.id} className="card mb-5 max-w-5xl bg-base-200 p-3">
              <div className="flex  flex-col justify-start gap-1 p-1">
                <div className="flex flex-row items-end justify-between">
                  <h1 className="text-2xl font-bold">
                    {group.ordersCloseAt.toLocaleString("de", localStringOptions)}
                  </h1>
                  <p className="mr-5">{group.name}</p>
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {group.orders.map((o) => (
                    <div key={o.id} className="tooltip tooltip-top" data-tip={o.user.name}>
                      <div className="placeholder avatar">
                        <div className="w-12 rounded-full bg-neutral-focus text-neutral-content">
                          <span>{getUsernameLetters(o.user.name)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <button className="btn-primary btn mt-7" onClick={() => joinGroupOrder(group.id)}>
                    {group.orders.some((order) => order.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal} className="!w-9/12 !max-w-5xl pr-10">
        <div className="flex flex-row flex-wrap gap-4">
          {groupOrderItems.data?.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              buyAction={() => void buyItemInGroupOrder(selectedGroupOrder!, item.id)}
            />
          ))}
        </div>
      </Modal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GroupOrders
