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
  const sessionUser = useSession().data?.user
  const animationRef = useRef<AnimationHandle>(null)

  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [setselectedGroupOrder, setSetselectedGroupOrder] = useState<string>()

  const joinGroupOrder = (groupOrderID: string) => {
    setSetselectedGroupOrder(groupOrderID)
    setOpenBuyModal(true)

    // if (animationRef.current) {
    //   animationRef.current.failure()
    // }
  }

  return (
    <>
      <CenteredPage>
        <div className="container">
          {groupOrderRequest.data?.map((order) => (
            <div className="card mb-5 max-w-5xl bg-base-200 p-3">
              <div className="flex  flex-col justify-start gap-1 p-1">
                <div className="flex flex-row items-end justify-between">
                  <h1 className="text-2xl font-bold">
                    {order.ordersCloseAt.toLocaleString("de", localStringOptions)}
                  </h1>
                  <p className="mr-5">{order.name}</p>
                </div>

                <div>
                  {order.orders.map((o) => (
                    <div className="w-12 rounded-full bg-neutral-focus text-neutral-content">
                      <span>{getUsernameLetters(o.user.name)}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <button className="btn-primary btn mt-7" onClick={() => joinGroupOrder(order.id)}>
                    {order.orders.some((order) => order.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal}>
        {groupOrderItems.data?.map((item) => (
          <ItemCard item={item} buyAction={() => {}} />
        ))}
      </Modal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GroupOrders
