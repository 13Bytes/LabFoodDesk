import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { InfoIcon } from "~/components/Icons/InfoIcon"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/SendMoney"
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
            <h3 className="self-start text-xl">Geld bekommen von</h3>
            <SendMoney comment="Einzahlung"/>
          </>
        ) : (
          <>
            <h3 className="self-start text-xl">Geld einzahlen</h3>
            <div>
              <div className="alert alert-info">
                <InfoIcon />
                <span>
                  Du kannst einem der folgenden Nutzern Geld geben und diese schreiben es dir dann gut
                </span>
              </div>
            </div>
            <div>
              <ul className="mt-6 list-none">
                {userWithAllowOverdrawRequest.data?.map((user) => (
                  <li>
                    an <span className="font-bold">{user.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CenteredPage>
    </>
  )
}

export default TopUp
