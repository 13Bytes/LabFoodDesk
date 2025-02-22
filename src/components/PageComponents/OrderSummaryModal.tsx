import Modal from "~/components/Layout/Modal"
import { RouterOutputs } from "~/utils/api"

type Props = {
  order: RouterOutputs["groupOrders"]["getInProgress"][number]
  setOpen: (arg: boolean) => void
  open: boolean
}
const OrderSummaryModal = (props: Props) => {
  const { order } = props
  const wishList = order.procurementWishes.map((o) => o.items.map((item, id) => item.name))
  const orderList = order.orders.filter((o) => !o.canceled).map((o) => o.items.map((mpng) => mpng.item.name))
  const flatWishList = wishList.reduce((acc, val) => acc.concat(val), [])
  const flatOrderList = orderList.reduce((acc, val) => acc.concat(val), [])

  const wishOccurrences = flatWishList.reduce((acc:{[index:string]: number}, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const orderOccurrences = flatOrderList.reduce((acc:{[index:string]: number}, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const totalWishItems = Object.entries(wishOccurrences).reduce((acc, val) => acc + val[1] , 0)

  return (
    <Modal
      open={props.open}
      setOpen={props.setOpen}
      closeFunctionCall={() => {
        props.setOpen(false)
      }}
    >
        <p className="font-bold text-lg my-2">Bestellte Items</p>
        {Object.entries(wishOccurrences).map(([item, count]) => (<p key={item}>{item}: <span className="font-bold">{count}</span></p>))}
        <p className="font-light mt-2">Insgesamt gewünscht: {totalWishItems}</p>
      
        <p className="font-bold text-lg my-2">Gekaufte Items</p>
        {Object.entries(orderOccurrences).map(([item, count]) => (<p key={item}>{item}: <span className="font-bold">{count}</span></p>))}

    </Modal>
  )
}

export default OrderSummaryModal
