import { useRouter } from "next/router"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"

// Errors from NextAuth.js: will be passed as query parameters
// https://next-auth.js.org/configuration/pages
const errorMessages: { [key: string]: string } = {
  Signin: "Versuche dich mit einem anderen Account anzumelden.",
  OAuthSignin: "Versuche dich mit einem anderen Account anzumelden.",
  OAuthCallback: "Versuche dich mit einem anderen Account anzumelden.",
  OAuthCreateAccount: "Versuche dich mit einem anderen Account anzumelden.",
  EmailCreateAccount: "Versuche dich mit einem anderen Account anzumelden.",
  Callback: "Versuche dich mit einem anderen Account anzumelden.",
  OAuthAccountNotLinked: "Um die Sicherheit deines Accounts zu bestätigen, melde dich mit demselben Account an, den du ursprünglich verwendet hast.",
  EmailSignin: "Die E-Mail konnte nicht gesendet werden.",
  CredentialsSignin: "Anmeldung fehlgeschlagen. Überprüfe die angegebenen Daten.",
  SessionRequired: "Bitte melde dich an, um auf diese Seite zuzugreifen.",
  Default: "Ein unbekannter Fehler ist aufgetreten.",
}

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const errorMessage = errorMessages[error as string] || errorMessages.default

  return (
    <CenteredPage>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              <span className="text-primary">Lab</span> Eats
            </h1>
          </div>

          {/* Error Card */}
          <div className="card bg-base-200 shadow-xl">            <div className="card-body text-center">
              <div className="mx-auto w-12 h-12 bg-error rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-error-content" />
              </div>
              
              <h2 className="card-title justify-center text-xl mb-2">
                Anmeldung fehlgeschlagen
              </h2>
              
              <p className="text-base-content opacity-70 mb-6">
                {errorMessage}
              </p>              {error && (
                <div className="alert alert-warning mb-4">
                  <AlertTriangle className="stroke-current shrink-0 h-6 w-6" />
                  <div>
                    <div className="font-bold">Fehlerdetails:</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              )}

              <div className="card-actions justify-center">
                <Link href="/" className="btn btn-primary">
                  Erneut versuchen
                </Link>
                <Link href="/" className="btn btn-ghost">
                  Zur Startseite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CenteredPage>
  )
}
