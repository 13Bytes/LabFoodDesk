import { type NextPage } from "next"
import { signIn, signOut, useSession } from "next-auth/react"

import CenteredPage from "~/components/Layout/CenteredPage"

const Home: NextPage = () => {
  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="primary text-primary">Lab</span> Eats
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">Wilkommen bei LabEats!</p>
            <AuthButton />
          </div>
        </div>
      </CenteredPage>
    </>
  )
}

export default Home

const AuthButton = () => {
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
