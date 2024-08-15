import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { AuthButton } from "~/components/General/AuthButton"
import { InfoIcon } from "~/components/Icons/InfoIcon"

import CenteredPage from "~/components/Layout/CenteredPage"

const Home: NextPage = () => {
  const { data: sessionData } = useSession()

  return (
    <CenteredPage>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="primary text-primary">Lab</span> Eats
        </h1>
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">Wilkommen bei LabEats!</p>
          {!sessionData && <AuthButton />}
          {sessionData && (
            <div role="alert" className="alert alert-info mt-10">
              <InfoIcon />
              <div>
                <p className="text">Im Menü könnt ihr...</p>
                <p className="text">
                  ...unter <span className="font-bold">Kaufen</span> einzelne Artikel direkt
                  verrechnen <span className="font-bold">(z.B.: Spezi)</span>
                </p>
                <p className="text">
                  ...unter <span className="font-bold">Gruppen-Kauf</span> Sammel-Bestellungen
                  organisieren <span className="font-bold">(z.B.: Freitagspizza)</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CenteredPage>
  )
}

export default Home
