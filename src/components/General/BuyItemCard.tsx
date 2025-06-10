import type { Category, Item } from "@prisma/client"
import { calculateAdditionalItemPricing } from "~/helper/dataProcessing"

interface Props {
  item: (Item & {
    categories: Category[]
  }) | { categories: Category[], id: string, name: string },
  buyAction: (itemID: string) => void,
  buttonName?: string
}

const BuyItemCard = ({ item, buyAction, buttonName }: Props) => {

  const itemWithPrice = 'price' in item
  const additionalPricing = itemWithPrice ? calculateAdditionalItemPricing(item, item.categories) : 0
  const totalPrice = itemWithPrice ? item.price + additionalPricing : NaN

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 border border-base-300 hover:border-primary/30" key={item.id}>
      <div className="card-body p-4">
        {/* Header with title and categories */}
        <div className="space-y-3">
          <div className="flex flex-col space-y-2">
            <h2 className="card-title text-lg font-semibold leading-tight">
              {item.name}
            </h2>

            {/* Categories */}
            {item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.categories.map((cat) => (
                  <div key={cat.id} className="badge badge-outline badge-sm">
                    {cat.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-baseline space-x-1">
            {itemWithPrice &&
              <>
                <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)}€</span>
                {additionalPricing > 0 && (
                  <span className="text-sm text-base-content/60">
                    ({item.price}€ + {additionalPricing.toFixed(2)}€)
                  </span>
                )}
              </>
            }
            {!itemWithPrice && 
              <span className="text-sm text-base-content/60">Preis nach Bestellung</span>
            }
          </div>
        </div>

        {/* Action button */}
        <div className="card-actions mt-4">
          <button
            className="btn btn-primary btn-sm w-full font-medium"
            onClick={() => buyAction(item.id)}
          >
            {buttonName ?? "Kaufen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BuyItemCard
