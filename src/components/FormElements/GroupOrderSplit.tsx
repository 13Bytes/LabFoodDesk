import type { ProcurementItem } from "~/generated/prisma/client"
import { Coins } from "lucide-react"
import { useSession } from "next-auth/react"
import { type ReactNode, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { calculateAdditionalPricing, categoryFeesAsMarkups } from "~/helper/dataProcessing"
import { BILLING_TOLERANCE } from "~/helper/globalTypes"
import { type Tid, id } from "~/helper/zodTypes"
import { type RouterOutputs, api } from "~/utils/api"
import ActionResponsePopup, { type AnimationHandle, animate } from "../General/ActionResponsePopup"
import { ConfirmationModal } from "../General/ConfirmationModal"
import DecimalInput from "../General/DecimalInput"

type UserItemList = {
  [user: Tid]: {
    items: ProcurementItem[]
    username: string
  }
}

export const splitSubmitSchema = z.array(
  z.object({
    user: id,
    procurementWishs: z.array(
      z.object({
        id: id,
        items: z.array(
          z.object({
            id: id,
            price: z.number().min(0),
          }),
        ),
      }),
    ),
  }),
)

type SplitSubmit = z.infer<typeof splitSubmitSchema>

type Item =
  RouterOutputs["groupOrders"]["getInProgress"][number]["procurementWishes"][number]["items"][number]

// only one entry per user id
type Split = {
  user: Tid
  procurementWishs: {
    id: Tid
    items: {
      item: Item
      defaultCost: number
      overwritenCost: number | undefined
      finalCost: number
    }[]
  }[]
}

type Props = {
  group: RouterOutputs["groupOrders"]["getInProgress"][number]
  /** further buttons, shown right in the row of the "Abrechnen" button */
  actions?: ReactNode
}

const buildDerivedGroupData = (group: RouterOutputs["groupOrders"]["getInProgress"][number]) => {
  const itemList: ProcurementItem[] = []
  const userItemList: UserItemList = {}
  const baseSplit: Split[] = []

  group.procurementWishes.forEach((element) => {
    element.items.forEach((item) => {
      itemList.push(item)
      if (Object.keys(userItemList).includes(element.userId)) {
        userItemList[element.userId]!.items.push(item)
      } else {
        userItemList[element.userId] = {
          items: [item],
          username: element.user.name ?? "",
        }
      }
    })
  })

  for (const proc of group.procurementWishes) {
    const splitIndex = baseSplit.findIndex((split) => split.user === proc.userId)
    if (splitIndex !== -1) {
      baseSplit[splitIndex]!.procurementWishs.push({
        id: proc.id,
        items: proc.items.map((item) => ({
          item,
          defaultCost: 0,
          overwritenCost: undefined,
          finalCost: 0,
        })),
      })
    } else {
      baseSplit.push({
        user: proc.userId,
        procurementWishs: [
          {
            id: proc.id,
            items: proc.items.map((item) => ({
              item,
              defaultCost: 0,
              overwritenCost: undefined,
              finalCost: 0,
            })),
          },
        ],
      })
    }
  }

  return { itemList, userItemList, baseSplit }
}

const GroupOrderSplit = (props: Props) => {
  const { group, actions } = props

  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()

  const allUserRequest = api.user.getAllUsers.useQuery()

  const { itemList, userItemList, baseSplit } = useMemo(() => buildDerivedGroupData(group), [group])

  const [overwrittenCosts, setOverwrittenCosts] = useState<Record<Tid, number | undefined>>({})
  const [itemBuyPrices, setItemBuyPrices] = useState<Record<Tid, number | undefined>>({})
  const pendingItemBuys = group.orders.filter((order) => order.type === 4 && !order.canceled)
  const [closeGroupOrderModalOpen, setCloseGroupOrderModalOpen] = useState(false)

  const [selectedDestination, setSelectedDestination] = useState(
    group.shopperId ?? sessionData?.user.id.toString() ?? "",
  )
  // the session may not be loaded on the first render
  const destination = selectedDestination || sessionData?.user.id || ""
  const [destinationError, setDestinationError] = useState(false)

  const totalItems = itemList.length
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [costMode, setCostMode] = useState<"total" | "group">("total")
  const itemBuysSum = pendingItemBuys.reduce(
    (sum, order) => sum + (itemBuyPrices[order.id] ?? order.amountWithoutFees ?? 0),
    0,
  )
  const groupAmount = costMode === "total" ? Math.max(0, totalAmount - itemBuysSum) : totalAmount
  const overwriteUserExpence = (cost: number, key: string) => {
    setOverwrittenCosts((previous) => ({
      ...previous,
      [key]: Number.isNaN(cost) ? undefined : cost,
    }))
  }

  const split = useMemo(() => {
    const defaultCost = totalItems > 0 ? groupAmount / totalItems : 0

    const splitWithDefaults = baseSplit.map((userContent) => ({
      ...userContent,
      procurementWishs: userContent.procurementWishs.map((proc) => ({
        ...proc,
        items: proc.items.map((item) => ({
          ...item,
          defaultCost,
          overwritenCost: overwrittenCosts[`${proc.id}-${item.item.id}`],
          finalCost: defaultCost,
        })),
      })),
    }))

    let overwrittenItems = 0
    let overwrittenItemsSum = 0

    for (const userContent of splitWithDefaults) {
      for (const proc of userContent.procurementWishs) {
        for (const item of proc.items) {
          if (item.overwritenCost !== undefined) {
            overwrittenItemsSum += item.overwritenCost
            overwrittenItems += 1
          }
        }
      }
    }

    const remainingItems = totalItems - overwrittenItems
    const pricePerRemainingItem =
      groupAmount - overwrittenItemsSum > 0 && remainingItems > 0
        ? (groupAmount - overwrittenItemsSum) / remainingItems
        : 0

    return splitWithDefaults.map((userContent) => ({
      ...userContent,
      procurementWishs: userContent.procurementWishs.map((proc) => ({
        ...proc,
        items: proc.items.map((item) => ({
          ...item,
          finalCost: item.overwritenCost ?? pricePerRemainingItem,
        })),
      })),
    }))
  }, [baseSplit, overwrittenCosts, groupAmount, totalItems])

  const allUsersOverwritten = useMemo(() => {
    let overwrittenItemsSum = 0
    for (const userContent of split) {
      for (const proc of userContent.procurementWishs) {
        for (const item of proc.items) {
          if (item.overwritenCost !== undefined) {
            overwrittenItemsSum += item.overwritenCost
          }
        }
      }
    }
    return overwrittenItemsSum > groupAmount ? overwrittenItemsSum : undefined
  }, [split, groupAmount])

  // what the shopper paid (incl. single items) - the billed prices have to add up to it
  const expectedTotal =
    totalItems === 0
      ? itemBuysSum
      : allUsersOverwritten !== undefined
        ? allUsersOverwritten + itemBuysSum
        : costMode === "total"
          ? totalAmount
          : totalAmount + itemBuysSum
  const billedTotal =
    split
      .flatMap((userContent) => userContent.procurementWishs)
      .flatMap((proc) => proc.items)
      .reduce((sum, item) => sum + item.finalCost, 0) + itemBuysSum
  // the total has to cover at least the single items
  const totalAmountTooLow =
    totalItems > 0 && allUsersOverwritten === undefined && costMode === "total" && totalAmount < itemBuysSum
  const totalMismatch = Number.isNaN(expectedTotal) || Math.abs(billedTotal - expectedTotal) > BILLING_TOLERANCE

  const closeGroupOrderRequest = api.groupOrders.close.useMutation()

  const closeGroupOrder = async () => {
    if (totalMismatch) {
      return
    }
    if (!destination) {
      setDestinationError(true)
      return
    } else {
      setDestinationError(false)
    }
    const splitSubmit: SplitSubmit = split.map((userContent) => ({
      user: userContent.user,
      procurementWishs: userContent.procurementWishs.map((proc) => ({
        id: proc.id,
        items: proc.items.map((item) => ({
          id: item.item.id,
          price: item.finalCost,
        })),
      })),
    }))

    await closeGroupOrderRequest.mutateAsync(
      {
        groupId: group.id,
        destination,
        split: splitSubmit ?? {},
        expectedTotal,
        itemBuyPrices: pendingItemBuys.flatMap((order) => {
          const price = itemBuyPrices[order.id]
          return price === undefined ? [] : [{ id: order.id, price }]
        }),
      },
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
    await trpcUtils.user.invalidate()
    await trpcUtils.groupOrders.invalidate()
  }

  return (
    <>
      <div className="container">
        {totalItems > 0 && (
          <>
            <div className="mt-4 flex flex-row items-center gap-2">
              <p className="text-sm">Kosten</p>
              <div className="join">
                <button
                  className={`btn join-item btn-sm ${costMode === "total" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setCostMode("total")}
                >
                  Gesamt
                </button>
                <button
                  className={`btn join-item btn-sm ${costMode === "group" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setCostMode("group")}
                >
                  Nur Gruppen-Artikel
                </button>
              </div>
              <label
                className={`input input-sm w-28
                  ${Number.isNaN(totalAmount) || totalAmountTooLow ? "input-error" : ""} \
                  ${allUsersOverwritten !== undefined ? "input-warning!" : ""}`}
              >
                <DecimalInput
                  min={0}
                  onChange={setTotalAmount}
                  value={
                    allUsersOverwritten === undefined
                      ? totalAmount || undefined // show the 0 only as placeholder
                      : +(allUsersOverwritten + (costMode === "total" ? itemBuysSum : 0)).toFixed(2)
                  }
                  placeholder="0"
                  className="grow"
                  disabled={allUsersOverwritten !== undefined}
                />
                <span>€</span>
              </label>
              {allUsersOverwritten !== undefined && <p className="text-sm text-warning">(verändert)</p>}
              {costMode === "total" && itemBuysSum > 0 && allUsersOverwritten === undefined && (
                <p className="text-sm text-base-content/60">
                  − {itemBuysSum.toFixed(2)}€ Einzel-Artikel = {groupAmount.toFixed(2)}€
                </p>
              )}
            </div>
            {totalAmountTooLow ? (
              <p className="mt-1 text-sm text-error">
                Die Gesamtkosten müssen mindestens die Einzel-Artikel ({itemBuysSum.toFixed(2)}€) abdecken.
              </p>
            ) : (
              totalMismatch && (
                <p className="mt-1 text-sm text-error">
                  Die angepassten Kosten ergeben zusammen nicht die Gesamtkosten.
                </p>
              )
            )}
            <div className="divider text-sm text-base-content/60">Gruppen-Artikel</div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Artikel</th>
                    <th>Kosten</th>
                    <th>Kosten anpassen</th>
                  </tr>
                </thead>
                <tbody>
                  {split.map((userContent) =>
                    userContent.procurementWishs.map((proc) =>
                      proc.items.map((item, index) => (
                        <tr key={`${proc.id}-${item.item.id}-${index}`}>
                          <th>{userItemList[userContent.user]?.username}</th>
                          <td>{item.item.name}</td>
                          <td>
                            <span>{item.finalCost.toFixed(2)}€</span>
                            <span className="text-xs">
                              {" "}
                              +{" "}
                              {calculateAdditionalPricing(
                                item.finalCost ?? 0,
                                item.item.categories,
                              ).toFixed(2)}
                              €
                            </span>
                          </td>
                          <td>
                            <DecimalInput
                              min={0}
                              value={item.overwritenCost || undefined}
                              onChange={(cost) => overwriteUserExpence(cost, `${proc.id}-${item.item.id}`)}
                              className="input input-sm max-w-24"
                            />
                          </td>
                        </tr>
                      )),
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pendingItemBuys.length > 0 && (
          <div className="overflow-x-auto">
            <div className="divider text-sm text-base-content/60">Einzel-Artikel</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Artikel</th>
                  <th>Kosten</th>
                  <th>Kosten anpassen</th>
                </tr>
              </thead>
              <tbody>
                {pendingItemBuys.map((order) => {
                  const price = itemBuyPrices[order.id] ?? order.amountWithoutFees ?? 0
                  return (
                    <tr key={order.id}>
                      <th>{order.user.name}</th>
                      <td>{order.items.map((mapping) => mapping.item.name).join(", ")}</td>
                      <td>
                        <span>{price.toFixed(2)}€</span>
                        <span className="text-xs">
                          {" "}
                          +{" "}
                          {calculateAdditionalPricing(
                            price,
                            categoryFeesAsMarkups(order.categoryFees),
                          ).toFixed(2)}
                          €
                        </span>
                      </td>
                      <td>
                        <DecimalInput
                          min={0}
                          value={itemBuyPrices[order.id]}
                          placeholder={(order.amountWithoutFees ?? 0).toFixed(2)}
                          onChange={(cost) =>
                            setItemBuyPrices((previous) => ({
                              ...previous,
                              [order.id]: Number.isNaN(cost) ? undefined : cost,
                            }))
                          }
                          className="input input-sm max-w-24"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 flex-row items-center gap-2">
            <p className="text-sm">Gezahlt von:</p>
            <select
              className={`select select-bordered select-sm w-full max-w-xs font-bold ${destinationError ? "select-error" : ""
                }`}
              id="sel-dest-user"
              value={destination}
              onChange={(e) => {
                setSelectedDestination(e.target.value)
              }}
            >
              {allUserRequest.data?.map((user) => (
                <option value={user.id} key={user.id} className="">
                  {user.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm"
              disabled={totalMismatch}
              onClick={() => setCloseGroupOrderModalOpen(true)}
            >
              <Coins className="h-4 w-4" />
              Abrechnen
            </button>
          </div>
          {actions}
        </div>
      </div>
      <ActionResponsePopup ref={animationRef} />

      <ConfirmationModal
        open={closeGroupOrderModalOpen}
        proceed={closeGroupOrder}
        close={() => setCloseGroupOrderModalOpen(false)}
      >
        <p className="py-4">Bestellung unveränderlich abrechnen</p>
      </ConfirmationModal>
    </>
  )
}

export default GroupOrderSplit
