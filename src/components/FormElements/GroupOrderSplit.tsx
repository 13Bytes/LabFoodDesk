import type { Category, ProcurementItem } from "@prisma/client"
import { ChangeEvent, useEffect, useState } from "react"
import type { Control, FieldValues, SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { Tid, id } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "../../server/api/root"

type RouterOutput = inferRouterOutputs<AppRouter>

type Props = {
  group: RouterOutput["groupOrders"]["getInProgress"][number]
}
const GroupOrderSplit = (props: Props) => {
  const { group } = props

  const itemList: ProcurementItem[] = []
  const userItems: { [key: string]: { items: ProcurementItem[]; username: string } } = {}
  group.procurementWishes.forEach((element) => {
    element.items.forEach((item) => {
      itemList.push(item)
      if (Object.keys(userItems).includes(element.userId)) {
        userItems[element.userId]!.items.push(item)
      } else {
        userItems[element.userId] = { items: [item], username: element.user.name ?? "" }
      } 
    })
  })
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
    if(totalAmount === undefined) return
    for (const [key, value] of Object.entries(userItems)) {
      const userItemCount  = value.items.length
      setUserSplit(prevState => ({...prevState, userID: userItemCount * totalAmount/totalItems}))
    }
  }, [totalAmount, setUserSplit])
  // }, [userItems, totalAmount, setUserSplit])

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
                    value={userSplit?.userID}
                    className='input-bordered input input-sm  w-full max-w-xs'
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
