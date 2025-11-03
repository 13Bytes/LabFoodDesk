import { useRef, useState } from "react"
import { Plus, Trash2, Archive, Percent, Euro } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import AdminSectionCard from "~/components/Layout/AdminSectionCard"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategoryForm from "../Forms/CategoryForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"

const CategoryOverview = () => {
  const allItemsRequest = api.category.getAll.useQuery()
  const deleteRequest = api.category.delete.useMutation()
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
    await trpcUtils.category.invalidate()
    animate(animationRef, "success")
  }

  // Calculate statistics
  const categoryCount = allItemsRequest.data?.length ?? 0
  const categoriesWithMarkup = allItemsRequest.data?.filter(
    (cat) => (cat.markupPercentage ?? 0) > 0 || (cat.markupFixed ?? 0) > 0
  ).length ?? 0

  const Legend = () => (
    <tr>
      <th className="w-12">
        <label>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={checked.length > 0 && checked.length === categoryCount}
            onChange={() => {
              if (checked.length === categoryCount) {
                setChecked([])
              } else {
                setChecked(allItemsRequest.data?.map((item) => item.id) ?? [])
              }
            }}
          />
        </label>
      </th>
      <th>Name</th>
      <th className="text-center hidden md:table-cell">
        <div className="flex items-center justify-center gap-1">
          <Percent className="h-4 w-4" />
          Aufpreis
        </div>
      </th>
      <th className="text-center hidden lg:table-cell">
        <div className="flex items-center justify-center gap-1">
          <Euro className="h-4 w-4" />
          Aufpreis
        </div>
      </th>
      <th className="text-right">Aktionen</th>
    </tr>
  )

  return (
    <>
      <AdminSectionCard
        icon={Archive}
        title="Kategorien"
        actionButton={{
          label: "Kategorie",
          shortLabel: "Neue Kategorie",
          onClick: () => setOpenAddItemModal(true),
          icon: Plus,
        }}
        statistics={[
          {
            icon: Archive,
            title: "Kategorien gesamt",
            value: categoryCount,
            description: "Verfügbare Kategorien",
            colorClass: "primary",
          },
          {
            icon: Percent,
            title: "Mit Aufpreis",
            value: categoriesWithMarkup,
            description: "Kategorien haben Aufschläge",
            colorClass: "secondary",
          },
        ]}
        bulkActions={
          checked.length > 0
            ? {
                selectedCount: checked.length,
                itemLabel: "Kategorie",
                itemLabelPlural: "Kategorien",
                onDelete: () => setShowDeleteConfirm(true),
              }
            : undefined
        }
        isLoading={allItemsRequest.isLoading}
        isEmpty={categoryCount === 0}
        emptyStateText="Keine Kategorien vorhanden"
        emptyStateSubtext="Erstelle deine erste Kategorie mit dem Button oben"
      >
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <Legend />
            </thead>
            <tbody>
              {allItemsRequest.data?.map((item) => (
                <tr key={item.id} className="hover:bg-base-200/50 transition-colors">
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
                        {item.markupDescription && (
                          <div className="text-xs text-base-content/60">
                            {item.markupDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center hidden md:table-cell">
                    {item.markupPercentage && item.markupPercentage > 0 ? (
                      <span className="badge badge-primary badge-lg">
                        {item.markupPercentage}%
                      </span>
                    ) : (
                      <span className="text-base-content/40">-</span>
                    )}
                  </td>
                  <td className="text-center hidden lg:table-cell">
                    {item.markupFixed && item.markupFixed > 0 ? (
                      <span className="badge badge-secondary badge-lg">
                        {item.markupFixed.toFixed(2)}€
                      </span>
                    ) : (
                      <span className="text-base-content/40">-</span>
                    )}
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
      </AdminSectionCard>

      {/* Modals */}
      <Modal
        open={openAddItemModal}
        setOpen={setOpenAddItemModal}
        closeFunctionCall={() => setDetailView(undefined)}
      >
        <CategoryForm
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
          {checked.length === 1 ? "Kategorie" : "Kategorien"} löschen?
        </p>
        <p className="text-sm text-warning">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </ConfirmationModal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default CategoryOverview
