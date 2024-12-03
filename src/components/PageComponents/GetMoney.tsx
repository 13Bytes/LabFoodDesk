import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import ActionResponsePopup, {
  animate,
  type AnimationHandle,
} from "~/components/General/ActionResponsePopup"
import { api } from "~/utils/api"

type Props = {
  comment?: string
  sendDescription?: string
}

const GetMoney = (props: Props) => {
  const allUserRequest = api.user.getAllUsers.useQuery()
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useUtils()

  const session = useSession()
  const [amountSend, setAmountSend] = useState<number>(1)
  const [noteSend, setNoteSend] = useState(props.comment || "")
  const [selectedUser, setSelectedUser] = useState<string>()
  const [errorMessage, setErrorMessage] = useState("")

  const apiRetractMoney = api.transaction.retractMoney.useMutation()

  const getMoneyAction = async () => {
    if (selectedUser) {
      setErrorMessage("")
      await apiRetractMoney.mutateAsync(
        {
          amount: amountSend,
          moneySourceUserId: selectedUser,
          note: noteSend,
        },
        {
          onError: (error) => {
            console.error(error)
            animate(animationRef, "failure", error.message)
          },
          onSuccess: async () => {
            animate(animationRef, "success")
            setSelectedUser(undefined)
            setAmountSend(1)
            setNoteSend("")
            await trpcUtils.user.invalidate()
          },
        }
      )
    } else {
      setErrorMessage("Bitte wähle einen User aus")
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
            von 
          </div>

          <div>
            <select
              className="select-bordered select w-full max-w-xs font-bold "
              id="sel-dest-user"
              value={
                !!(selectedUser && allUserRequest.data)
                  ? selectedUser
                  : "Auswählen:"
              }
              onChange={(e) => {
                setSelectedUser(e.target.value)
              }}
            >
              <option key="dis" className="disabled">
                Auswählen:
              </option>
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id)
                  return (
                    <option value={user.id} key={user.id} className="">
                      {user.name}
                    </option>
                  )
              })}
            </select>
          </div>

          <div className="mx-1">
            an <span className="font-bold">dich</span>
          </div>


          <div>
            <button
              className={`btn ml-5 ${!selectedUser ? "btn-disabled" : ""}`}
              onClick={() => getMoneyAction()}
            >
              {props.sendDescription ?? "Einziehen"}
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

export default GetMoney
