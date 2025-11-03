import { Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { useRef, useState } from "react"
import Modal from "~/components/Layout/Modal"
import AdminSectionCard from "~/components/Layout/AdminSectionCard"
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

  const statistics = [
    {
      icon: Wallet,
      title: "Konten gesamt",
      value: accountCount,
      description: "Verrechnungskonten",
      colorClass: "primary"
    },
    {
      icon: TrendingUp,
      title: "Guthaben",
      value: `${positiveBalance.toFixed(2)}€`,
      description: "Positive Kontostände",
      colorClass: "success"
    },
    {
      icon: TrendingDown,
      title: "Schulden",
      value: `${Math.abs(negativeBalance).toFixed(2)}€`,
      description: "Negative Kontostände",
      colorClass: "error"
    }
  ]

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
      <AdminSectionCard
        icon={Wallet}
        title="Verrechnungskonten"
        actionButton={{
          label: "Verrechnungskonto",
          shortLabel: "Neues Konto",
          icon: Plus,
          onClick: () => setOpenAddItemModal(true)
        }}
        statistics={statistics}
        bulkActions={checked.length > 0 ? {
          selectedCount: checked.length,
          itemLabel: "Konto",
          itemLabelPlural: "Konten",
          onDelete: () => setShowDeleteConfirm(true)
        } : undefined}
        isLoading={allItemsRequest.isLoading}
        isEmpty={accountCount === 0}
        emptyStateText="Keine Verrechnungskonten vorhanden"
        emptyStateSubtext="Erstelle dein erstes Verrechnungskonto mit dem Button oben"
      >
        {accountCount > 0 && (
          <>
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

            {/* Total Balance Summary */}
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
          </>
        )}
      </AdminSectionCard>

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

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default ClearingAccountOverview
