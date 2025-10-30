import type { Category, Item } from "@prisma/client"
import { useState } from "react"
import { calculateAdditionalItemPricing } from "~/helper/dataProcessing"
import { ConfirmationModal } from "./ConfirmationModal"

interface Props {
  item: (Item & {
    categories: Category[]
  }) | { categories: Category[], id: string, name: string },
  buyAction: (itemID: string) => Promise<void>,
  buttonName?: string
  userBalance?: number
}

const BuyItemCard = ({ item, buyAction, buttonName, userBalance }: Props) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const itemWithPrice = 'price' in item
  const additionalPricing = itemWithPrice ? calculateAdditionalItemPricing(item, item.categories) : 0
  const totalPrice = itemWithPrice ? item.price + additionalPricing : NaN

  const handleBuyClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmBuy = async () => {
    setIsProcessing(true)
    setShowConfirmModal(false)
    try {
      await buyAction(item.id)
    } catch (error) {
      // Error is already handled by parent component
      console.error("Purchase failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
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
              onClick={handleBuyClick}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                buttonName ?? "Kaufen"
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={showConfirmModal}
        close={() => setShowConfirmModal(false)}
        proceed={handleConfirmBuy}
        title="Kauf bestätigen"
        cancelText="Abbrechen"
        proceedText="Jetzt kaufen"
        proceedButtonClass="btn btn-primary"
      >
        <div className="space-y-3">
          <p className="text-base">
            Möchtest du <span className="font-semibold">{item.name}</span> wirklich kaufen?
          </p>
          {itemWithPrice && (
            <>
              <div className="bg-base-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/70">Preis:</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)}€</span>
                </div>
                {additionalPricing > 0 && (
                  <div className="text-xs text-base-content/60 mt-1 text-right">
                    (Grundpreis: {item.price}€ + Gebühren: {additionalPricing.toFixed(2)}€)
                  </div>
                )}
              </div>
              {userBalance !== undefined && (
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Dein Guthaben:</span>
                    <span className="text-lg font-bold">{userBalance.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-base-300">
                    <span className="text-base-content/70">Nach Kauf:</span>
                    <span className={`text-lg font-bold ${userBalance - totalPrice < 0 ? 'text-error' : 'text-success'}`}>
                      {(userBalance - totalPrice).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ConfirmationModal>
    </>
  )
}

export default BuyItemCard

