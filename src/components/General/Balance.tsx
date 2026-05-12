import type { HTMLProps } from "react"

type Props = {
  balance?: number,
  allowOverdraw?: boolean
}
export const Balance = (props: Props) => {
  if (props.balance === undefined) {
    return <div className="skeleton h-5 w-9"></div>
  } else {
    let color: HTMLProps<HTMLElement>["className"] = ""
    if (props.allowOverdraw) {
      if (props.balance > 0) {
        color = "text-gray-300"
      } else if (props.balance < -150) {
        color = "text-amber-700"
      } else if (props.balance < 0) {
        color = "text-blue-grey-600"
      }
    }
    else {
      if (props.balance > 0) {
        color = "text-green-600"
      } else if (props.balance < 0) {
        color = "text-red-700"
      }
    }
    return <span className={`font-bold ${color}`}>{props.balance.toFixed(2)}€</span>
  }
}
