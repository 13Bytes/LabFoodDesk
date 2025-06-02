import { type NextPage } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { Home, ArrowLeft, Search, Coffee } from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"

const Custom404: NextPage = () => {
  const router = useRouter()

  return (
    <CenteredPage>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          {/* Large 404 with food icon */}
          <div className="mb-8 flex items-center justify-center space-x-4">
            <span className="text-8xl font-bold text-primary md:text-9xl">4</span>
            <div className="flex flex-col items-center">
              <Coffee size={80} className="text-primary animate-bounce" />
              <span className="text-xs text-base-content/60 mt-2">Kein Essen hier!</span>
            </div>
            <span className="text-8xl font-bold text-primary md:text-9xl">4</span>
          </div>

          {/* Error message */}
          <div className="mb-8 max-w-md">
            <h1 className="mb-4 text-3xl font-bold text-base-content md:text-4xl">
              Ups! Seite nicht gefunden
            </h1>
            <p className="text-base-content/70 mb-6 text-lg">
              Die Seite, nach der du suchst, existiert nicht oder wurde verschoben. 
              Vielleicht findest du was du suchst auf einer anderen Seite?
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/" className="btn btn-primary btn-lg">
              <Home size={20} />
              Zur Startseite
            </Link>
            
            <button 
              onClick={() => router.back()} 
              className="btn btn-outline btn-lg"
            >
              <ArrowLeft size={20} />
              Zurück
            </button>
          </div>

          {/* Quick links */}
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-semibold text-base-content">
              Beliebte Seiten
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/buy" className="btn btn-sm btn-ghost">
                🛒 Einkaufen
              </Link>
              <Link href="/me" className="btn btn-sm btn-ghost">
                👤 Mein Profil
              </Link>
              <Link href="/all-users" className="btn btn-sm btn-ghost">
                👥 Alle Nutzer
              </Link>
              <Link href="/account" className="btn btn-sm btn-ghost">
                💰 Konto
              </Link>
              <Link href="/top-up" className="btn btn-sm btn-ghost">
                💳 Guthaben aufladen
              </Link>
            </div>
          </div>

          {/* Fun error code */}
          <div className="mt-12 text-sm text-base-content/40">
            Error 404: Seite im Kühlschrank nicht gefunden 🍕
          </div>
        </div>
      </div>
    </CenteredPage>
  )
}

export default Custom404
