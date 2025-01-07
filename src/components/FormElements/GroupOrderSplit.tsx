import type { ProcurementItem } from "@prisma/client"
import { useSession } from "next-auth/react"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { z } from "zod"
import { calculateAdditionalPricing } from "~/helper/dataProcessing"
import { Tid, id } from "~/helper/zodTypes"
import { RouterOutputs, api } from "~/utils/api"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
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

const GroupOrderSplit = (props: Props) => {
  const { group } = props

  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()

  const allUserRequest = api.user.getAllUsers.useQuery()

  const [itemList, setItemList] = useState<ProcurementItem[]>([])
  const [userItemList, setUserItemList] = useState<UserItemList>({})
  const [split, setSplit] = useState<Split[]>([])
  const [allUsersOverwritten, setAllUsersOverwritten] = useState<number | undefined>()
  const [closeGroupOrderModalOpen, setCloseGroupOrderModalOpen] = useState(false)

  const [selectedDestination, setSelectedDestination] = useState(sessionData?.user.id.toString() ?? "")
  const [destinationError, setDestinationError] = useState(false)

  // restructure data from group into (user)ItemList
  useEffect(() => {
    const itemList: ProcurementItem[] = []
    const userItemList: UserItemList = {}
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
    const groupOrderSplit: Split[] = []
    for (const proc of group.procurementWishes) {
      const splitIndex = groupOrderSplit.findIndex((split) => split.user === proc.userId)
      if (splitIndex !== -1) {
        groupOrderSplit[splitIndex]!.procurementWishs.push({
          id: proc.id,
          items: proc.items.map((item) => ({
            item: item,
            defaultCost: 0,
            overwritenCost: undefined,
            finalCost: 0,
          })),
        })
      } else {
        groupOrderSplit.push({
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
    setSplit([...groupOrderSplit])
    setUserItemList({ ...userItemList })
    setItemList([...itemList])
  }, [JSON.stringify(group)])

  const totalItems = itemList.length
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const typeTotalAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value
    const value = parseFloat(userInput)
    const pricePerItem = value / totalItems
    setTotalAmount(value)
    setSplit((oldSplit) =>
      oldSplit.map((split) => ({
        ...split,
        procurementWishs: split.procurementWishs.map((wish) => ({
          ...wish,
          items: wish.items.map((item) => ({
            ...item,
            defaultCost: pricePerItem,
            overwritenCost: undefined,
            finalCost: pricePerItem,
          })),
        })),
      })),
    )
  }

  const overwriteUserExpence = (
    e: ChangeEvent<HTMLInputElement>,
    userId: Tid,
    procID: Tid,
    itemIndex: number,
  ) => {
    const cost = parseFloat(e.currentTarget.value)
    if (!Number.isNaN(cost)) {
      setSplit((oldSplit) => {
        const copy = [...oldSplit]
        const splitIndex = copy.findIndex((split) => split.user === userId)
        const procIndex = copy[splitIndex]!.procurementWishs.findIndex((wish) => wish.id === procID)
        copy[splitIndex]!.procurementWishs[procIndex]!.items[itemIndex]!.overwritenCost = cost
        return copy
      })
    } else {
      setSplit((oldSplit) => {
        const copy = [...oldSplit]
        const splitIndex = copy.findIndex((split) => split.user === userId)
        const procIndex = copy[splitIndex]!.procurementWishs.findIndex((wish) => wish.id === procID)
        copy[splitIndex]!.procurementWishs[procIndex]!.items[itemIndex]!.overwritenCost = undefined
        return copy
      })
    }
    updateFinalCost()
  }

  const updateFinalCost = () => {
    setSplit((oldSplit) => {
      let overwrittenItems = 0
      let overwrittenItemsSum = 0

      for (const userContent of oldSplit) {
        for (const proc of userContent.procurementWishs) {
          for (const item of proc.items) {
            if (item.overwritenCost !== undefined) {
              overwrittenItemsSum += item.overwritenCost
              overwrittenItems += 1
            }
          }
        }
      }
      setAllUsersOverwritten(overwrittenItemsSum > totalAmount ? overwrittenItemsSum : undefined)
      const pricePerRemainingItem =
        totalAmount - overwrittenItemsSum > 0
          ? (totalAmount - overwrittenItemsSum) / (totalItems - overwrittenItems)
          : 0
      const copy = [...oldSplit]
      for (const [userIndex, userContent] of copy.entries()) {
        for (const [procIndex, proc] of userContent.procurementWishs.entries()) {
          for (const [itemIndex, item] of proc.items.entries()) {
            if (item.overwritenCost !== undefined) {
              copy[userIndex]!.procurementWishs[procIndex]!.items[itemIndex]!.finalCost =
                item.overwritenCost
            } else {
              copy[userIndex]!.procurementWishs[procIndex]!.items[itemIndex]!.finalCost =
                pricePerRemainingItem
            }
          }
        }
      }
      return copy
    })
  }

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
          animate(animationRef, "failure")
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
                  proc.items.map((item, itemIndex) => (
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
                          onChange={(e) =>
                            overwriteUserExpence(e, userContent.user, proc.id, itemIndex)
                          }
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
