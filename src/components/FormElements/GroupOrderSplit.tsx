import type { ProcurementItem } from "@prisma/client"
import { useSession } from "next-auth/react"
import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { calculateAdditionalPricing } from "~/helper/dataProcessing"
import { type Tid, id } from "~/helper/zodTypes"
import { type RouterOutputs, api } from "~/utils/api"
import ActionResponsePopup, { type AnimationHandle, animate } from "../General/ActionResponsePopup"
import { ConfirmationModal } from "../General/ConfirmationModal"

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
            price: z.number(),
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
  const { group } = props

  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()

  const allUserRequest = api.user.getAllUsers.useQuery()

  const { itemList, userItemList, baseSplit } = useMemo(() => buildDerivedGroupData(group), [group])

  const [overwrittenCosts, setOverwrittenCosts] = useState<Record<Tid, number | undefined>>({})
  const [closeGroupOrderModalOpen, setCloseGroupOrderModalOpen] = useState(false)

  const [selectedDestination, setSelectedDestination] = useState(sessionData?.user.id.toString() ?? "")
  const [destinationError, setDestinationError] = useState(false)

  const totalItems = itemList.length
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const typeTotalAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value
    const value = parseFloat(userInput)
    setTotalAmount(value)
  }

  const overwriteUserExpence = (
    e: ChangeEvent<HTMLInputElement>,
    itemId: Tid,
  ) => {
    const cost = parseFloat(e.currentTarget.value)
    setOverwrittenCosts((previous) => ({
      ...previous,
      [itemId]: Number.isNaN(cost) ? undefined : cost,
    }))
  }

  const split = useMemo(() => {
    const defaultCost = totalItems > 0 ? totalAmount / totalItems : 0

    const splitWithDefaults = baseSplit.map((userContent) => ({
      ...userContent,
      procurementWishs: userContent.procurementWishs.map((proc) => ({
        ...proc,
        items: proc.items.map((item) => ({
          ...item,
          defaultCost,
          overwritenCost: overwrittenCosts[item.item.id],
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
      totalAmount - overwrittenItemsSum > 0 && remainingItems > 0
        ? (totalAmount - overwrittenItemsSum) / remainingItems
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
  }, [baseSplit, overwrittenCosts, totalAmount, totalItems])

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
    return overwrittenItemsSum > totalAmount ? overwrittenItemsSum : undefined
  }, [split, totalAmount])

  const closeGroupOrderRequest = api.groupOrders.close.useMutation()

  const closeGroupOrder = async () => {
    if (!selectedDestination) {
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
        destination: selectedDestination,
        split: splitSubmit ?? {},
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
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Kosten Gesamt</span>
            {allUsersOverwritten !== undefined && (
              <span className="label-text text-warning">(verändert)</span>
            )}
          </div>
          <input
            type="number"
            step={0.01}
            min={0}
            onChange={typeTotalAmount}
            value={
              allUsersOverwritten === undefined ? totalAmount : allUsersOverwritten?.toFixed(2)
            }
            placeholder="Gesamter Betrag"
            className={`\ input input-sm  input-bordered w-full max-w-xs
               ${Number.isNaN(totalAmount) ? "input-error" : ""} \
               ${allUsersOverwritten !== undefined ? "!input-warning " : ""}`}
            disabled={allUsersOverwritten !== undefined}
          />
        </label>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gerichte</th>
                <th>Kosten</th>
                <th>Kosten anpassen</th>
              </tr>
            </thead>
            <tbody>
              {split.map((userContent) =>
                userContent.procurementWishs.map((proc) =>
                  proc.items.map((item) => (
                    <tr key={userContent.user}>
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
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          value={item.overwritenCost || ""}
                          onChange={(e) => overwriteUserExpence(e, item.item.id)}
                          className="input input-sm input-bordered max-w-[6rem]"
                        />
                      </td>
                    </tr>
                  )),
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-row items-center gap-2">
          <p>Gezahlt von:</p>
          <select
            className={`select select-bordered select-sm w-full max-w-xs font-bold ${
              destinationError ? "select-error" : ""
            }`}
            id="sel-dest-user"
            value={selectedDestination}
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
        </div>

        <div className="flex justify-end">
          <button
            className="btn btn-primary btn-sm mr-4 mt-1"
            onClick={() => setCloseGroupOrderModalOpen(true)}
          >
            Abrechnen
          </button>
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
