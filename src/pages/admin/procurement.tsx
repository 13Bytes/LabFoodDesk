import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { z } from "zod"
import ActionResponsePopup, {
  type AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import { LongRightArrowIcon } from "~/components/Icons/LongRightArrowIcon"
import { type Tid, id } from "~/helper/zodTypes"
import { api } from "~/utils/api"

export const sendMoneyProcurementSchema = z.object({
  destinationUserId: id,
  amount: z.number(),
  note: z.string().optional(),
})

const ProcurementPage = () => {
  const animationRef = useRef<AnimationHandle>(null)

  const allUserRequest = api.user.getAllUsers.useQuery()
  const allClearingAccountsRequest = api.clearingAccount.getAll.useQuery()

  const trpcUtils = api.useContext()

  const session = useSession()
  const [amountSend, setAmountSend] = useState<number>(1)
  const [selectedDestinationUser, setSelectedDestinationUser] = useState<Tid>()
  const [selectedOriginClearingAccount, setSelectedOriginClearingAccount] = useState<Tid>()
  const [noteSend, setNoteSend] = useState<string>()

  const apiSendMoneyForProcurement = api.transaction.sendMoneyProcurement.useMutation()
  const resetEntries = () => {
    setAmountSend(1)
    setSelectedDestinationUser("")
    setSelectedOriginClearingAccount("")
    setNoteSend("")
  }

  const correctEntries = !!selectedDestinationUser

  const procuremenntAction = () => {
    if (!correctEntries) {
      animate(animationRef, "failure")
      return
    }
    apiSendMoneyForProcurement
      .mutateAsync({
        amount: amountSend,
        destinationUserId: selectedDestinationUser,
        note: noteSend,
      })
      .then(() => {
        animate(animationRef, "success")
        resetEntries()
      })
      .catch(() => {
        animate(animationRef, "failure")
      })
  }

  return (
    <>
      <div className="card card-body m-2 flex flex-col bg-base-300 shadow-sm">
        <h1 className="mb-2 text-lg font-bold">Einkauf vergüten</h1>
        <div className="flex flex-row items-center">
          <div>
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

          <input
            type="text"
            className="input-bordered input  ml-4 w-full max-w-xl"
            value={noteSend}
            placeholder="Was wurde gekauft?"
            onChange={(e) => setNoteSend(e.target.value)}
          />
        </div>
        <div className="flex flex-row items-center">
          <span>an</span>
          <div className="mx-3">
            <LongRightArrowIcon />
          </div>

          <div>
            <select
              className="select-bordered select w-full max-w-xs font-bold "
              id="sel-dest-user"
              value={selectedDestinationUser}
              onChange={(e) => {
                setSelectedDestinationUser(e.target.value)
              }}
            >
              <option key="dis" value="" className="disabled">
                User wählen:
              </option>
              {allUserRequest.data?.map((user) => (
                <option value={user.id} key={user.id} className="">
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-3">
            <button
              className={`btn ${!correctEntries ? "btn-disabled" : ""}`}
              onClick={() => procuremenntAction()}
            >
              Geld gutschreiben
            </button>
          </div>
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default ProcurementPage
