import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { Users, UserPlus, Shield, Coins, TrendingUp, TrendingDown } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import UserForm from "../Forms/UserForm"
import ActionResponsePopup, { AnimationHandle } from "../General/ActionResponsePopup"
import { Balance } from "../General/Balance"

const UserOverview = () => {
  const allUsersRequest = api.user.getAllUsersDetailed.useQuery()
  const [selectedUser, setSelectedUser] = useState<Tid>()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()

  const trpcUtils = api.useUtils()
  const [detailView, setDetailView] = useState<Tid>()

  const userIsAdmin = sessionData?.user.is_admin ?? false

  // Calculate statistics
  const userCount = allUsersRequest.data?.length ?? 0
  const adminCount = allUsersRequest.data?.filter(user => user.is_admin).length ?? 0
  const creditworthyCount = allUsersRequest.data?.filter(user => user.allowOverdraw).length ?? 0
  const totalBalance = allUsersRequest.data?.reduce((sum, user) => sum + user.balance, 0) ?? 0
  const positiveBalance = allUsersRequest.data?.reduce(
    (sum, user) => sum + (user.balance > 0 ? user.balance : 0), 
    0
  ) ?? 0
  const negativeBalance = allUsersRequest.data?.reduce(
    (sum, user) => sum + (user.balance < 0 ? user.balance : 0), 
    0
  ) ?? 0

  const Legend = () => (
    <tr>
      <th>Name</th>
      <th className="text-right">Guthaben</th>
      <th className="text-center hidden md:table-cell">Kreditwürdig</th>
      <th className="text-center hidden lg:table-cell">Admin</th>
      {userIsAdmin && <th className="text-right">Aktionen</th>}
    </tr>
  )

  return (
    <>
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-base-content">Benutzerübersicht</h2>
            </div>
            {userIsAdmin && (
              <button
                className="btn btn-primary gap-2 w-full sm:w-auto"
                onClick={() => setSelectedUser("")}
              >
                <UserPlus className="h-5 w-5" />
                <span className="hidden sm:inline">Benutzer</span>
                <span className="sm:hidden">Neuer Benutzer</span>
              </button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-primary">
                <Users className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Benutzer gesamt</div>
              <div className="stat-value text-primary">{userCount}</div>
              <div className="stat-desc">Registrierte Benutzer</div>
            </div>

            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-warning">
                <Shield className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Administratoren</div>
              <div className="stat-value text-warning">{adminCount}</div>
              <div className="stat-desc">Mit Admin-Rechten</div>
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
              <div className="stat-figure text-info">
                <Coins className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Kreditwürdig</div>
              <div className="stat-value text-info">{creditworthyCount}</div>
              <div className="stat-desc">Dürfen überziehen</div>
            </div>
          </div>

          {/* Loading State */}
          {allUsersRequest.isLoading && (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {/* Empty State */}
          {!allUsersRequest.isLoading && userCount === 0 && (
            <div className="py-12 text-center">
              <div className="space-y-2 text-base-content/50">
                <Users className="mx-auto h-16 w-16 opacity-30" />
                <p className="text-lg">Keine Benutzer vorhanden</p>
                <p className="text-sm">Erstelle den ersten Benutzer mit dem Button oben</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!allUsersRequest.isLoading && userCount > 0 && (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra">
                <thead className="bg-base-200">
                  <Legend />
                </thead>
                <tbody>
                  {allUsersRequest.data?.map((user) => (
                    <tr key={user.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-bold">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right">
                        <Balance balance={user.balance} />
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {user.allowOverdraw ? (
                          <span className="badge badge-success gap-2">
                            <Coins className="h-3 w-3" />
                            Ja
                          </span>
                        ) : (
                          <span className="badge badge-ghost gap-2">
                            Nein
                          </span>
                        )}
                      </td>
                      <td className="text-center hidden lg:table-cell">
                        {user.is_admin ? (
                          <span className="badge badge-warning gap-2">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="badge badge-ghost">
                            Benutzer
                          </span>
                        )}
                      </td>
                      {userIsAdmin && (
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-sm hover:btn-primary"
                            onClick={() => {
                              setSelectedUser(user.id)
                            }}
                          >
                            Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Balance Summary */}
          {!allUsersRequest.isLoading && userCount > 0 && (
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
                  <div className="stat-desc">Über alle Benutzer</div>
                </div>
              </div>
            </div>
          )}

          {/* Info Footer */}
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
            <span className="text-xs sm:text-sm">Admin-Rolle wird aus LDAP synchronisiert</span>
          </div>
        </div>

        {/* Modal */}
        <Modal open={!!selectedUser} setOpen={(a) => setSelectedUser(undefined)}>
          <UserForm id={selectedUser} finishAction={() => setSelectedUser(undefined)} />
        </Modal>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default UserOverview
