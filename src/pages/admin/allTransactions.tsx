import { useEffect, useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import TransactionList from "~/components/PageComponents/TransactionList"
import { api } from "~/utils/api"

const AdminTransactionPage = () => {
  const [page, setPage] = useState(0)
  const [maxPage, setMaxPage] = useState(Infinity)

  const {
    data: transactionData,
    fetchNextPage,
    hasNextPage,
  } = api.transaction.getAllInfinite.useInfiniteQuery(
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

  useEffect(() => {
    if (!hasNextPage) {
      setMaxPage(page)
    } else {
      setMaxPage(Infinity)
    }
  }, [setMaxPage, hasNextPage])

  useEffect(() => {
    if (!hasNextPage) {
      setMaxPage(page)
    } else {
      setMaxPage(Infinity)
    }
  }, [setMaxPage, hasNextPage])

  return (
    <CenteredPage>
      <TransactionList transactions={transactionData?.pages[page]?.items} />

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
    </CenteredPage>
  )
}

export default AdminTransactionPage
