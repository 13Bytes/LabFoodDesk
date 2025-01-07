import Modal from "~/components/Layout/Modal"
import { RouterOutputs } from "~/utils/api"

type Props = {
  order: RouterOutputs["groupOrders"]["getInProgress"][number]
  setOpen: (arg: boolean) => void
  open: boolean
}
const OrderSummaryModal = (props: Props) => {
  const { order } = props
  const itemList = order.procurementWishes.map((o) => o.items.map((item, id) => item.name))
  const flatItemList = itemList.reduce((acc, val) => acc.concat(val), [])

  const occurrences = flatItemList.reduce((acc:{[index:string]: number}, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const totalItems = Object.entries(occurrences).reduce((acc, val) => acc + val[1] , 0)

  return (
    <Modal
      open={props.open}
      setOpen={props.setOpen}
      closeFunctionCall={() => {
        props.setOpen(false)
      }}
    >
        <p className="font-bold text-lg my-2">Bestellte Items</p>
        {Object.entries(occurrences).map(([item, count]) => (<p key={item}>{item}: <span className="font-bold">{count}</span></p>))}
        <p className="font-light mt-2">Insgesammt: {totalItems}</p>
    </Modal>
  )
}

export default OrderSummaryModal
