import { Plus, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { useRef, useState } from "react"
import Modal from "~/components/Layout/Modal"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ClearingAccountForm from "../Forms/ClearingAccountForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"

const ClearingAccountOverview = () => {
  const allItemsRequest = api.clearingAccount.getAll.useQuery()
  const deleteRequest = api.clearingAccount.delete.useMutation()
  const animationRef = useRef<AnimationHandle>(null)
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      animate(animationRef, "failure", e.message)
    })
    setChecked([])
    await trpcUtils.clearingAccount.invalidate()
    animate(animationRef, "success")
  }

  // Calculate statistics
  const accountCount = allItemsRequest.data?.length ?? 0
  const totalBalance = allItemsRequest.data?.reduce((sum, account) => sum + account.balance, 0) ?? 0
  const positiveBalance = allItemsRequest.data?.reduce(
    (sum, account) => sum + (account.balance > 0 ? account.balance : 0), 
    0
  ) ?? 0
  const negativeBalance = allItemsRequest.data?.reduce(
    (sum, account) => sum + (account.balance < 0 ? account.balance : 0), 
    0
  ) ?? 0

  const Legend = () => (
    <tr>
      <th className="w-12">
        <label>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={checked.length > 0 && checked.length === accountCount}
            onChange={() => {
              if (checked.length === accountCount) {
                setChecked([])
              } else {
                setChecked(allItemsRequest.data?.map((item) => item.id) ?? [])
              }
            }}
          />
        </label>
      </th>
      <th>Name</th>
      <th className="text-right">Kontostand</th>
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
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-base-content">Verrechnungskonten</h2>
            </div>
            <button
              className="btn btn-primary gap-2 w-full sm:w-auto"
              onClick={() => setOpenAddItemModal(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Verrechnungskonto</span>
              <span className="sm:hidden">Neues Konto</span>
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-primary">
                <Wallet className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Konten gesamt</div>
              <div className="stat-value text-primary">{accountCount}</div>
              <div className="stat-desc">Verrechnungskonten</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-success">
                <TrendingUp className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Guthaben</div>
              <div className="stat-value text-success">{positiveBalance.toFixed(2)}€</div>
              <div className="stat-desc">Positive Kontostände</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-error">
                <TrendingDown className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Schulden</div>
              <div className="stat-value text-error">{Math.abs(negativeBalance).toFixed(2)}€</div>
              <div className="stat-desc">Negative Kontostände</div>
            </div>
          </div>

          {/* Bulk Actions */}
          {checked.length > 0 && (
            <div className="alert alert-info mb-4 shadow-lg">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{checked.length}</span>
                  <span>
                    {checked.length === 1 ? "Konto ausgewählt" : "Konten ausgewählt"}
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
          {!allItemsRequest.isLoading && accountCount === 0 && (
            <div className="py-12 text-center">
              <div className="space-y-2 text-base-content/50">
                <Wallet className="mx-auto h-16 w-16 opacity-30" />
                <p className="text-lg">Keine Verrechnungskonten vorhanden</p>
                <p className="text-sm">Erstelle dein erstes Verrechnungskonto mit dem Button oben</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!allItemsRequest.isLoading && accountCount > 0 && (
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
                          </div>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className={`font-bold text-lg ${
                          item.balance > 0 
                            ? 'text-success' 
                            : item.balance < 0 
                            ? 'text-error' 
                            : 'text-base-content'
                        }`}>
                          {item.balance > 0 && '+'}
                          {item.balance.toFixed(2)}€
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

          {/* Total Balance Summary */}
          {!allItemsRequest.isLoading && accountCount > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Gesamtsaldo</div>
                  <div className={`stat-value text-2xl ${
                    totalBalance > 0 
                      ? 'text-success' 
                      : totalBalance < 0 
                      ? 'text-error' 
                      : 'text-base-content'
                  }`}>
                    {totalBalance > 0 && '+'}
                    {totalBalance.toFixed(2)}€
                  </div>
                  <div className="stat-desc">Über alle Konten</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <Modal
          open={openAddItemModal}
          setOpen={setOpenAddItemModal}
          closeFunctionCall={() => setDetailView(undefined)}
        >
          <ClearingAccountForm
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
            {checked.length === 1 ? "Verrechnungskonto" : "Verrechnungskonten"} löschen?
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

export default ClearingAccountOverview
