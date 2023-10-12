import { type NextPage } from "next"
import { useEffect, useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import React from "react"
import { Transaction } from "@prisma/client"

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

  function userIsTransactionDestination(transaction: Transaction): boolean {
    return transaction.moneyDestinationUserId === userData?.id;
  }

  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-start self-start">
          <div>
            <h1 className="text-xl">
              Account von <span className="font-bold ">{userData?.name}</span>
            </h1>
            <p>
              Guthaben:{" "}
              <span
                className={`font-bold ${
                  userData?.balance && userData?.balance > 0 ? "text-green-600" : "text-red-700"
                }`}
              >
                {userData?.balance}€
              </span>
            </p>
          </div>

          <div className="pt-2">
            <p className="font-extrabold">letzte Transaktionen:</p>
            <div className="overflow-x-auto">
              <table className="table">
                <tbody>
                  {transactionData?.pages[page]?.items.map((transaction) => (
                    <tr key={transaction.id}>
                      <td key={`${transaction.id}-td1`}>
                        <span className="font-bold">{transaction.totalAmount}€</span>
                      </td>
                      <td key={`${transaction.id}-td2`}>
                        <span className="pl-8 font-semibold">
                          {transaction.item?.name || transaction.note}
                        </span>{" "}
                        wurde
                        {transaction.type == 0 && <span className="text-red-700"> gekauft</span>}
                        {transaction.type == 1 && <span className="text-green-600"> verkauft</span>}
                        {transaction.type == 2 && userIsTransactionDestination(transaction) && (
                          <span className="text-green-600"> überwiesen</span>
                        )}
                        {transaction.type == 2 && !userIsTransactionDestination(transaction) && (
                          <span className="text-red-700"> überwiesen</span>
                        )}{" "}
                        am {transaction.createdAt.toISOString().split("T")[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button />

          <div className="join mt-2">
            <button
              className={`join-item btn ${page < 1 ? "btn-disabled": ""}`}
              onClick={() => setPage((prev) => prev - 1)}
            >
              «
            </button>
            <button className="join-item btn pointer-events-none">Seite {page + 1}</button>
            <button
              className={`join-item btn ${page >= maxPage ? "btn-disabled": ""}`}
              onClick={() => {
                void fetchNextPage()
                setPage((prev) => prev + 1)
                return 
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
