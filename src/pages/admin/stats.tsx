import {
  CalendarDays,
  CalendarRange,
  Package,
  PiggyBank,
  Recycle,
  ShoppingBasket,
  TrendingDown,
  Users,
} from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"
import RankingCard from "~/components/PageComponents/RankingCard"
import StatCard from "~/components/PageComponents/StatsCard"
import { api } from "~/utils/api"

const euro = (value: number) => `${value.toFixed(2)}€`

const AdminStatsPage = () => {
  const { data: stats, isLoading } = api.transaction.getAdminStats.useQuery()

  return (
    <CenteredPage>
      <div className="w-full max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Statistik</h1>
          <p className="text-base-content/70">
            Nur Zusammenfassungen über alle Nutzer, Umsatz ohne Pfand und ohne stornierte Käufe. Durchschnitte über die letzten 12 Wochen.
          </p>
        </div>

        {isLoading && <span className="loading loading-spinner loading-lg" />}

        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={CalendarDays}
                title="Umsatz 7 Tage"
                value={euro(stats.salesLast7Days)}
                description={`Ø ${euro(stats.averageSalesPerWeek)} / Woche`}
                colorClass="primary"
              />
              <StatCard
                icon={CalendarRange}
                title="Umsatz 30 Tage"
                value={euro(stats.salesLast30Days)}
                description={`Ø ${euro(stats.averageSalesPerMonth)} / Monat`}
                colorClass="primary"
              />
              <StatCard
                icon={Users}
                title="Aktive Nutzer"
                value={stats.activeUsersLast30Days}
                description="Mit Kauf in den letzten 30 Tagen"
                colorClass="info"
              />
              <StatCard
                icon={Recycle}
                title="Pfand 30 Tage"
                value={euro(stats.depositLast30Days)}
                description="Bezahlter Pfand"
                colorClass="info"
              />
              <StatCard
                icon={PiggyBank}
                title="Offene Guthaben"
                value={euro(stats.totalCredit)}
                description="Summe aller positiven Kontostände"
                colorClass="success"
              />
              <StatCard
                icon={TrendingDown}
                title="Überzogen"
                value={euro(stats.totalOverdrawn)}
                description={`Summe aus ${stats.overdrawnAccounts} Konten im Minus`}
                colorClass="error"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RankingCard
                icon={ShoppingBasket}
                title="Meistverkauft im Kaufen-Tab"
                entries={stats.topShopItems}
                emptyText="Noch keine Verkäufe"
              />
              <RankingCard
                icon={Package}
                title="Meistbestellt in Gruppenbestellungen"
                entries={stats.topGroupOrderItems}
                emptyText="Noch keine Bestellungen"
              />
            </div>
          </>
        )}
      </div>
    </CenteredPage>
  )
}

export default AdminStatsPage
