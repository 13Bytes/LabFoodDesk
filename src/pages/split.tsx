import { type NextPage } from "next"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Download, Upload, Send, ArrowDownToLine, ArrowUpRight, ArrowDownLeft, Zap, BarChart3, User, Plus } from "lucide-react"
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
          <div className="bg-base-200 rounded-2xl p-6 mb-8">            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Schnellaktionen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">              <Link href="/all-users" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-primary transition-all duration-300 group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Alle Kontostände</div>
                  <div className="text-sm opacity-70">Übersicht aller Nutzer</div>
                </div>
              </Link>
                <Link href="/account" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-secondary transition-all duration-300 group">
                <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Mein Konto</div>
                  <div className="text-sm opacity-70">Transaktionshistorie</div>
                </div>
              </Link>
                <Link href="/top-up" className="btn btn-outline btn-lg gap-3 justify-start hover:btn-accent transition-all duration-300 group">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <Plus className="h-5 w-5" />
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
