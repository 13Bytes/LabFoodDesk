import { type GetServerSidePropsContext, type InferGetServerSidePropsType, type NextPage } from "next"
import { getProviders, getSession, signIn } from "next-auth/react"
import { useRouter } from "next/router"
import { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { GitHubIcon } from "~/components/Icons/GitHubIcon"
import { InfoIcon } from "~/components/Icons/InfoIcon"
import CenteredPage from "~/components/Layout/CenteredPage"

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
  const router = useRouter()
  
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

              {/* Error/Success Messages */}
              {error && (
                <div className="alert alert-error mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="alert alert-info">
                    <InfoIcon />
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
              <GitHubIcon />
              <span className="ml-2">GitHub</span>
            </a>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-white opacity-60">
              © 2025 LabEats
            </p>
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
