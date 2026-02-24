import { useRef, useState } from "react"
import { Plus, ShoppingBag, Layers } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import AdminSectionCard from "~/components/Layout/AdminSectionCard"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ProcurementItemForm from "../Forms/ProcurementItemForm"
import ActionResponsePopup, { type AnimationHandle, animate } from "../General/ActionResponsePopup"

const ProcurementItemOverview = () => {
  const allItemsRequest = api.item.getAllProcurementItems.useQuery()
  const deleteRequest = api.item.deleteProcuremenntItem.useMutation()
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
  const categorizedItems = allItemsRequest.data?.filter((item) => item.categories.length > 0).length ?? 0
  const uniqueCategories = new Set(
    allItemsRequest.data?.flatMap((item) => item.categories.map((cat) => cat.id)) ?? []
  ).size

  const statistics = [
    {
      icon: ShoppingBag,
      title: "Items gesamt",
      value: itemCount,
      description: "Vorbesteller-Produkte",
      colorClass: "primary"
    },
    {
      icon: Layers,
      title: "Kategorisiert",
      value: categorizedItems,
      description: "Mit Kategorien",
      colorClass: "secondary"
    },
    {
      icon: Layers,
      title: "Kategorien",
      value: uniqueCategories,
      description: "Verschiedene Kategorien",
      colorClass: "accent"
    }
  ]

  const legendRow = (
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
      <th className="hidden md:table-cell">Kategorien</th>
      <th className="text-right">Aktionen</th>
    </tr>
  )

  return (
    <>
      <AdminSectionCard
        icon={ShoppingBag}
        title="Vorbesteller-Items"
        actionButton={{
          label: "Vorbesteller-Item",
          shortLabel: "Neues Item",
          icon: Plus,
          onClick: () => setOpenAddItemModal(true)
        }}
        statistics={statistics}
        bulkActions={checked.length > 0 ? {
          selectedCount: checked.length,
          itemLabel: "Item",
          itemLabelPlural: "Items",
          onDelete: () => setShowDeleteConfirm(true)
        } : undefined}
        isLoading={allItemsRequest.isLoading}
        isEmpty={itemCount === 0}
        emptyStateText="Keine Vorbesteller-Items vorhanden"
        emptyStateSubtext="Erstelle dein erstes Vorbesteller-Item mit dem Button oben"
      >
        {itemCount > 0 && (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                {legendRow}
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
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
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
        <ProcurementItemForm
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
          {checked.length === 1 ? "Vorbesteller-Item" : "Vorbesteller-Items"} löschen?
        </p>
        <p className="text-sm text-warning">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </ConfirmationModal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default ProcurementItemOverview
