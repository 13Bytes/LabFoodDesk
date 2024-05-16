import type { Category } from "@prisma/client"
import type { Tid } from "~/helper/zodTypes"

interface Props {
  name: string
  id: Tid
  categories: Category[]
  price?: number
  buyAction: (itemID: string) => void
  buttonName?: string
}

const ItemCard = ({ id, name, buyAction, price, categories, buttonName }: Props) => {
  return (
    <div className="card-compact card w-72 bg-base-300 shadow-sm" key={id}>
      <div className="card-body">
        <div className="flex flex-row justify-between">
          <h2 className="card-title mr-6">{name}</h2>
          <div className="flex flex-col items-end self-center ">
            {categories.map((cat) => (
              <div key={cat.id} className="badge badge-outline">
                {cat.name}
              </div>
            ))}
          </div>
        </div>
        <span className="text-base font-bold">{price ? `${price}€`: "Preis nach Bestellung" }</span>
        <div className="card-actions flex flex-row justify-end">
          <button className="btn-primary btn self-end" onClick={() => buyAction(id)}>
            {buttonName ? buttonName : "Kaufen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemCard
