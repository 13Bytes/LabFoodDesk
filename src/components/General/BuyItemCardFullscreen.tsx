import type { Category, Item } from "@prisma/client"
import { calculateAdditionalItemPricing } from "~/helper/dataProcessing"

interface Props {
  item: Item & {
    categories: Category[]
  }
  buyAction: (itemID: string) => void
}

const BuyItemCardFullscreen = ({ item, buyAction }: Props) => {
  const additionalPricing = calculateAdditionalItemPricing(item, item.categories)

  return (
    <div className="card-compact card w-screen h-full bg-base-300 shadow-sm" key={item.id}>
      <div className="card-body">
        <div className="flex flex-row"></div>
          <div className="flex flex-row justify-between">
            <h2 className="card-title mr-6">{item.name}</h2>
            <div className="flex items-end self-center ">
              {item.categories.map((cat) => (
                <div key={cat.id} className="badge badge-outline">
                  {cat.name}
                </div>
              ))}
            </div>
          <div>
            <span className="text-base font-bold ">{item.price}€</span>
            {additionalPricing > 0 && (
              <span className="font ml-1 text-sm">+{additionalPricing}€</span>
            )}
          </div>
        </div>
        <div className="card-actions flex flex-row justify-center mt-4">
          <button className="btn-primary btn w-full h-96 self-end text-3xl" onClick={() => buyAction(item.id)}>
            Kaufen
          </button>
        </div>
      </div>
    </div>
  )
}

export default BuyItemCardFullscreen
