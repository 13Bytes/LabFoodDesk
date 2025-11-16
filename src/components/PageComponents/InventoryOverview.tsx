import { useRef, useState } from "react"
import { Plus, Trash2, Package, ShoppingCart, Users, Tag } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import AdminSectionCard from "~/components/Layout/AdminSectionCard"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ItemForm from "../Forms/ItemForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"

const InventoryOverview = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const deleteRequest = api.item.deleteItem.useMutation()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useUtils()
  const [detailView, setDetailView] = useState<Tid>()
  const [checked, setChecked] = useState<Tid[]>([])

  const deleteSelected = async () => {
    await Promise.all(
      checked.map(async (id) => {
        return deleteRequest.mutateAsync({ id })
      }),
    ).catch((e) => {
      console.error(e)
      animate(animationRef, "failure")
    })
    setChecked([])
    await trpcUtils.item.invalidate()
    animate(animationRef, "success")
  }

  // Calculate statistics
  const itemCount = allItemsRequest.data?.length ?? 0
  const groupOrderItems = allItemsRequest.data?.filter((item) => item.for_grouporders).length ?? 0
  const regularItems = itemCount - groupOrderItems
  const averagePrice = itemCount > 0 
    ? (allItemsRequest.data?.reduce((sum, item) => sum + item.price, 0) ?? 0) / itemCount
    : 0

  const statistics = [
    {
      icon: Package,
      title: "Produkte gesamt",
      value: itemCount,
      description: "Im Inventar",
      colorClass: "primary"
    },
    {
      icon: ShoppingCart,
      title: "Regulär",
      value: regularItems,
      description: "Einzelkauf",
      colorClass: "secondary"
    },
    {
      icon: Users,
      title: "Gruppen",
      value: groupOrderItems,
      description: "Gruppenbestellungen",
      colorClass: "accent"
    },
    {
      icon: Tag,
      title: "Ø Preis",
      value: `${averagePrice.toFixed(2)}€`,
      description: "Durchschnittspreis",
      colorClass: "info"
    }
  ]

  const Legend = () => (
    <tr>
      <th className="w-12">
        <label>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={checked.length > 0 && checked.length === itemCount}
            onChange={() => {
              if (checked.length === itemCount) {
                setChecked([])
              } else {
                setChecked(allItemsRequest.data?.map((item) => item.id) ?? [])
              }
            }}
          />
        </label>
      </th>
      <th>Name</th>
      <th className="text-right">Preis</th>
      <th className="hidden md:table-cell">Konto</th>
      <th className="hidden lg:table-cell">Kategorien</th>
      <th className="text-right">Aktionen</th>
    </tr>
  )

  return (
    <>
      <AdminSectionCard
        icon={Package}
        title="Inventar"
        actionButton={{
          label: "Produkt",
          shortLabel: "Neues Produkt",
          icon: Plus,
          onClick: () => setOpenAddItemModal(true)
        }}
        statistics={statistics}
        bulkActions={checked.length > 0 ? {
          selectedCount: checked.length,
          itemLabel: "Produkt",
          itemLabelPlural: "Produkte",
          onDelete: () => setShowDeleteConfirm(true)
        } : undefined}
        isLoading={allItemsRequest.isLoading}
        isEmpty={itemCount === 0}
        emptyStateText="Keine Produkte vorhanden"
        emptyStateSubtext="Erstelle dein erstes Produkt mit dem Button oben"
      >
        {itemCount > 0 && (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <Legend />
              </thead>
              <tbody>
                {allItemsRequest.data?.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-base-200/50 transition-colors"
                  >
                    <th>
                      <label>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={checked.includes(item.id)}
                          onChange={() => setChecked((old) => toggleElementInArray(old, item.id))}
                        />
                      </label>
                    </th>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-bold">{item.name}</div>
                          {item.for_grouporders && (
                            <span className="badge badge-accent badge-sm mt-1">
                              <Users className="mr-1 h-3 w-3" />
                              Für Gruppenbestellungen
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-semibold text-lg">{item.price.toFixed(2)}€</span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="badge badge-outline">{item.account.name}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.length > 0 ? (
                          item.categories.map((cat) => (
                            <span key={cat.id} className="badge badge-sm">
                              {cat.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-base-content/40 text-sm">Keine Kategorien</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-ghost btn-sm hover:btn-primary"
                        onClick={() => {
                          setDetailView(item.id)
                          setOpenAddItemModal(true)
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>

      <Modal
        open={openAddItemModal}
        setOpen={setOpenAddItemModal}
        closeFunctionCall={() => setDetailView(undefined)}
      >
        <ItemForm
          finishAction={() => {
            setOpenAddItemModal(false)
            setDetailView(undefined)
          }}
          id={detailView}
        />
      </Modal>

      <ConfirmationModal
        open={showDeleteConfirm}
        close={() => setShowDeleteConfirm(false)}
        proceed={() => {
          deleteSelected()
          setShowDeleteConfirm(false)
        }}
      >
        <p className="py-4">
          Möchtest du wirklich {checked.length}{" "}
          {checked.length === 1 ? "Produkt" : "Produkte"} löschen?
        </p>
        <p className="text-sm text-warning">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </ConfirmationModal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default InventoryOverview
