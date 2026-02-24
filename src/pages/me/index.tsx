import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { Balance } from "~/components/General/Balance"
import { Info } from "lucide-react"
import { api } from "~/utils/api"
import { getUsernameLetters } from "~/helper/generalFunctions"
import LowCreditWarning from "~/components/PageComponents/LowCreditWarning"

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
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-20 h-20">
                                <span className="text-3xl font-bold">
                                    {getUsernameLetters(userData?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-base-content mb-2">
                                {userData?.name || "Lade..."}
                            </h1>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-base-content/70">Dein Guthaben:</span>
                                <Balance balance={userData?.balance} />
                            </div>
                            <LowCreditWarning className="mt-2 text-center" />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {!statsRequest.isLoading && statsRequest.data && (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {/* Ranking Card */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-2">🏆</div>
                                <h3 className="card-title justify-center text-lg">Ranking</h3>
                                <div className="text-3xl font-bold text-primary">
                                    #{statsRequest.data.prepaidVolumePlacement}
                                </div>
                                <p className="text-sm text-base-content/70">
                                    Platz bei Guthaben
                                </p>
                            </div>
                        </div>

                        {/* Purchases Card */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-2">🛒</div>
                                <h3 className="card-title justify-center text-lg">Einkäufe</h3>
                                <div className="text-3xl font-bold text-success">
                                    {statsRequest.data.totalAmountBought.toFixed(2)}€
                                </div>
                                <p className="text-sm text-base-content/70">
                                    Dinge gekauft
                                </p>
                            </div>
                        </div>

                        {/* Procurement Card */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-2">📦</div>
                                <h3 className="card-title justify-center text-lg">Beschaffung</h3>
                                <div className="text-3xl font-bold text-info">
                                    {statsRequest.data.totalAmountProcured.toFixed(2)}€
                                </div>
                                <p className="text-sm text-base-content/70">
                                    Für LabEats eingekauft
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State for Stats */}
                {statsRequest.isLoading && (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card bg-base-100 shadow-xl">
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
                <div className="card bg-base-100 shadow-xl mb-6">
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
                                className="input input-bordered w-full bg-base-200"
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
