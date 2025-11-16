import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { Users, UserPlus, Shield, Coins } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import AdminSectionCard from "~/components/Layout/AdminSectionCard"
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

  const stats = [
    {
      icon: Users,
      iconColor: "text-primary",
      title: "Benutzer gesamt",
      value: userCount,
      description: "Registrierte Benutzer",
      colorClass: "primary"
    },
    {
      icon: Shield,
      iconColor: "text-warning",
      title: "Administratoren",
      value: adminCount,
      description: "Mit Admin-Rechten",
      colorClass: "warning"
    },
    {
      icon: Coins,
      iconColor: "text-success",
      title: "Guthaben",
      value: `${positiveBalance.toFixed(2)}€`,
      description: "Positive Kontostände",
      colorClass: "success"
    },
    {
      icon: Coins,
      iconColor: "text-info",
      title: "Kreditwürdig",
      value: creditworthyCount,
      description: "Dürfen überziehen",
      colorClass: "info"
    }
  ]

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
      <AdminSectionCard
        icon={Users}
        title="Benutzerübersicht"
        statistics={stats}
        isLoading={allUsersRequest.isLoading}
        isEmpty={userCount === 0}
        emptyStateText="Keine Benutzer vorhanden"
        emptyStateSubtext="Erstelle den ersten Benutzer mit dem Button oben"
        infoFooter="Admin-Rolle wird aus LDAP synchronisiert"
      >
        {userCount > 0 && (
          <>
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
                  <div className="stat-desc">Über alle Benutzer</div>
                </div>
              </div>
            </div>
          </>
        )}
      </AdminSectionCard>

      <Modal open={!!selectedUser} setOpen={(a) => setSelectedUser(undefined)}>
        <UserForm id={selectedUser} finishAction={() => setSelectedUser(undefined)} />
      </Modal>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default UserOverview
