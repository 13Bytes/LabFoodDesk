import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle, animate } from "~/components/General/ActionResponsePopup"
import CenteredPage from "~/components/Layout/CenteredPage"
import SendMoney from "~/components/PageComponents/SendMoney"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allUserRequest = api.user.getAllUsers.useQuery()
  const allBalancesRequest = api.user.getAllBalances.useQuery()
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useContext()

  const session = useSession()
  const [amountRec, setAmountRec] = useState<number>(1)
  const [amountSend, setAmountSend] = useState<number>(1)
  const [noteRec, setNoteRec] = useState("")
  const [noteSend, setNoteSend] = useState("")
  const [selectedDestinationUser, setSelectedDestinationUser] = useState<string>()
  const [errorMessage, setErrorMessage] = useState("")
  const checkboxRef = useRef<AnimationHandle>(null)

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const apiSendMoney = api.transaction.sendMoney.useMutation()

  const sendMoneyAction = async () => {
    if (selectedDestinationUser) {
      setErrorMessage("")
      await apiSendMoney.mutateAsync(
        {
          amount: amountSend,
          destinationUserId: selectedDestinationUser,
          note: noteSend,
        },
        {
          onError: (error) => {
            console.error(error)
            animate(animationRef, "failure")
          },
          onSuccess: () => {
            animate(animationRef, "success")
            setSelectedDestinationUser(undefined)
            setAmountSend(1)
            setNoteSend("")
            trpcUtils.user.getAllBalances.invalidate()
          },
        }
      )
    } else {
      setErrorMessage("Bitte wähle einen Empfänger aus")
    }
  }

  useEffect(() => {
    console.log(selectedDestinationUser)
  }, [selectedDestinationUser])

  return (
    <>
      <CenteredPage>
        <h3 className="mt-12 self-start text-xl">Geld senden</h3>
        <SendMoney />

        <h3 className="mt-12 self-start text-xl">Übersicht</h3>
        <div className="flex flex-row flex-wrap items-center gap-1">
          <div className="flex flex-row items-center overflow-x-auto">
            <table className="table">
              <tbody>
                {allBalancesRequest.data?.map((user) => (
                  <tr key={user.id}>
                    <th>{user.name}</th>
                    <td className={`${user.balance >= 0 ? "text-green-600" : "text-red-700"}`}>
                      {user.balance.toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CenteredPage>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default SplitPage
