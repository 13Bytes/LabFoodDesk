import type { ProcurementItem } from "@prisma/client"
import type { inferRouterOutputs } from "@trpc/server"
import { ChangeEvent, useEffect, useState } from "react"
import { Tid } from "~/helper/zodTypes"
import type { AppRouter } from "../../server/api/root"

type RouterOutput = inferRouterOutputs<AppRouter>

type Props = {
  group: RouterOutput["groupOrders"]["getInProgress"][number]
}
const GroupOrderSplit = (props: Props) => {
  const { group } = props

  // let itemList: ProcurementItem[] = []
  const [itemList, setItemList] = useState<ProcurementItem[]>([])
  // let userItems: { [key: string]: { items: ProcurementItem[]; username: string } } = {}
  const [userItems, setUserItems] = useState<{
    [key: string]: { items: ProcurementItem[]; username: string }
  }>({})

  useEffect(() => {
    const tempItemList: ProcurementItem[] = []
    const tempUserItems: { [key: string]: { items: ProcurementItem[]; username: string } } = {}
    group.procurementWishes.forEach((element) => {
      element.items.forEach((item) => {
        tempItemList.push(item)
        if (Object.keys(tempUserItems).includes(element.userId)) {
          tempUserItems[element.userId]!.items.push(item)
        } else {
          tempUserItems[element.userId] = { items: [item], username: element.user.name ?? "" }
        }
      })
    })
    setUserItems({ ...tempUserItems })
    setItemList([...tempItemList])
  }, [group])

  const [totalAmount, setTotalAmount] = useState<number>(0)
  const typeTotalAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value
    const value = parseFloat(userInput)
    setTotalAmount(value)
  }
  const totalUsers = Object.keys(userItems).length
  const totalItems = itemList.length

  const [userSplit, setUserSplit] = useState<{ [key: Tid]: number }>()

  useEffect(() => {
    if (totalAmount === undefined) return
    for (const [key, entries] of Object.entries(userItems)) {
      const userItemCount = entries.items.length
      setUserSplit((prevState) => ({
        ...prevState,
        [key]: (userItemCount * totalAmount) / totalItems,
      }))
    }
  }, [totalAmount, userItems, totalItems])

  return (
    <div className="container">
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Kosten Gesammt</span>
        </div>
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
      </label>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gerichte</th>
              <th>Kosten</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(userItems).map(([userID, data]) => (
              <tr key={userID}>
                <th>{data.username}</th>
                <td>
                  {data.items.map((item, key) => (
                    <p key={key}>{item.name}</p>
                  ))}
                </td>
                <td>
                  {" "}
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    value={userSplit?.[userID]}
                    // setValue={setCustomValue}
                    className="input-bordered input input-sm w-full max-w-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GroupOrderSplit
