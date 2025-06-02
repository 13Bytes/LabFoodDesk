import { Transaction } from "@prisma/client"
import { type NextPage } from "next"
import React, { ComponentProps, useEffect, useRef } from "react"
import { Info, ClipboardList, ArrowRight, TrendingUp, Users, DollarSign, AlertCircle, Plus, Check, ChevronLeft, ChevronRight, Undo } from "lucide-react"
import ActionResponsePopup, {
  AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import { Balance } from "~/components/General/Balance"
import CenteredPage from "~/components/Layout/CenteredPage"
import { Tid } from "~/helper/zodTypes"
import { RouterOutputs, api } from "~/utils/api"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { getUsernameLetters } from "~/helper/generalFunctions"

const AccountPage: NextPage = () => {
  const [page, setPage] = React.useState(0)
  const [maxPage, setMaxPage] = React.useState(Infinity)
  const trpcUtils = api.useUtils()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()
  const allBalancesRequest = api.user.getAllBalances.useQuery()

  // Quick stats for the overview
  const totalPositiveBalance = allBalancesRequest.data?.reduce((sum, user) => 
    sum + Math.max(0, user.balance), 0) || 0
  const totalNegativeBalance = allBalancesRequest.data?.reduce((sum, user) => 
    sum + Math.min(0, user.balance), 0) || 0
  const userCount = allBalancesRequest.data?.length || 0

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
      .catch((e) => {
        animate(animationRef, "failure", e.message)
      })
    await trpcUtils.transaction.invalidate()
    await trpcUtils.user.invalidate()
  }

  const isTransactionRevertable = (transaction: Transaction) => {
    if (transaction.type !== 0) {
      return false
    }
    return transaction.createdAt >= new Date(Date.now() - 1000 * 60 * 15)
  }
  return (
    <>
      <CenteredPage>
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
          {/* Header Section */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="avatar placeholder">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-content">
                  <span className="text-2xl font-bold">
                    {getUsernameLetters(userData?.name)}
                  </span>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-base-content">
                  Konto von <span className="text-primary">{userData?.name}</span>
                </h1>
                <p className="text-lg text-base-content/70">
                  Deine Kontoinformationen und Transaktionshistorie
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-primary">
                <Users className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Aktive Nutzer</div>
              <div className="stat-value text-primary">{userCount}</div>
              <div className="stat-desc">im System registriert</div>
            </div>            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-success">
                <Plus className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Positives Guthaben</div>
              <div className="stat-value text-success">{totalPositiveBalance.toFixed(2)}€</div>
              <div className="stat-desc">verfügbares Geld</div>
            </div>            <div className="stat rounded-box bg-base-200 shadow-sm">
              <div className="stat-figure text-warning">
                <Check className="inline-block h-8 w-8 stroke-current" />
              </div>
              <div className="stat-title">Offene Schulden</div>
              <div className="stat-value text-warning">
                {Math.abs(totalNegativeBalance).toFixed(2)}€
              </div>
              <div className="stat-desc">noch auszugleichen</div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body p-6">              <div className="mb-6 flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-base-content">Transaktionshistorie</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Betrag</th>
                      <th>Beschreibung</th>
                      <th>Art & Datum</th>
                      <th>Person</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionData?.pages[page]?.items.map((transaction) => {
                      const transactionDisplay = transactionDisplayDetails(transaction)
                      const isRevertable = isTransactionRevertable(transaction)

                      return (
                        <tr key={transaction.id} className="transition-colors hover:bg-base-200/50">
                          <td>
                            <div className="flex flex-col">
                              <span className={`text-lg font-bold ${transactionDisplay.color}`}>
                                {Math.abs(transaction.totalAmount).toFixed(2)}€
                              </span>
                              {transaction.amountWithoutFees != undefined && (
                                <span className="text-xs text-base-content/60">
                                  inkl.{" "}
                                  {(
                                    transaction.totalAmount - transaction.amountWithoutFees
                                  ).toFixed(2)}
                                  € Gebühren
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="font-medium">
                              {[...transaction.items, ...transaction.procurementItems]
                                .map((item) => item.item.name)
                                .join(", ") ||
                                transaction.note ||
                                "Überweisung"}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span
                                className={`badge ${
                                  transaction.type === 0
                                    ? "badge-error"
                                    : transaction.type === 1
                                      ? "badge-success"
                                      : transaction.type === 2
                                        ? "badge-info"
                                        : "badge-warning"
                                } mb-1 text-xs`}
                              >
                                {transactionDisplay.text}
                              </span>
                              <span className="text-sm text-base-content/70">
                                {transaction.createdAt.toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              {transactionDisplay.directionText && (
                                <span className="text-base-content/60">
                                  {transactionDisplay.directionText}{" "}
                                </span>
                              )}
                              <span className="font-medium">
                                {transaction.type == 2 &&
                                  userIsTransactionDestination(transaction) &&
                                  transaction.user.name}
                                {transaction.type == 2 &&
                                  !userIsTransactionDestination(transaction) &&
                                  transaction.moneyDestination?.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            {isRevertable && (                              <button
                                className="btn btn-ghost btn-xs transition-colors hover:btn-error"
                                onClick={() => rescind(transaction.id)}
                                title="Transaktion stornieren (nur innerhalb von 15 Minuten möglich)"
                              >
                                <Undo className="h-4 w-4" />
                                Stornieren
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <div className="join">                  <button
                    className={`btn join-item ${page < 1 ? "btn-disabled" : "btn-outline"}`}
                    onClick={() => setPage((prev) => prev - 1)}
                    disabled={page < 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </button>
                  <button className="btn join-item btn-active pointer-events-none">
                    Seite {page + 1}
                  </button>
                  <button
                    className={`btn join-item ${page >= maxPage ? "btn-disabled" : "btn-outline"}`}
                    onClick={() => {
                      void fetchNextPage()
                      setPage((prev) => prev + 1)
                      return
                    }}
                    disabled={page >= maxPage}                  >
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Preview */}
          {allBalancesRequest.data && allBalancesRequest.data.length > 0 && (
            <div className="bg-base-200 rounded-2xl p-6">              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-info" />
                Kontostand-Übersicht
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {allBalancesRequest.data.slice(0, 12).map((user) => (
                  <div key={user.id} className="bg-base-100 p-3 rounded-lg border border-base-300 hover:border-primary/50 transition-colors">
                    <div className="text-sm font-medium truncate" title={user.name || undefined}>
                      {user.name}
                    </div>
                    <div className={`font-bold text-sm ${user.balance >= 0 ? "text-success" : "text-error"}`}>
                      {user.balance.toFixed(2)}€
                    </div>
                  </div>
                ))}
              </div>
              {allBalancesRequest.data.length > 12 && (
                <div className="mt-4 text-center">
                  <Link href="/all-users" className="btn btn-ghost btn-sm">
                    Alle {allBalancesRequest.data.length} Nutzer anzeigen →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </CenteredPage>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default AccountPage
