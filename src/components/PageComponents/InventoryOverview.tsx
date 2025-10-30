import { useRef, useState } from "react"
import { Plus, Trash2, Package, ShoppingCart, Users, Tag } from "lucide-react"
import Modal from "~/components/Layout/Modal"
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
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-base-content">Inventar</h2>
            </div>
            <button
              className="btn btn-primary gap-2 w-full sm:w-auto"
              onClick={() => setOpenAddItemModal(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Produkt</span>
              <span className="sm:hidden">Neues Produkt</span>
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-primary">
                <Package className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Produkte gesamt</div>
              <div className="stat-value text-primary">{itemCount}</div>
              <div className="stat-desc">Im Inventar</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-secondary">
                <ShoppingCart className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Regulär</div>
              <div className="stat-value text-secondary">{regularItems}</div>
              <div className="stat-desc">Einzelkauf</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-accent">
                <Users className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Gruppen</div>
              <div className="stat-value text-accent">{groupOrderItems}</div>
              <div className="stat-desc">Gruppenbestellungen</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-info">
                <Tag className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Ø Preis</div>
              <div className="stat-value text-info">{averagePrice.toFixed(2)}€</div>
              <div className="stat-desc">Durchschnittspreis</div>
            </div>
          </div>

          {/* Bulk Actions */}
          {checked.length > 0 && (
            <div className="alert alert-info mb-4 shadow-lg">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{checked.length}</span>
                  <span>
                    {checked.length === 1 ? "Produkt ausgewählt" : "Produkte ausgewählt"}
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
          {!allItemsRequest.isLoading && itemCount === 0 && (
            <div className="py-12 text-center">
              <div className="space-y-2 text-base-content/50">
                <Package className="mx-auto h-16 w-16 opacity-30" />
                <p className="text-lg">Keine Produkte vorhanden</p>
                <p className="text-sm">Erstelle dein erstes Produkt mit dem Button oben</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!allItemsRequest.isLoading && itemCount > 0 && (
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
                                Gruppe
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
        </div>

        {/* Modals */}
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
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default InventoryOverview
