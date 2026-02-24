import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { z } from "zod"
import ActionResponsePopup, {
  type AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import { ArrowRight, Info, Send, Wallet } from "lucide-react"
import RegularPage from "~/components/Layout/RegularPage"
import ClearingAccountOverview from "~/components/PageComponents/ClearingAccountOverview"
import { type Tid, id } from "~/helper/zodTypes"
import { api } from "~/utils/api"

export const sendMoneyFromClearingAccountSchema = z.object({
  sourceClearingAccountId: id,
  destinationUserId: id,
  amount: z.number(),
  note: z.string().optional(),
})

const ClearingAccountPage = () => {
  const animationRef = useRef<AnimationHandle>(null)

  const allUserRequest = api.user.getAllUsers.useQuery()
  const allClearingAccountsRequest = api.clearingAccount.getAll.useQuery()

  const trpcUtils = api.useUtils()

  const session = useSession()
  const [amountSend, setAmountSend] = useState<number>(1)
  const [selectedDestinationUser, setSelectedDestinationUser] = useState<Tid>()
  const [selectedOriginClearingAccount, setSelectedOriginClearingAccount] = useState<Tid>()
  const [noteSend, setNoteSend] = useState<string>()

  const correctEntries = !!selectedDestinationUser && !!selectedOriginClearingAccount

  const apiSendMoneyForProcurement = api.clearingAccount.sendMoneyFromClearingAccount.useMutation()
  const resetEntries = () => {
    setAmountSend(1)
    setSelectedDestinationUser("")
    setSelectedOriginClearingAccount("")
    setNoteSend("")
  }

  const sendMoneyAction = () => {
    if (!correctEntries) {
      animate(animationRef, "failure")
      return
    }
    apiSendMoneyForProcurement
      .mutateAsync({
        amount: amountSend,
        destinationUserId: selectedDestinationUser,
        sourceClearingAccountId: selectedOriginClearingAccount,
        note: noteSend,
      })
      .then(() => {
        animate(animationRef, "success")
        void trpcUtils.clearingAccount.invalidate()
        resetEntries()
      })
      .catch(() => {
        animate(animationRef, "failure")
      })
  }

  return (
    <RegularPage>
      <div className="card flex flex-col bg-base-200 shadow-sm">
        <ClearingAccountOverview />
      </div>

      <div className="card border border-base-300 bg-base-100 shadow-xl mt-6">
        <div className="card-body p-6">
          {/* Header Section */}
          <div className="mb-6 flex items-center gap-3">
            <Send className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-base-content">Verrechnungskonto aufwenden</h2>
          </div>

          {/* Amount Input Section */}
          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">Betrag</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input input-bordered w-32 font-bold"
                value={amountSend}
                step={0.01}
                onChange={(e) => setAmountSend(parseFloat(e.target.value))}
              />
              <span className="text-lg font-semibold">€</span>
            </div>
          </div>

          {/* Note Input Section */}
          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">Verwendungszweck</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={noteSend}
              placeholder="Grund für Überweisung eingeben..."
              onChange={(e) => setNoteSend(e.target.value)}
            />
          </div>

          {/* Transfer Direction Section */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text font-semibold">Überweisung</span>
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] items-center">
              {/* Source Account Selector */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Von Verrechnungskonto</span>
                </label>
                <select
                  className="select select-bordered w-full font-bold"
                  id="sel-source-account"
                  value={selectedOriginClearingAccount || ""}
                  onChange={(e) => {
                    setSelectedOriginClearingAccount(e.target.value)
                  }}
                >
                  <option value="" disabled>
                    Verrechnungskonto wählen...
                  </option>
                  {allClearingAccountsRequest.data?.map((account) => {
                    if (account.id !== session.data?.user.id)
                      return (
                        <option value={account.id} key={account.id}>
                          {account.name}
                        </option>
                      )
                  })}
                </select>
              </div>

              {/* Arrow Icon */}
              <div className="flex justify-center mt-8">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>

              {/* Destination User Selector */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">An Benutzer</span>
                </label>
                <select
                  className="select select-bordered w-full font-bold"
                  id="sel-dest-user"
                  value={
                    !!(selectedDestinationUser && allUserRequest.data)
                      ? selectedDestinationUser
                      : ""
                  }
                  onChange={(e) => {
                    setSelectedDestinationUser(e.target.value)
                  }}
                >
                  <option value="" disabled>
                    Benutzer wählen...
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
            </div>
          </div>

          {/* Info Alert */}
          <div className="alert alert-info shadow-sm mb-4">
            <Info />
            <span className="text-sm">Du kannst dir selbst keine Auszahlung genehmigen</span>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              className={`btn btn-primary gap-2 ${!correctEntries ? "btn-disabled" : ""}`}
              onClick={() => sendMoneyAction()}
            >
              <Send className="h-5 w-5" />
              Überweisung ausführen
            </button>
          </div>
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </RegularPage>
  )
}

export default ClearingAccountPage
