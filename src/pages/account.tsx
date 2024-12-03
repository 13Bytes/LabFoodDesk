import { Transaction } from "@prisma/client"
import { type NextPage } from "next"
import React, { ComponentProps, useEffect, useRef } from "react"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import { Balance } from "~/components/General/Balance"
import CenteredPage from "~/components/Layout/CenteredPage"
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

  function transactionDisplayDetails(transaction: Transaction) {
    const subtraction: ComponentProps<"span">["className"] = "text-red-700"
    const addition: ComponentProps<"span">["className"] = "text-green-600"
    const transactionDetails: {
      color: ComponentProps<"span">["className"]
      text: string
      directionText: string
    } = {
      color: undefined,
      text: "",
      directionText: "",
    }

    if (transaction.type == 0) {
      transactionDetails.color = subtraction
      transactionDetails.text = "gekauft"
    } else if (transaction.type == 1) {
      transactionDetails.color = addition
      transactionDetails.text = "verkauft"
    } else if (transaction.type == 2) {
      const isDestinationUser = userIsTransactionDestination(transaction)

      let userIsBenefiting = isDestinationUser
      if (transaction.totalAmount >= 0) {
        transactionDetails.text = "überwiesen"
        transactionDetails.directionText = "an"
      } else {
        userIsBenefiting = !userIsBenefiting
        transactionDetails.text = "eingezogen"
        transactionDetails.directionText = "von"
      }
      if (userIsBenefiting) {
        transactionDetails.color = addition
        if (transaction.totalAmount >= 0) {
          transactionDetails.directionText = "von"
        }
      } else {
        transactionDetails.color = subtraction
      }
    } else if (transaction.type == 3) {
      if (transaction.totalAmount >= 0) {
        transactionDetails.text = "gutgeschrieben"
        transactionDetails.color = addition
      } else {
        transactionDetails.text = "abgezogen"
        transactionDetails.color = subtraction
      }
    }

    return transactionDetails
  }

  async function rescind(transactionId: Tid) {
    await undoTransactionRequest
      .mutateAsync({ transactionId })
      .then(() => {
        animate(animationRef, "success")
      })
      .catch(() => {
        animate(animationRef, "failure", "Nicht stornierbar")
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
                  {transactionData?.pages[page]?.items.map((transaction) => {
                    const transactionDisplay = transactionDisplayDetails(transaction)
                    return (
                      <tr key={transaction.id}>
                        <td key={`${transaction.id}-td1`}>
                          <span className="font-bold">
                            {Math.abs(transaction.totalAmount).toFixed(2)}€
                          </span>
                          {transaction.amountWithoutFees != undefined && (
                            <span className="pl-2 text-sm font-extralight">
                              ink.{" "}
                              {(transaction.totalAmount - transaction.amountWithoutFees).toFixed(2)}
                              €
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
                          <span className={`${transactionDisplay.color}`}>
                            {" "}
                            {transactionDisplay.text}
                          </span>{" "}
                          am {transaction.createdAt.toISOString().split("T")[0]}
                        </td>
                        <td>
                          {transactionDisplay.directionText}{" "}
                          <span className="font-semibold">
                            {transaction.type == 2 &&
                              userIsTransactionDestination(transaction) &&
                              transaction.user.name}
                            {transaction.type == 2 &&
                              !userIsTransactionDestination(transaction) &&
                              transaction.moneyDestination?.name}
                          </span>
                        </td>
                        <td>
                          {transaction.createdAt >= new Date(Date.now() - 1000 * 60 * 15) && (
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => rescind(transaction.id)}
                            >
                              stornieren
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
