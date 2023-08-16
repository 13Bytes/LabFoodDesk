import { type NextPage } from "next"
import { api } from "~/utils/api"
import Link from "next/link"
import Head from "next/head"
import CenteredPage from "~/components/Layout/CenteredPage"

const BuyPage: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" })
  const trcpExampleRequestUseAll = api.example.getAll.useQuery()
  const allItemsRequest = api.item.getAll.useQuery()

  return (
    <>
      <CenteredPage>
        <div>all fancy products</div>
      </CenteredPage>
    </>
  )
}

export default BuyPage
