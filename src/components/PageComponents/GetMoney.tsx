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
      <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
        <div className="card-body p-6">
          {/* Amount Input */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Betrag</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className="input input-bordered input-lg w-full pr-12 text-2xl font-semibold"
                value={amountSend}
                min={0}
                step={0.01}
                placeholder="0.00"
                onChange={(e) => setAmountSend(parseFloat(e.target.value))}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-base-content/60">
                €
              </span>
            </div>
          </div>

          {/* User Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Von Nutzer</span>
            </label>
            <select
              className="select select-bordered select-lg w-full font-medium"
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="" disabled>
                Nutzer auswählen...
              </option>
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id)
                  return (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  )
              })}
            </select>
          </div>

          {/* Note Input */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Anmerkung (optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered resize-none"
              rows={3}
              value={noteSend}
              placeholder="Grund für die Forderung..."
              onChange={(e) => setNoteSend(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            className={`btn btn-lg gap-2 ${
              !selectedUser || amountSend <= 0
                ? "btn-disabled" 
                : "btn-warning hover:btn-warning-focus"
            } transition-all duration-200`}
            onClick={() => getMoneyAction()}
            disabled={!selectedUser || amountSend <= 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5l-9-2 9 18 9-18-9 2zm0 0v8" />
            </svg>
            {props.sendDescription ?? "Geld einfordern"}
          </button>

          {/* Transaction Summary */}
          {selectedUser && amountSend > 0 && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg border">
              <div className="text-sm text-base-content/70 mb-1">Übersicht:</div>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  Von {allUserRequest.data?.find(u => u.id === selectedUser)?.name}
                </span>
                <span className="text-lg font-bold text-warning">
                  {amountSend.toFixed(2)}€
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GetMoney
