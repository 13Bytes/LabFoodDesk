import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  description: string
  colorClass?: string
}

interface AdminSectionCardProps {
  // Header Props
  icon: LucideIcon
  title: string
  actionButton?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
    shortLabel?: string
  }

  // Statistics Props (optional)
  statistics?: StatCardProps[]

  // Bulk Actions Props (optional)
  bulkActions?: {
    selectedCount: number
    itemLabel: string
    itemLabelPlural?: string
    onDelete: () => void
  }

  // Loading and Empty States
  isLoading?: boolean
  isEmpty?: boolean
  emptyStateText?: string
  emptyStateSubtext?: string

  // Info Footer (optional)
  infoFooter?: string

  // Table Content
  children: ReactNode
}

const StatCard = ({ icon: Icon, title, value, description, colorClass = "primary" }: StatCardProps) => (
  <div className="stat rounded-box bg-base-200 shadow-sm">
    <div className={`stat-figure text-${colorClass}`}>
      <Icon className="inline-block h-8 w-8 stroke-current" />
    </div>
    <div className="stat-title">{title}</div>
    <div className={`stat-value text-${colorClass}`}>{value}</div>
    <div className="stat-desc">{description}</div>
  </div>
)

const AdminSectionCard = ({
  icon: Icon,
  title,
  actionButton,
  statistics,
  bulkActions,
  isLoading = false,
  isEmpty = false,
  emptyStateText,
  emptyStateSubtext,
  infoFooter,
  children,
}: AdminSectionCardProps) => {
  const ActionButton = actionButton?.icon

  return (
    <>
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-base-content">{title}</h2>
            </div>
            {actionButton && (
              <button
                className="btn btn-primary gap-2 w-full sm:w-auto"
                onClick={actionButton.onClick}
              >
                {ActionButton && <ActionButton className="h-5 w-5" />}
                {actionButton.shortLabel && (
                  <span className="sm:hidden">{actionButton.shortLabel}</span>
                )}
                <span className={actionButton.shortLabel ? "hidden sm:inline" : ""}>
                  {actionButton.label}
                </span>
              </button>
            )}
          </div>

          {/* Statistics Cards */}
          {statistics && statistics.length > 0 && (
            <div 
              className={`mb-6 grid grid-cols-1 gap-4 ${
                statistics.length === 2 
                  ? "md:grid-cols-2" 
                  : statistics.length === 3 
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : statistics.length === 4
                  ? "sm:grid-cols-2 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {statistics.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}

          {/* Bulk Actions */}
          {bulkActions && bulkActions.selectedCount > 0 && (
            <div className="alert alert-info mb-4 shadow-lg">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{bulkActions.selectedCount}</span>
                  <span>
                    {bulkActions.selectedCount === 1
                      ? `${bulkActions.itemLabel} ausgewählt`
                      : `${bulkActions.itemLabelPlural || bulkActions.itemLabel} ausgewählt`}
                  </span>
                </div>
                <button
                  className="btn btn-error btn-sm gap-2 w-full sm:w-auto"
                  onClick={bulkActions.onDelete}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Löschen
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && isEmpty && (
            <div className="py-12 text-center">
              <div className="space-y-2 text-base-content/50">
                <Icon className="mx-auto h-16 w-16 opacity-30" />
                <p className="text-lg">{emptyStateText || "Keine Einträge vorhanden"}</p>
                {emptyStateSubtext && <p className="text-sm">{emptyStateSubtext}</p>}
              </div>
            </div>
          )}

          {/* Table Content */}
          {!isLoading && !isEmpty && children}

          {/* Info Footer */}
          {infoFooter && (
            <div className="mt-4 alert alert-info shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs sm:text-sm">{infoFooter}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default AdminSectionCard
