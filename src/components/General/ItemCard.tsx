import { Category, Item } from "@prisma/client"

interface Props {
  item: Item & {
    categories: Category[]
  }
  buyAction: (itemID: string) => void
}

const ItemCard = ({ item, buyAction }: Props) => {
  return (
    <div className="card-compact card w-72 bg-base-300 shadow-sm" key={item.id}>
      <div className="card-body">
        <div className="flex flex-row justify-between">
          <h2 className="card-title mr-6">{item.name}</h2>
          <div className="flex flex-col items-end self-center ">
            {item.categories.map((cat) => (
              <div key={cat.id} className="badge badge-outline">{cat.name}</div>
            ))}
          </div>
        </div>
        <span className="text-base font-bold">{item.price}€</span>
        <div className="card-actions flex flex-row justify-end">
          <button className="btn-primary btn self-end" onClick={() => buyAction(item.id)}>
            Kaufen
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemCard
