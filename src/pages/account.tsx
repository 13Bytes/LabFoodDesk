import { type NextPage } from "next"
import { useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import React from "react"

const AccountPage: NextPage = () => {
    const [page, setPage] = React.useState(0)
    const { data: sessionData } = useSession()
    
  const trpcUtils = api.useContext()
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  const { data: transactionData, isLoading: transactionIsLoading } =
    api.transaction.getInfinite.useInfiniteQuery(
      {
        limit: 10,
      },
      {
        keepPreviousData: true,
        getNextPageParam: (lastPage:number) => lastPage.pageID + 1,
        initialCursor: 1, // (optional)
      }
    )

  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-start self-start">
          <div>
            <h1 className="text-xl">
              Account von <span className="font-bold ">{userData?.name}</span>
            </h1>
            <p>
              Guthaben: <span className="font-bold">{userData?.balance}€</span>
            </p>
          </div>

          <div className="pt-2 font-semibold">
            <p>letzte Transaktionen:</p>
            {transactionData?.map((transaction) => (
              <div>
                {transaction.itemId} wurde{" "}
                {transaction.type == 0 ? "gekauft" : "verkauft"} am{" "}
                {transaction.createdAt.toISOString()}
              </div>
            ))}
          </div>
        </div>
      </CenteredPage>
    </>
  )
}

export default AccountPage
