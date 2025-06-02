import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { Info, Send, Plus } from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/PageComponents/SendMoney"
import { Balance } from "~/components/General/Balance"
import { api } from "~/utils/api"

const TopUp: NextPage = () => {
  const userWithAllowOverdrawRequest = api.user.getAllUsersWithAllowOverdraw.useQuery()
  const userRequest = api.user.getMe.useQuery()
  const allowedOverdraftUserIds = userWithAllowOverdrawRequest.data?.map((user) => user.id)
  const sessionUser = useSession().data?.user
  const isAuthorizedUser = allowedOverdraftUserIds?.includes(sessionUser?.id || "x")

  return (
    <>
      <CenteredPage>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20">
                <Plus className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold text-base-content">Geld einzahlen</h1>
            </div>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Lade dein LabEats-Konto auf
            </p>
          </div>

          {/* Current Balance Display */}
          <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300">
            <div className="card-body p-6 text-center">
              <h2 className="text-xl font-semibold text-base-content/80 mb-2">Dein aktuelles Guthaben</h2>
              <div className="text-4xl font-bold">
                <Balance balance={userRequest.data?.balance} />
              </div>
            </div>
          </div>

          {isAuthorizedUser ? (
            /* Authorized User Section */
            <div className="space-y-6">
              <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg">
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">                    <div className="p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl border border-success/20">
                      <Send className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-base-content">Geld übertragen</h2>
                      <div className="badge badge-success badge-sm">Du bist autorisiert!</div>
                    </div>
                  </div>
                  <div className="bg-success/5 p-4 rounded-lg border border-success/10 mb-6">
                    <p className="text-base-content">
                      Als autorisierter Nutzer kannst du Bargeldeinzahlungen direkt an andere Nutzer übertragen.
                      Verwende diese Funktion, wenn jemand dir Bargeld gegeben hat und du den entsprechenden
                      Betrag auf sein digitales Konto überweisen möchtest.
                    </p>
                  </div>
                </div>
              </div>
              <SendMoney comment="Einzahlung" sendDescription="Geld übertragen" />
            </div>
          ) : (
            /* Regular User Section */
            <div className="space-y-6">
              <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-lg">
                <div className="card-body p-6">
                  <div className="flex items-start gap-4">                    <div className="p-3 bg-gradient-to-br from-info/20 to-info/5 rounded-2xl border border-info/20 flex-shrink-0">
                      <Info className="h-6 w-6" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-base-content mb-2">So funktioniert's</h2>
                        <p className="text-base-content/80 leading-relaxed">
                          LabEats funktioniert mit Prepaid-Guthaben. Um dein Konto aufzuladen, 
                          gib einem der unten aufgeführten Nutzern Geld 
                          und bitte sie, den Betrag auf dein Konto zu übertragen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorized Users List */}
              <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300">
                <div className="card-body p-6">
                  <h3 className="text-xl font-semibold text-base-content mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Nutzer für Einzahlungen
                  </h3>
                  
                  {userWithAllowOverdrawRequest.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-16 w-full"></div>
                      ))}
                    </div>
                  ) : userWithAllowOverdrawRequest.data && userWithAllowOverdrawRequest.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userWithAllowOverdrawRequest.data.map((user, index) => (
                        <div key={user.id} className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 hover:border-primary/30 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-semibold text-lg">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content">{user.name}</div>
                              <div className="text-sm text-base-content/60">Autorisierter Nutzer</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-base-content/60">
                      <p>Keine autorisierten Nutzer verfügbar</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm">
                        <strong className="text-warning">Wichtiger Hinweis:</strong>
                        <p className="text-base-content/70 mt-1">
                          Gib dein Bargeld nur an die oben aufgeführten Nutzer. 
                          Nur sie können Einzahlungen auf dein Konto vornehmen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CenteredPage>
    </>
  )
}

export default TopUp
