import { useRef, useState } from "react"
import { Plus, Trash2, Archive, Percent, Euro } from "lucide-react"
import Modal from "~/components/Layout/Modal"
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
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Archive className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-base-content">Kategorien</h2>
            </div>
            <button
              className="btn btn-primary gap-2 w-full sm:w-auto"
              onClick={() => setOpenAddItemModal(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Kategorie</span>
              <span className="sm:hidden">Neue Kategorie</span>
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-primary">
                <Archive className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Kategorien gesamt</div>
              <div className="stat-value text-primary">{categoryCount}</div>
              <div className="stat-desc">Verfügbare Kategorien</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-secondary">
                <Percent className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Mit Aufpreis</div>
              <div className="stat-value text-secondary">{categoriesWithMarkup}</div>
              <div className="stat-desc">Kategorien haben Aufschläge</div>
            </div>
          </div>

          {/* Bulk Actions */}
          {checked.length > 0 && (
            <div className="alert alert-info mb-4 shadow-lg">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{checked.length}</span>
                  <span>
                    {checked.length === 1 ? "Kategorie ausgewählt" : "Kategorien ausgewählt"}
                  </span>
                </div>
                <button
                  className="btn btn-error btn-sm gap-2 w-full sm:w-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {allItemsRequest.isLoading && (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {/* Empty State */}
          {!allItemsRequest.isLoading && categoryCount === 0 && (
            <div className="py-12 text-center">
              <div className="space-y-2 text-base-content/50">
                <Archive className="mx-auto h-16 w-16 opacity-30" />
                <p className="text-lg">Keine Kategorien vorhanden</p>
                <p className="text-sm">Erstelle deine erste Kategorie mit dem Button oben</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!allItemsRequest.isLoading && categoryCount > 0 && (
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
          )}
        </div>

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
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default CategoryOverview
