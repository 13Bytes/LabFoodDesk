import { type NextPage } from "next"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Download, Upload, Send, ArrowDownToLine, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"
import GetMoney from "~/components/PageComponents/GetMoney"
import SendMoney from "~/components/PageComponents/SendMoney"
import { Balance } from "~/components/General/Balance"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const session = useSession()
  const userData = api.user.getMe.useQuery();

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

          {/* Main Actions Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Send Money Section */}
            <div className="space-y-6">              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl border border-success/20">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                    Geld senden
                    <div className="badge badge-success badge-sm">Standard</div>
                  </h2>
                  <p className="text-base-content/70">Überweise Geld schnell und einfach</p>
                </div>
              </div>
              <SendMoney />
            </div>

            {/* Get Money Section */}
            <div className="space-y-6">              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-warning/20 to-warning/5 rounded-2xl border border-warning/20">
                  <ArrowDownLeft className="h-6 w-6" />
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
        </div>
      </CenteredPage>
    </>
  )
}

export default SplitPage
