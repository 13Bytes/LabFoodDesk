import type { Category, Item } from "@prisma/client"
import { calculateAdditionalItemPricing } from "~/helper/dataProcessing"

interface Props {
  item: Item & {
    categories: Category[]
  }
  buyAction: (itemID: string) => void
}

const BuyItemCardBig = ({ item, buyAction }: Props) => {
  const additionalPricing = calculateAdditionalItemPricing(item, item.categories)

  return (
    <div className="card h-full w-full md:w-1/2 xl:w-96 bg-base-300 shadow-sm" key={item.id}>
      <div className="align-center card-body flex flex-col items-center">
        <h2 className="card-title text-2xl self-center">{item.name}</h2>
        <div className="flex flex-row gap-2">
          {item.categories.map((cat) => (
            <div key={cat.id} className="badge badge-outline">
              {cat.name}
            </div>
          ))}
        </div>
        <div>
          <span className="text-xl font-bold ">{item.price}€</span>
          {additionalPricing > 0 && (
            <span className="ml-1 text-sm">+{additionalPricing}€</span>
          )}
        </div>
        <div className="card-actions mt-4">
          <button className="btn btn-primary btn-lg" onClick={() => buyAction(item.id)}>
            Kaufen
          </button>
        </div>
      </div>
    </div>
  )
}

export default BuyItemCardBig
