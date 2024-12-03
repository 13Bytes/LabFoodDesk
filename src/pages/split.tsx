import { type NextPage } from "next"
import Link from "next/link"
import { ArrowDownSquareStack } from "~/components/Icons/ArrowDownSquareStack"
import { ArrowUpSquareStack } from "~/components/Icons/ArrowUpSquareStack"
import CenteredPage from "~/components/Layout/CenteredPage"
import GetMoney from "~/components/PageComponents/GetMoney"
import SendMoney from "~/components/PageComponents/SendMoney"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()

  return (
    <>
      <CenteredPage>
        <div className="mt-10 flex flex-row gap-1 py-2 text-xl">
          <h3>Geld senden</h3> <ArrowUpSquareStack />
        </div>
        <SendMoney />

        <div className="mt-10 flex flex-row gap-1 py-2 text-xl">
          <h3>Geld einfordern</h3> <ArrowDownSquareStack />
        </div>
        <GetMoney />

        <h3 className="mb-3 mt-12 text-xl">Übersicht</h3>
        <div className="flex flex-row flex-wrap items-center gap-1">
          <Link href="/all-users">
            <button className="btn btn-primary">Kontostände aller User</button>
          </Link>
        </div>
      </CenteredPage>
    </>
  )
}

export default SplitPage
