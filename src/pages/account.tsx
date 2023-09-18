import { type NextPage } from "next"
import { useEffect, useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import React from "react"

const AccountPage: NextPage = () => {
  const [page, setPage] = React.useState(0)
  const [maxPage, setMaxPage] = React.useState(Infinity)
  const { data: sessionData } = useSession()

  const trpcUtils = api.useContext()
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  const {
    data: transactionData,
    isLoading: transactionIsLoading,
    fetchNextPage,
    hasNextPage,
  } = api.transaction.getMineInfinite.useInfiniteQuery(
    {},
    {
      keepPreviousData: true,
      getNextPageParam: (lastPage) => {
        if (lastPage.nextPageExists) {
          return lastPage.pageNumber + 1
        } else {
          return undefined
        }
      },
    }
  )

  useEffect(() => {
    if (!hasNextPage) {
      setMaxPage(page)
    } else {
      setMaxPage(Infinity)
    }
  }, [setMaxPage, hasNextPage])

  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-start self-start">
          <div>
            <h1 className="text-xl">
              Account von <span className="font-bold ">{userData?.name}</span>
            </h1>
            <p>
              Guthaben: <span className={`font-bold ${(userData?.balance) && (userData?.balance > 0) ? 'text-green-600' : 'text-red-700'}`}>{userData?.balance}€</span>
            </p>
          </div>

          <div className="pt-2">
            <p className="font-semibold">letzte Transaktionen:</p>
            {transactionData?.pages[page]?.items.map((transaction) => (
              <div>
                <p>
                  "{transaction.item.name}" wurde{" "}
                  {transaction.type == 0 ? "gekauft" : "verkauft"} am{" "}
                  {transaction.createdAt.toISOString()}
                </p>
              </div>
            ))}
          </div>
          <button />

          <div className="join">
            <button
              className={`join-item btn ${page < 1 && "btn-disabled"}`}
              onClick={() => setPage((prev) => prev - 1)}
            >
              «
            </button>
            <button className="join-item btn pointer-events-none">
              Seite {page + 1}
            </button>
            <button
              className={`join-item btn ${page >= maxPage && "btn-disabled"}`}
              onClick={() => {
                fetchNextPage()
                setPage((prev) => prev + 1)
              }}
            >
              »
            </button>
          </div>
        </div>
      </CenteredPage>
    </>
  )
}

export default AccountPage
