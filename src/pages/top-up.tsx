import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { InfoIcon } from "~/components/Icons/InfoIcon"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/PageComponents/SendMoney"
import { api } from "~/utils/api"

const TopUp: NextPage = () => {
  const userWithAllowOverdrawRequest = api.user.getAllUsersWithAllowOverdraw.useQuery()
  const allowedOverdraftUserIds = userWithAllowOverdrawRequest.data?.map((user) => user.id)
  const sessionUser = useSession().data?.user
  return (
    <>
      <CenteredPage>
        {allowedOverdraftUserIds?.includes(sessionUser?.id || "x") ? (
          <>
            <div className="my-2">
              <h3 className="text-2xl">Überweisung</h3>
              <p className="text-sm font-light">
                Wenn du von einem Nutzenden Bargeld bekommst, kannst du hier den entsprechenden
                Betrag an ihn übertragen.
              </p>
            </div>
            <SendMoney comment="Einzahlung" sendDescription="Übertragen" />
          </>
        ) : (
          <>
            <h3 className="self-start text-xl">Geld einzahlen</h3>
            <div>
              <div className="alert alert-info">
                <InfoIcon />
                <div>
                  <div className="text-xs">LabEats basiert auf Prepaid-Guthaben.</div>
                  <h3 className="">
                    Du kannst einem der folgenden tollen Menschen Geld geben (und diese schreiben es
                    dann deinem Konto gut):
                  </h3>
                  <ul className="mt-1 list-none">
                    {userWithAllowOverdrawRequest.data?.map((user, index) => (
                      <li key={index}>
                        - <span className="font-bold">{user.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CenteredPage>
    </>
  )
}

export default TopUp
