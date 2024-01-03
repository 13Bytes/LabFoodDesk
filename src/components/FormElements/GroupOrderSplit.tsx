import type { Category, ProcurementItem } from "@prisma/client"
import { ChangeEvent, useEffect, useState } from "react"
import type { Control, FieldValues, SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { id } from "~/helper/zodTypes"
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
  const userItems: { [key: string]: {items: ProcurementItem[], username: string}} = {}
  group.procurementWishes.forEach(element => {
    element.items.forEach(item => {
      itemList.push(item)
      if(element.userId in Object.keys(userItems)){
        userItems[element.userId]!.items.push(item)
      }
      else{
        userItems[element.userId] = {items:[item], username: element.user.name?? ''}
      }
    })
  })


  const [totalAmount, setTotalAmount] = useState<number>()
  const typeTotalAmount = (e:ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value
    const value = parseFloat(userInput)
    setTotalAmount(value)
  }

  return (
    <div className="container">
      <input type="number" step={0.01} min={0}  onChange={typeTotalAmount} placeholder="Gesammter Betrag" className={`input input-bordered w-full max-w-xs ${Number.isNaN(totalAmount) && "input-error"}`} />
      <p>{totalAmount}€</p>

      {Object.entries(userItems).map(([userID, data]) => {
        return <>
        <p>{data.username}:</p>
        {data.items.map(item => <p>{item.name}</p>)}
        </>
      })}
     </div>
  )
}

export default GroupOrderSplit
