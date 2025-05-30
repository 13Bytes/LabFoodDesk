import { type NextPage } from "next"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowDownSquareStack } from "~/components/Icons/ArrowDownSquareStack"
import { ArrowUpSquareStack } from "~/components/Icons/ArrowUpSquareStack"
import { SendMoneyIcon } from "~/components/Icons/SendMoneyIcon"
import { RequestMoneyIcon } from "~/components/Icons/RequestMoneyIcon"
import CenteredPage from "~/components/Layout/CenteredPage"
import GetMoney from "~/components/PageComponents/GetMoney"
import SendMoney from "~/components/PageComponents/SendMoney"
import { Balance } from "~/components/General/Balance"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()
  const session = useSession()
  const userData = api.user.getMe.useQuery();

  // Quick stats for the overview
  const totalPositiveBalance = allBalancesRequest.data?.reduce((sum, user) => 
    sum + Math.max(0, user.balance), 0) || 0
  const totalNegativeBalance = allBalancesRequest.data?.reduce((sum, user) => 
    sum + Math.min(0, user.balance), 0) || 0
  const userCount = allBalancesRequest.data?.length || 0

  return (
    <>
      <CenteredPage>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header with personal balance */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                  <span className="text-2xl font-bold">
                    {session.data?.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-base-content">
                  Hallo, {session.data?.user.name}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base-content/70">Dein Guthaben:</span>
                  <Balance balance={userData.data?.balance} />
                </div>
              </div>
            </div>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Verwalte dein Geld einfach und schnell. Sende Geld an Freunde oder fordere ausstehende Beträge ein.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="stat-title">Aktive Nutzer</div>
              <div className="stat-value text-primary">{userCount}</div>
              <div className="stat-desc">im System registriert</div>
            </div>
            
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-figure text-success">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div className="stat-title">Positives Guthaben</div>
              <div className="stat-value text-success">{totalPositiveBalance.toFixed(2)}€</div>
              <div className="stat-desc">verfügbares Geld</div>
            </div>
            
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-figure text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="stat-title">Offene Schulden</div>
              <div className="stat-value text-warning">{Math.abs(totalNegativeBalance).toFixed(2)}€</div>
              <div className="stat-desc">noch auszugleichen</div>
            </div>
          </div>

          {/* Main Actions Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Send Money Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl border border-success/20">
                  <SendMoneyIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                    Geld senden
                    <div className="badge badge-success badge-sm">Beliebt</div>
                  </h2>
                  <p className="text-base-content/70">Überweise Geld schnell und einfach</p>
                </div>
              </div>
              <SendMoney />
            </div>

            {/* Get Money Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-warning/20 to-warning/5 rounded-2xl border border-warning/20">
                  <RequestMoneyIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-base-content">Geld einfordern</h2>
                  <p className="text-base-content/70">Fordere ausstehende Beträge ein</p>
                </div>
              </div>
              <GetMoney />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-base-200 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Schnellaktionen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/all-users" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-primary transition-all duration-300 group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Alle Kontostände</div>
                  <div className="text-sm opacity-70">Übersicht aller Nutzer</div>
                </div>
              </Link>
              
              <Link href="/account" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-secondary transition-all duration-300 group">
                <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Mein Konto</div>
                  <div className="text-sm opacity-70">Transaktionshistorie</div>
                </div>
              </Link>
              
              <Link href="/top-up" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-accent transition-all duration-300 group">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Geld einzahlen</div>
                  <div className="text-sm opacity-70">Guthaben aufladen</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity Preview */}
          {allBalancesRequest.data && allBalancesRequest.data.length > 0 && (
            <div className="bg-base-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Kontostand-Übersicht
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {allBalancesRequest.data.slice(0, 12).map((user) => (
                  <div key={user.id} className="bg-base-100 p-3 rounded-lg border border-base-300 hover:border-primary/50 transition-colors">
                    <div className="text-sm font-medium truncate" title={user.name}>
                      {user.name}
                    </div>
                    <div className={`font-bold text-sm ${user.balance >= 0 ? "text-success" : "text-error"}`}>
                      {user.balance.toFixed(2)}€
                    </div>
                  </div>
                ))}
              </div>
              {allBalancesRequest.data.length > 12 && (
                <div className="mt-4 text-center">
                  <Link href="/all-users" className="btn btn-ghost btn-sm">
                    Alle {allBalancesRequest.data.length} Nutzer anzeigen →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </CenteredPage>
    </>
  )
}

export default SplitPage
