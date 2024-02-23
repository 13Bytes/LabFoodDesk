import { signIn, signOut, useSession } from "next-auth/react"

export const AuthButton = () => {
    const { data: sessionData } = useSession()
  
    return (
      <div className="mt-3 flex flex-col items-center justify-center gap-4">
        <button
          className="btn-info btn"
          onClick={sessionData ? () => void signOut() : () => void signIn()}
        >
          {sessionData ? "Abmelden" : "Anmelden"}
        </button>
      </div>
    )
  }