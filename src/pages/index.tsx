import { type GetServerSidePropsContext, type InferGetServerSidePropsType, type NextPage } from "next"
import { getProviders, getSession, signIn } from "next-auth/react"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { Github, Info, XCircle, CheckCircle } from "lucide-react"
import CenteredPage from "~/components/Layout/CenteredPage"

// NextAuth error messages (https://next-auth.js.org/configuration/pages)
// get thrown as query parameters in the URL
const nextAuthErrorMessages: Record<string, string> = {
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
  default: "Ein unbekannter Fehler ist aufgetreten.",
}

type FormData = {
  username: string
  password: string
  email: string
}

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps> & {
  isProduction: boolean
}

const Home: NextPage<HomeProps> = ({ providers, isProduction }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"credentials" | "email">("credentials")
  const router = useRouter()  // Handle NextAuth errors from query parameters
  useEffect(() => {
    const { error: authError } = router.query
    if (authError && typeof authError === 'string') {
      const errorMessage = nextAuthErrorMessages[authError] || nextAuthErrorMessages.default
      if (errorMessage) {
        setError(errorMessage)
      }
      
      // Clear the error from URL to prevent it from persisting
      const { error: _, ...restQuery } = router.query
      void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
    }
  }, [router])

  const isDevelopment = !isProduction
  const onCredentialsSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null)
    setSuccess(null)
    
    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Login error:", result.error)
        if (result.error === "CredentialsSignin") {
          setError("Ungültige Anmeldedaten. Bitte überprüfe deinen Benutzernamen und dein Passwort.")
        } else {
          setError("Anmeldung fehlgeschlagen. Bitte versuche es erneut.")
        }
      } else if (result?.ok) {
        const callbackUrl = (router.query.callbackUrl as string) || "/buy"
        await router.push(callbackUrl)
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.")
      }
    } catch (err) {
      console.error("Login exception:", err)
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.")
    }
  }

  const onEmailSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null)
    setSuccess(null)
    try {
      const result = await signIn("email", {
        email: data.email,
        redirect: false,
      })

      if (result?.error) {
        setError("Fehler beim Senden der E-Mail. Bitte versuche es erneut.")
      } else if (result?.ok) {
        setSuccess("Ein Magic Link wurde in der Serverkonsole generiert.")
      }
    } catch (err) {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.")
    }
  }

  return (
    <CenteredPage>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              <span className="text-primary">Lab</span> Eats
            </h1>
            <p className="mt-6 text-lg text-white">
              Willkommen! Bitte melde dich an.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              {/* Tab Navigation (only show if both methods are available) */}
              {isDevelopment && (
                <div className="tabs tabs-boxed mb-6">
                  <button
                    className={`tab tab-lg flex-1 ${activeTab === "credentials" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("credentials")}
                  >
                    ASL Account
                  </button>
                  <button
                    className={`tab tab-lg flex-1 ${activeTab === "email" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("email")}
                  >
                    Server Konsole
                  </button>
                </div>
              )}

              {/* Error/Success Messages */}              {error && (
                <div className="alert alert-error mb-4">
                  <XCircle className="stroke-current shrink-0 h-6 w-6" />
                  <span>{error}</span>
                </div>
              )}              {success && (
                <div className="alert alert-success mb-4">
                  <CheckCircle className="stroke-current shrink-0 h-6 w-6" />
                  <span>{success}</span>
                </div>
              )}

              {/* LDAP/Credentials Login Form */}
              {(activeTab === "credentials" || isProduction) && (
                <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">ASL-Benutzername</span>
                    </label>
                    <input
                      type="text"
                      placeholder="max.mustermann"
                      className={`input input-bordered w-full ${errors.username ? "input-error" : ""}`}
                      {...register("username", { 
                        required: "Benutzername ist erforderlich",
                        minLength: { value: 2, message: "Benutzername muss mindestens 2 Zeichen lang sein" }
                      })}
                    />
                    {errors.username && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.username.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Passwort</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
                      {...register("password", { 
                        required: "Passwort ist erforderlich",
                        minLength: { value: 1, message: "Passwort darf nicht leer sein" }
                      })}
                    />
                    {errors.password && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.password.message}</span>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${isSubmitting ? "loading" : ""}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Anmeldung läuft..." : "Mit ASL-Account anmelden"}
                  </button>
                </form>
              )}

              {/* Magic Link Login Form (Development only) */}
              {isDevelopment && activeTab === "email" && (
                <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">                  <div className="alert alert-info">
                    <Info className="h-6 w-6" />
                    <div>
                      <p className="text-sm">
                        <strong>Entwicklungsmodus:</strong> Du kannst dich mit einem Magic Link anmelden.
                      </p>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">E-Mail-Adresse</span>
                    </label>
                    <input
                      type="email"
                      placeholder="max.mustermann@example.com"
                      className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                      {...register("email", { 
                        required: "E-Mail-Adresse ist erforderlich",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Ungültige E-Mail-Adresse"
                        }
                      })}
                    />
                    {errors.email && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.email.message}</span>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-secondary w-full ${isSubmitting ? "loading" : ""}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Magic Link wird gesendet..." : "Magic Link senden"}
                  </button>
                </form>
              )}

              {/* Info Section */}
              <div className="divider"></div>
              <div className="text-center">
                <p className="text-sm text-base-content opacity-70">
                  {isProduction 
                    ? "Melde dich mit deinem ASL-Account an, um auf LabEats zuzugreifen."
                    : "Im Entwicklungsmodus stehen sowohl ASL-Account als auch Magic Link zur Verfügung."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Link */}
          <div className="text-center">
            <a
              className="btn btn-ghost btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/13bytes/labfooddesk"
            >
              <Github className="h-6 w-6" />
              <span className="ml-2">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </CenteredPage>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context)

  // If user is already logged in, redirect to the app
  if (session) {
    const callbackUrl = (context.query.callbackUrl as string) || "/buy"
    return {
      redirect: {
        destination: callbackUrl,
        permanent: false,
      },
    }
  }

  const providers = await getProviders()

  return {
    props: {
      providers: providers ?? {},
      isProduction: process.env.NODE_ENV === "production",
    },
  }
}

export default Home
