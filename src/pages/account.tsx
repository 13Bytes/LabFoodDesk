import { Transaction } from "@prisma/client"
import { type NextPage } from "next"
import React, { useEffect, useRef } from "react"
import ActionResponsePopup, { AnimationHandle, animate } from "~/components/General/ActionResponsePopup"
import { Balance } from "~/components/General/Balance"
import CenteredPage from "~/components/Layout/CenteredPage"
import { getTransactionFees } from "~/helper/dataProcessing"
import { Tid } from "~/helper/zodTypes"
import { RouterOutputs, api } from "~/utils/api"

const AccountPage: NextPage = () => {
  const [page, setPage] = React.useState(0)
  const [maxPage, setMaxPage] = React.useState(Infinity)
  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)

  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  type TransactionData = RouterOutputs["transaction"]["getMineInfinite"]["items"][0]
  const {
    data: transactionData,
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
    },
  )
const undoTransactionRequest = api.transaction.undoTransaction.useMutation()
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

  async function rescind(transactionId: Tid)  {
    await undoTransactionRequest.mutateAsync({ transactionId})
    .then(()=>{
      animate(animationRef, "success")
    })
    .catch(()=> {
      animate(animationRef, "failure")
    })
    await trpcUtils.transaction.invalidate()
    await trpcUtils.user.invalidate()
  }

  return (
    <>
      <CenteredPage>
        <div className="container flex flex-col items-start self-start">
          <div>
            <h1 className="text-xl">
              Account von <span className="font-bold ">{userData?.name}</span>
            </h1>
            <div className="flex flex-row items-center space-x-2">
              <p>Guthaben: </p>
              <Balance balance={userData?.balance} />
            </div>
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
                        {transaction.amountWithoutFees != undefined && (
                          <span className="pl-2 text-sm font-extralight">
                            ink.{" "}
                            {(transaction.totalAmount - transaction.amountWithoutFees).toFixed(2)}€
                          </span>
                        )}
                      </td>
                      <td key={`${transaction.id}-td2`}>
                        <span className="pl-8 font-semibold">
                          {[...transaction.items, ...transaction.procurementItems]
                            .map((item) => item.item.name)
                            .join(", ") || transaction.note}
                        </span>{" "}
                      </td>
                      <td>
                        {transaction.type == 0 && <span className="text-red-700"> gekauft</span>}
                        {transaction.type == 1 && <span className="text-green-600"> verkauft</span>}
                        {transaction.type == 2 && userIsTransactionDestination(transaction) && (
                          <span className="text-green-600"> überwiesen</span>
                        )}
                        {transaction.type == 2 && !userIsTransactionDestination(transaction) && (
                          <span className="text-red-700"> überwiesen</span>
                        )}{" "}
                        {transaction.type == 3 && (
                          <span className="text-green-600"> gutgeschrieben</span>
                        )}{" "}
                        am {transaction.createdAt.toISOString().split("T")[0]}
                      </td>
                      <td>{transaction.moneyDestination?.name ?? ""}</td>
                      <td>
                        {transaction.createdAt >= new Date(Date.now() - 1000 * 60 * 15)&&
                        <button className="btn btn-ghost btn-xs" onClick={()=>rescind(transaction.id)}>stornieren</button>
                        }
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
              className={`btn join-item ${page < 1 ? "btn-disabled" : ""}`}
              onClick={() => setPage((prev) => prev - 1)}
            >
              «
            </button>
            <button className="btn join-item pointer-events-none">Seite {page + 1}</button>
            <button
              className={`btn join-item ${page >= maxPage ? "btn-disabled" : ""}`}
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
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default AccountPage
