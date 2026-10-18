import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { History, Lock, Plus, ShoppingCart } from "lucide-react"
import { useRef, useState } from "react"
import GroupOrderDetailView from "~/components/FormElements/GroupOrderDetailView"
import ActionResponsePopup, {
  animate,
  type AnimationHandle,
} from "~/components/General/ActionResponsePopup"
import BuyItemCard from "~/components/General/BuyItemCard"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { UserAvatar } from "~/components/General/UserAvatar"

import CenteredPage from "~/components/Layout/CenteredPage"
import Modal from "~/components/Layout/Modal"
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
  const undoBuyGroupOrderItemRequest = api.groupOrders.undoBuyGroupOrderItem.useMutation()
  const stopOrderRequest = api.groupOrders.stopOrders.useMutation()
  const setShopperRequest = api.groupOrders.setShopper.useMutation()
  const setFilterCategoryRequest = api.groupOrders.setFilterCategory.useMutation()
  const sessionUser = useSession().data?.user
  const animationRef = useRef<AnimationHandle>(null)

  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [selectedGroupOrder, setSetselectedGroupOrder] = useState<string>()

  const [closeOrderId, setCloseOrderId] = useState<Tid>()

  // categories of all items that can be ordered - to filter the items of a group order
  const categories = [
    ...(groupOrderProcurementItems.data ?? []),
    ...(groupOrderItems.data ?? []),
  ]
    .flatMap((item) => item.categories)
    .filter((cat, index, all) => all.findIndex((other) => other.id === cat.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name))
  const filterCategoryId = groupOrderRequest.data?.find(
    (groupOrder) => groupOrder.id === selectedGroupOrder,
  )?.filterCategoryId
  const matchesFilter = (item: { categories: { id: Tid }[] }) =>
    !filterCategoryId || item.categories.some((cat) => cat.id === filterCategoryId)

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
  const setShopper = async (groupId: Tid, goShopping: boolean) => {
    await setShopperRequest.mutateAsync(
      { groupId, goShopping },
      { onError: (error) => animate(animationRef, "failure", error.message) },
    )
    await trpcUtils.groupOrders.invalidate()
  }
  const setFilterCategory = async (groupId: Tid, categoryId: Tid | null) => {
    await setFilterCategoryRequest.mutateAsync(
      { groupId, categoryId },
      { onError: (error) => animate(animationRef, "failure", error.message) },
    )
    await trpcUtils.groupOrders.invalidate()
  }
  const rescindBuy = async (transactionId: Tid) => {
    await undoBuyGroupOrderItemRequest.mutateAsync({ transactionId })
    await trpcUtils.groupOrders.invalidate()
  }

  const buyItemInGroupOrder = async (
    groupId: string,
    itemID: string,
    type: "procurement" | "order",
    quantity = 1,
  ) => {
    if (type === "order") {
      await buyItemRequest.mutateAsync(
        { groupId, item: itemID, quantity },
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
        { groupId, items: [itemID], quantity },
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
            <div key={groupOrder.id} className="card mx-auto mb-5 max-w-5xl border border-base-300 dither bg-linear-to-br from-base-100 to-base-200 p-3 shadow-sm">
              <div className="flex flex-col justify-start gap-1 p-1">
                <div className="flex flex-col items-start justify-between md:flex-row md:items-end">
                  <div>
                    <div className="flex flex-row flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold">{groupOrder.name}</h1>
                      {sessionUser?.is_admin || groupOrder.shopperId === sessionUser?.id ? (
                        <select
                          // looks like the other small outline buttons
                          className="select select-xs w-auto border-current bg-transparent font-semibold text-base-content/70"
                          value={groupOrder.filterCategoryId ?? ""}
                          onChange={(e) =>
                            setFilterCategory(groupOrder.id, e.target.value || null)
                          }
                        >
                          <option value="">Alle Kategorien</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        groupOrder.filterCategoryId && (
                          <span className="btn btn-outline btn-xs pointer-events-none text-base-content/70">
                            {categories.find((cat) => cat.id === groupOrder.filterCategoryId)?.name}
                          </span>
                        )
                      )}
                    </div>
                    <div className="mt-1 mb-3 flex flex-row items-center gap-2 text-sm text-base-content/70">
                      <span>
                        Einkauf:{" "}
                        <span className="font-semibold">
                          {groupOrder.shopper?.name ?? "noch offen"}
                        </span>
                      </span>
                      {groupOrder.shopperId === sessionUser?.id ? (
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => setShopper(groupOrder.id, false)}
                        >
                          austragen
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => setShopper(groupOrder.id, true)}
                        >
                          <ShoppingCart className="h-3 w-3" />
                          {groupOrder.shopperId ? "Ich gehe stattdessen" : "Ich gehe einkaufen"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-md font-bold">
                    {groupOrder.ordersCloseAt.toLocaleString("de", localStringOptions)}
                  </p>
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {[...groupOrder.orders, ...groupOrder.procurementWishes].map((o) => (
                    <UserItem key={o.id} orderId={o.id} userName={o.user.name} />
                  ))}
                </div>

                {groupOrder.procurementWishes.length > 0 && (
                  <>
                    <div className="divider text-sm text-base-content/60">Gruppen-Artikel</div>
                    <table className="table">
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
                      </tbody>
                    </table>
                  </>
                )}

                {groupOrder.orders.length > 0 && (
                  <>
                    <div className="divider text-sm text-base-content/60">Einzel-Artikel</div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Artikel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupOrder.orders.map((o) => {
                          return (
                            <tr key={`${o.id}`}>
                              <td>
                                <p className="font-semibold">{o.user.name}</p>
                              </td>
                              <td>
                                {o.items.map((item) => item.item.name).join(", ")}
                                {o.userId === sessionUser?.id && o.type === 4 && (
                                  <button
                                    className="btn btn-outline btn-xs ml-3"
                                    onClick={() => rescindBuy(o.id)}
                                  >
                                    stornieren
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </>
                )}

                <div className="flex flex-row justify-between items-center">
                  <button
                    className="btn btn-primary btn-sm mt-7"
                    onClick={() => joinGroupOrder(groupOrder.id)}
                  >
                    <Plus className="h-4 w-4" />
                    {groupOrder.orders.some((order) => order.userId === sessionUser?.id) ||
                      groupOrder.procurementWishes.some((wish) => wish.userId === sessionUser?.id)
                      ? "Bestellung erweitern"
                      : "Bestellung beitreten"}
                  </button>
                  {new Date() > groupOrder.ordersCloseAt && (
                    <button
                      className="btn btn-warning btn-sm mt-7"
                      onClick={() => {
                        setCloseOrderId(groupOrder.id)
                      }}
                    >
                      <Lock className="h-4 w-4" />
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

        <div className="mx-auto mt-2 flex w-full max-w-5xl justify-center">
          <Link href="/grouporders/history" role="button" className="btn btn-ghost">
            <History className="h-4 w-4" />
            History
          </Link>
        </div>
      </CenteredPage>

      <Modal setOpen={setOpenBuyModal} open={openBuyModal} className="w-11/12! max-w-5xl! pt-11">
        <div className="flex flex-row flex-wrap justify-center gap-4">
          {groupOrderProcurementItems.data?.filter(matchesFilter).map((item) => (
            <BuyItemCard
              key={item.id}
              item={item}
              buttonName="Wünschen"
              buyAction={async (_itemID, quantity) => {
                await buyItemInGroupOrder(selectedGroupOrder!, item.id, "procurement", quantity)
              }}
            />
          ))}
          {groupOrderItems.data?.filter(matchesFilter).map((item) => (
            <BuyItemCard
              key={item.id}
              item={item}
              buyAction={async (_itemID, quantity) => {
                await buyItemInGroupOrder(selectedGroupOrder!, item.id, "order", quantity)
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
      <UserAvatar name={props.userName} tone="neutral" />
    </div>
  )
}

export default GroupOrders
