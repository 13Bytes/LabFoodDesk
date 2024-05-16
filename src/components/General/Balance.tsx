type Props = {
  balance?: number
}
export const Balance = (props: Props) => {
  if (props.balance === undefined) {
    return <div className="skeleton h-4 w-5"></div>
  } else {
    let color = ""
    if (props.balance > 0) {
      color = "text-green-600"
    } else if (props.balance < 0) {
      color = "text-red-700"
    }
    return <span className={`font-bold ${color}`}>{props.balance.toFixed(2)}€</span>
  }
}
