import type { ProcurementItem } from "@prisma/client"
import type { inferRouterOutputs } from "@trpc/server"
import { ChangeEvent, useEffect, useState } from "react"
import { Tid } from "~/helper/zodTypes"
import type { AppRouter } from "../../server/api/root"
import { api } from "~/utils/api"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
import { useRef } from "react"

type RouterOutput = inferRouterOutputs<AppRouter>

type UserItemList = {
  [key: string]: { items: ProcurementItem[]; username: string }
}

type Props = {
  group: RouterOutput["groupOrders"]["getInProgress"][number]
}
const GroupOrderSplit = (props: Props) => {
  const { group } = props

  const trpcUtils = api.useContext()
  
  const [itemList, setItemList] = useState<ProcurementItem[]>([])
  const [userItemList, setUserItemList] = useState<UserItemList>({})
  const [userSplit, setUserSplit] = useState<{
    [key: Tid]: {
      defaultUserExpences: number
      overwritenUserExpences: number | undefined
    }
  }>()
  const [userCost, setUserCost] = useState<{
    [key: Tid]: number
  }>()
  const animationRef = useRef<AnimationHandle>(null)

  // restructure data from group into costDistribution and itemList
  useEffect(() => {
    const tempItemList: ProcurementItem[] = []
    const tempUserItemList: UserItemList = {}
    group.procurementWishes.forEach((element) => {
      element.items.forEach((item) => {
        tempItemList.push(item)
        if (Object.keys(tempUserItemList).includes(element.userId)) {
          tempUserItemList[element.userId]!.items.push(item)
        } else {
          tempUserItemList[element.userId] = {
            items: [item],
            username: element.user.name ?? "",
          }
        }
      })
    })
    setUserItemList({ ...tempUserItemList })
    setItemList([...tempItemList])
  }, [JSON.stringify(group)])

  const [totalAmount, setTotalAmount] = useState<number>(0)
  const typeTotalAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value
    const value = parseFloat(userInput)
    setTotalAmount(value)
  }

  const totalUsers = Object.keys(userItemList).length
  const totalItems = itemList.length

  useEffect(() => {
    if (totalAmount === undefined) return
    for (const [key, entries] of Object.entries(userItemList)) {
      const userItemCount = entries.items.length
      const userExpences = (userItemCount * totalAmount) / totalItems
      setUserSplit((prevState) => ({
        ...prevState,
        [key]: {
          defaultUserExpences: userExpences,
          overwritenUserExpences: undefined,
        },
      }))
    }
  }, [totalAmount, userItemList, totalItems])

  /**
   * Overwrite the default user expences with custom user input from one user
   * -> triggers a reclaculation of the other user expences
   */
  const overwritenUserExpences = (e: ChangeEvent<HTMLInputElement>, userId: Tid) => {
    const cost = parseFloat(e.currentTarget.value)
    console.log("inserted value", e.currentTarget.value, cost)

    if (Number.isNaN(cost)) {
      console.log("Calloingkngfjn")
      setUserSplit((prevState) => {
        return {
          ...prevState,
          [userId]: {
            defaultUserExpences: prevState?.[userId]?.defaultUserExpences || 0,
            overwritenUserExpences: undefined,
          },
        }
      })
    } else {
      setUserSplit((prevState) => {
        return {
          ...prevState,
          [userId]: {
            defaultUserExpences: prevState?.[userId]?.defaultUserExpences || 0,
            overwritenUserExpences: cost,
          },
        }
      })
    }
  }

  useEffect(() => {
    if (userSplit === undefined) return

    const tempUserCost: { [key: Tid]: number } = {}
    const overwritenUsers = Object.values(userSplit).filter(
      (user) => user.overwritenUserExpences !== undefined
    )
    const remainingItemCount = Object.entries(userSplit).reduce(
      (acc, [userID, userValue], index) => {
        const userItemCount = userItemList[userID]?.items.length ?? 0
        return acc + (userValue.overwritenUserExpences === undefined ? userItemCount : 0)
      },
      0
    )

    const remainingAmount =
      totalAmount -
      Object.values(userSplit).reduce((acc, user) => acc + (user.overwritenUserExpences ?? 0), 0)

    const remainingCostPerItem =
      remainingAmount / (totalUsers - overwritenUsers.length) / remainingItemCount

    for (const [userId, data] of Object.entries(userSplit)) {
      if (data.overwritenUserExpences !== undefined) {
        tempUserCost[userId] = data.overwritenUserExpences
      } else {
        tempUserCost[userId] = remainingCostPerItem * (userItemList[userId]?.items.length ?? 1)
      }
    }
    setUserCost({ ...tempUserCost })
  }, [userSplit, totalAmount, totalUsers, userItemList])

  const allUsersOverwritten =
    userSplit != undefined
      ? Object.values(userSplit).every((user) => user.overwritenUserExpences !== undefined)
      : false

  const closeGroupOrderRequest = api.groupOrders.close.useMutation()
  const closeGroupOrder = () => {
    if (userCost === undefined) {
      animate(animationRef, "failure")
      return
    }
    closeGroupOrderRequest.mutate(
      {
        groupId: group.id,
        split: userCost ?? {},
      },
      {
        onError: (error) => {
          console.error(error)
          animate(animationRef, "failure")
        },
        onSuccess: () => {
          animate(animationRef, "success")
        },
      }
    )
    setTimeout(() => trpcUtils.groupOrders.invalidate(), 50)
  }

  return (
    <>
      <div className="container">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Kosten Gesammt</span>
          </div>
          {!allUsersOverwritten && (
            <input
              type="number"
              step={0.01}
              min={0}
              onChange={typeTotalAmount}
              placeholder="Gesammter Betrag"
              className={`input-bordered input input-sm  w-full max-w-xs ${
                Number.isNaN(totalAmount) && "input-error"
              }`}
            />
          )}
          {allUsersOverwritten && (
            <p className="w-full text-warning">
              Kosten verändert!:{" "}
              {Object.values(userCost ?? {}).reduce((acc, user) => acc + user, 0)}
            </p>
          )}
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
              {Object.entries(userItemList).map(([userID, data]) => (
                <tr key={userID}>
                  <th>{data.username}</th>
                  <td>
                    {data.items.map((item, key) => (
                      <p key={key}>{item.name}</p>
                    ))}
                  </td>
                  <td>
                    {userSplit?.[userID]?.overwritenUserExpences === undefined && (
                      <input
                        type="number"
                        disabled
                        value={userCost?.[userID]?.toFixed(2)}
                        className={`input-bordered input input-sm w-full max-w-xs ${
                          userSplit?.[userID]?.overwritenUserExpences === undefined && "red"
                        }`}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      step={0.01}
                      min={0}
                      value={userSplit?.[userID]?.overwritenUserExpences || ""}
                      onChange={(e) => overwritenUserExpences(e, userID)}
                      className="input-bordered input input-sm w-full max-w-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary btn-sm btn mr-4 mt-1" onClick={closeGroupOrder}>
            Abrechnen
          </button>
        </div>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GroupOrderSplit