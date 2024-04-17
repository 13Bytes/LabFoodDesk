import { Transaction, Prisma } from "@prisma/client"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import React, { useEffect } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { calculateAdditionalItemPricing, calculateAdditionalPricing } from "~/helper/dataProcessing"
import { RouterOutputs, api } from "~/utils/api"

const AccountPage: NextPage = () => {
  const [page, setPage] = React.useState(0)
  const [maxPage, setMaxPage] = React.useState(Infinity)
  const { data: sessionData } = useSession()

  const trpcUtils = api.useContext()
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  type TransactionData = RouterOutputs["transaction"]["getMineInfinite"]["items"][0]
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
    return transaction.moneyDestinationUserId === userData?.id
  }

  const getTransactionFees = (transaction: TransactionData) => {
    let fees = 0
    for (const item of transaction.items) {
      fees += calculateAdditionalItemPricing(item.item, item.item.categories)
    }
    for (const procItem of transaction.procurementItems) {
      procItem.cost
      fees += calculateAdditionalPricing(procItem.cost, procItem.item.categories)
    }
    return fees
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
                {userData?.balance.toFixed(2)}€
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
                        <span className="font-bold">{transaction.totalAmount.toFixed(2)}€</span>
                        {getTransactionFees(transaction) > 0 && (
                          <span className="text-sm font-extralight pl-2">
                            (ink. {getTransactionFees(transaction).toFixed(2)}€)
                          </span>
                        )}
                      </td>
                      <td key={`${transaction.id}-td2`}>
                        <span className="pl-8 font-semibold">
                          {[...transaction.items, ...transaction.procurementItems]
                            .map((item) => item.item.name)
                            .join(", ") || transaction.note}
                        </span>{" "}
                        wurde(n)
                        {transaction.type == 0 && <span className="text-red-700"> gekauft</span>}
                        {transaction.type == 1 && <span className="text-green-600"> verkauft</span>}
                        {transaction.type == 2 && userIsTransactionDestination(transaction) && (
                          <span className="text-green-600"> überwiesen</span>
                        )}
                        {transaction.type == 2 && !userIsTransactionDestination(transaction) && (
                          <span className="text-red-700"> überwiesen</span>
                        )}{" "}
                        {transaction.type == 3 && <span className="text-green-600"> gutgeschrieben</span>}
                        {" "}
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
              className={`join-item btn ${page < 1 ? "btn-disabled" : ""}`}
              onClick={() => setPage((prev) => prev - 1)}
            >
              «
            </button>
            <button className="join-item btn pointer-events-none">Seite {page + 1}</button>
            <button
              className={`join-item btn ${page >= maxPage ? "btn-disabled" : ""}`}
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
