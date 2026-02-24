import Modal from "~/components/Layout/Modal"
import { type RouterOutputs } from "~/utils/api"

type Props = {
  order: RouterOutputs["groupOrders"]["getInProgress"][number]
  setOpen: (arg: boolean) => void
  open: boolean
}
const OrderSummaryModal = (props: Props) => {
  const { order } = props
  const procurementList = order.procurementWishes.map((o) => o.items.map((item, id) => item.name))
  const orderList = order.orders
    .filter((o) => !o.canceled)
    .map((o) => o.items.map((items) => items.item.name))

  const flatProcurementList = procurementList.reduce((acc, val) => acc.concat(val), [])
  const flatOrderList = orderList.reduce((acc, val) => acc.concat(val), [])

  const procurementOccurrences = flatProcurementList.reduce((acc: { [index: string]: number }, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
  const orderOccurrences = flatOrderList.reduce((acc: { [index: string]: number }, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const totalProcurementItems = Object.entries(procurementOccurrences).reduce((acc, val) => acc + val[1], 0)
  const totalOrderItems = Object.entries(orderOccurrences).reduce((acc, val) => acc + val[1], 0)

  return (
    <Modal
      open={props.open}
      setOpen={props.setOpen}
      closeFunctionCall={() => {
        props.setOpen(false)
      }}
    >
      <p className="my-2 text-lg font-bold">Angefragte Items</p>
      {Object.entries(procurementOccurrences).map(([item, count]) => (
        <p key={item}>
          {item}: <span className="font-bold">{count}</span>
        </p>
      ))}
      <p className="font-extralight">Insgesamt: {totalProcurementItems}</p>

      <p className="mb-2 mt-7 text-lg font-bold">Gekaufte Items</p>
      {Object.entries(orderOccurrences).map(([item, count]) => (
        <p key={item}>
          {item}: <span className="font-bold">{count}</span>
        </p>
      ))}
      <p className="font-extralight">Insgesamt: {totalOrderItems}</p>
    </Modal>
  )
}

export default OrderSummaryModal
