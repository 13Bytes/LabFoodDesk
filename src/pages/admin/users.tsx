import { Check, Plus, Users } from "lucide-react"
import RegularPage from "~/components/Layout/RegularPage"
import UserOverview from "~/components/PageComponents/UserOverview"
import { api } from "~/utils/api"

const UserPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()
  const totalPositiveBalance = allBalancesRequest.data?.reduce((sum, user) =>
    sum + Math.max(0, user.balance), 0) || 0
  const totalNegativeBalance = allBalancesRequest.data?.reduce((sum, user) =>
    sum + Math.min(0, user.balance), 0) || 0
  const userCount = allBalancesRequest.data?.length || 0

  return (
    <RegularPage>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stat rounded-box bg-base-200 shadow-sm">
          <div className="stat-figure text-primary">
            <Users className="inline-block h-8 w-8 stroke-current" />
          </div>
          <div className="stat-title">Aktive Nutzer</div>
          <div className="stat-value text-primary">{userCount}</div>
          <div className="stat-desc">im System registriert</div>
        </div>
        <div className="stat rounded-box bg-base-200 shadow-sm">
          <div className="stat-figure text-success">
            <Plus className="inline-block h-8 w-8 stroke-current" />
          </div>
          <div className="stat-title">Offenes Guthaben</div>
          <div className="stat-value text-success">{totalPositiveBalance.toFixed(2)}€</div>
          <div className="stat-desc">verfügbares Geld</div>
        </div>
        <div className="stat rounded-box bg-base-200 shadow-sm">
          <div className="stat-figure text-warning">
            <Check className="inline-block h-8 w-8 stroke-current" />
          </div>
          <div className="stat-title">Offene Schulden</div>
          <div className="stat-value text-warning">
            {Math.abs(totalNegativeBalance).toFixed(2)}€
          </div>
          <div className="stat-desc">noch auszugleichen</div>
        </div>
      </div>

      <UserOverview />
    </RegularPage>
  )
}

export default UserPage