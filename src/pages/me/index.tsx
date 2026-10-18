import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { Balance } from "~/components/General/Balance"
import { UserAvatar } from "~/components/General/UserAvatar"
import {
    CalendarDays,
    CalendarRange,
    Heart,
    Info,
    Package,
    Recycle,
    ShoppingCart,
    Trophy,
} from "lucide-react"
import { api } from "~/utils/api"
import LowCreditWarning from "~/components/PageComponents/LowCreditWarning"
import RankingCard from "~/components/PageComponents/RankingCard"
import StatCard from "~/components/PageComponents/StatsCard"

const Me: NextPage = () => {
    const { data: sessionData } = useSession()
    const { data: userData } = api.user.getMe.useQuery()
    const statsRequest = api.user.getStats.useQuery()
    return (
        <CenteredPage>
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Profile Header */}
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <UserAvatar name={userData?.name} size="xl" weight="bold" />
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-base-content mb-2">
                                {userData?.name || "Lade..."}
                            </h1>
                            {userData?.allowOverdraw && (
                                <span className="badge badge-success gap-2">
                                    <Info className="h-3 w-3" />
                                    Kreditwürdig
                                </span>
                            )}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-base-content/70">Dein Guthaben:</span>
                                <Balance balance={userData?.balance} allowOverdraw={userData?.allowOverdraw} />
                            </div>
                            <LowCreditWarning className="mt-2 text-center" />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {statsRequest.data && (
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <StatCard
                            icon={Trophy}
                            title="Ranking"
                            value={`#${statsRequest.data.prepaidVolumePlacement}`}
                            description="Platz bei Guthaben"
                            colorClass="primary"
                        />
                        <StatCard
                            icon={ShoppingCart}
                            title="Einkäufe"
                            value={`${statsRequest.data.totalAmountBought.toFixed(2)}€`}
                            description="Gesamtausgaben (inkl. Pfand)"
                            colorClass="success"
                        />
                        <StatCard
                            icon={Package}
                            title="Beschaffung"
                            value={`${statsRequest.data.totalAmountProcured.toFixed(2)}€`}
                            description="Für LabEats eingekauft"
                            colorClass="info"
                        />
                        <StatCard
                            icon={CalendarDays}
                            title="Wochenschnitt"
                            value={`${statsRequest.data.averagePerWeek.toFixed(2)}€`}
                            description="Ø der letzten 12 Wochen"
                            colorClass="success"
                        />
                        <StatCard
                            icon={CalendarRange}
                            title="Monatsschnitt"
                            value={`${statsRequest.data.averagePerMonth.toFixed(2)}€`}
                            description="Ø der letzten 12 Wochen"
                            colorClass="success"
                        />
                        <StatCard
                            icon={Recycle}
                            title="Pfand"
                            value={`${statsRequest.data.depositPaid.toFixed(2)}€`}
                            description="Insgesamt Pfand bezahlt"
                            colorClass="info"
                        />
                        <RankingCard
                            icon={Heart}
                            title="Lieblingsartikel"
                            entries={statsRequest.data.favoriteItems}
                            emptyText="Noch nichts gekauft"
                            className="md:col-span-3"
                        />
                    </div>
                )}

                {/* Loading State for Stats */}
                {statsRequest.isLoading && (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card dither bg-linear-to-br from-base-100 to-base-200 border border-base-300 shadow-xl">
                                <div className="card-body">
                                    <div className="skeleton h-16 w-16 rounded-full mx-auto mb-4"></div>
                                    <div className="skeleton h-4 w-24 mx-auto mb-2"></div>
                                    <div className="skeleton h-8 w-16 mx-auto mb-2"></div>
                                    <div className="skeleton h-3 w-20 mx-auto"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Profile Information Card */}
                <div className="card dither bg-linear-to-br from-base-100 to-base-200 border border-base-300 shadow-xl mb-6">
                    <div className="card-body">            <h2 className="card-title text-xl mb-4">
                        <Info className="h-6 w-6" />
                        Profil Information
                    </h2>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Benutzername</span>
                            </label>
                            <input
                                type="text"
                                disabled
                                value={userData?.name || ""}
                                className="input w-full bg-base-200"
                                placeholder="Lade..."
                            />
                            <label className="label">
                                <span className="label-text-alt text-base-content/60">
                                    Dein Benutzername wird aus dem AD synchronisiert
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Debug Information - Collapsed by default */}
                <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-medium">
                        Debug Informationen
                    </div>
                    <div className="collapse-content">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Session Data:</h4>
                                <pre className="bg-base-100 p-3 rounded text-xs overflow-auto">
                                    {sessionData ? JSON.stringify(sessionData, null, 2) : "Nicht verfügbar"}
                                </pre>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">User Data:</h4>
                                <pre className="bg-base-100 p-3 rounded text-xs overflow-auto">
                                    {userData ? JSON.stringify(userData, null, 2) : "Nicht verfügbar"}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CenteredPage>
    )
}

export default Me
