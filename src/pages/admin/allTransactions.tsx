import { useState } from "react"
import { Pagination } from "~/components/General/Pagination"
import CenteredPage from "~/components/Layout/CenteredPage"
import TransactionList from "~/components/PageComponents/TransactionList"
import { api } from "~/utils/api"

const AdminTransactionPage = () => {
  const [page, setPage] = useState(0)

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

  const maxPage = hasNextPage ? Infinity : page

  return (
    <CenteredPage>
      <TransactionList transactions={transactionData?.pages[page]?.items} />
      <Pagination page={page} maxPage={maxPage} setPage={setPage} fetchNextPage={fetchNextPage} />
    </CenteredPage>
  )
}

export default AdminTransactionPage
