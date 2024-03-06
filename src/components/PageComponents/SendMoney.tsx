import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { comment } from "postcss"
import { useEffect, useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle, animate } from "~/components/General/ActionResponsePopup"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

type Props = {
  comment?: string
}

const SendMoney = (props: Props) => {
  const allUserRequest = api.user.getAllUsers.useQuery()
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useContext()

  const session = useSession()
  const [amountSend, setAmountSend] = useState<number>(1)
  const [noteSend, setNoteSend] = useState(props.comment || "")
  const [selectedDestinationUser, setSelectedDestinationUser] = useState<string>()
  const [errorMessage, setErrorMessage] = useState("")

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

  return (
    <>
      <div className="card card-body mt-2 bg-base-300 shadow-sm">
        <div className="flex flex-row flex-wrap items-center gap-1">
          <div className="flex flex-row items-center">
            <div className="form-control flex">
              <input
                type="number"
                className="input-bordered input w-20"
                value={amountSend}
                min={0}
                step={0.01}
                onChange={(e) => setAmountSend(parseFloat(e.target.value))}
              />
            </div>
            <div className="ml-1">€</div>
          </div>

          <div className="mx-1">
            von <span className="font-bold">dir</span> an
          </div>

          <div>
            <select
              className="select-bordered select w-full max-w-xs font-bold "
              id="sel-dest-user"
              value={
                !!(selectedDestinationUser && allUserRequest.data)
                  ? allUserRequest.data.find((user) => user.id === selectedDestinationUser)!.name!
                  : "Auswählen:"
              }
              onChange={(e) => {
                setSelectedDestinationUser(e.target.options[e.target.selectedIndex]?.id)
              }}
            >
              <option key="dis" className="disabled">Auswählen:</option>
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id)
                  return (
                    <option id={user.id} key={user.id} className="">
                      {user.name}
                    </option>
                  )
              })}
            </select>
          </div>

          <div>
            <button
              className={`btn ml-5 ${!selectedDestinationUser ? "btn-disabled" : ""}`}
              onClick={() => sendMoneyAction()}
            >
              Senden
            </button>
          </div>
        </div>
        <p className="text-lg font-bold text-error-content">{errorMessage}</p>
        <div className="flex">
          <input
            type="text"
            className="input-bordered input w-full"
            value={noteSend}
            placeholder="Anmerkung"
            onChange={(e) => setNoteSend(e.target.value)}
          />
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default SendMoney
