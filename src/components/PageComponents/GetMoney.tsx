import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { AlertCircle, ArrowDown, RotateCcw, X } from "lucide-react"
import ActionResponsePopup, {
  animate,
  type AnimationHandle,
} from "~/components/General/ActionResponsePopup"
import { calculateSplit, type SplitMode } from "~/helper/generalFunctions"
import { api } from "~/utils/api"

type Props = {
  comment?: string
  sendDescription?: string
}

// share === undefined: calculated automatically
type Participant = { userId: string; share?: number }

const splitModes: { mode: SplitMode; label: string; unit: string }[] = [
  { mode: "factor", label: "Faktoren", unit: "×" },
  { mode: "percent", label: "Prozent", unit: "%" },
  { mode: "absolute", label: "Beträge", unit: "€" },
]

const GetMoney = (props: Props) => {
  const allUserRequest = api.user.getAllUsers.useQuery()
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useUtils()

  const session = useSession()
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [splitMode, setSplitMode] = useState<SplitMode>("factor")
  const [includeSelf, setIncludeSelf] = useState(true)
  const [selfShare, setSelfShare] = useState<number>()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [noteSend, setNoteSend] = useState(props.comment || "")

  const apiRetractMoney = api.transaction.retractMoney.useMutation()

  // self (if included) is always the last share
  const enteredShares = [...participants.map((p) => p.share), ...(includeSelf ? [selfShare] : [])]
  const { shares, amounts } = calculateSplit(totalAmount, enteredShares, splitMode)
  // with only fixed amounts, the total is their sum - otherwise it stays as entered
  const allAmountsFixed =
    splitMode === "absolute" && enteredShares.length > 0 && enteredShares.every((share) => share !== undefined)
  const effectiveTotal = allAmountsFixed ? amounts.reduce((sum, amount) => sum + amount, 0) : totalAmount
  const participantAmounts = amounts.slice(0, participants.length)
  const requestedAmount = participantAmounts.reduce((sum, amount) => sum + amount, 0)
  const percentSum = shares.reduce((sum, share) => sum + share, 0)
  const unit = splitModes.find((m) => m.mode === splitMode)?.unit

  // called before every change of the shares: while all amounts are fixed, the total is their sum -
  // store it, so the total stays put once an amount becomes automatic again
  const keepTotal = () => {
    if (allAmountsFixed) setTotalAmount(effectiveTotal)
  }

  const getUserName = (userId: string) => allUserRequest.data?.find((u) => u.id === userId)?.name

  const validationError = (() => {
    if (participants.length === 0) return "Bitte wähle mindestens einen Nutzer aus"
    if (!(effectiveTotal > 0)) return "Bitte gib einen Gesamtbetrag an"
    if (splitMode === "percent" && shares.some((share) => share < 0))
      return "Die festen Prozente ergeben mehr als 100%"
    if (splitMode === "percent" && Math.abs(percentSum - 100) > 0.001)
      return `Die Prozente müssen 100% ergeben (aktuell ${+percentSum.toFixed(2)}%) - setze einen Wert auf automatisch zurück`
    if (splitMode === "absolute" && shares.some((share) => share < 0))
      return "Die festen Beträge übersteigen den Gesamtbetrag"
    if (participantAmounts.some((amount) => !(amount > 0)))
      return "Jeder ausgewählte Nutzer braucht einen Anteil größer 0"
    return undefined
  })()

  const changeSplitMode = (mode: SplitMode) => {
    if (mode === splitMode) return
    // keep the split: fixed shares stay fixed (converted to the new mode), automatic ones stay automatic.
    // All effective shares are proportional to the amounts, so their normalized weights are the same in every mode.
    const shareSum = shares.reduce((sum, share) => sum + share, 0)
    const weights = shares.map((share) => share / shareSum)
    const autoIndex = enteredShares.findIndex((share) => share === undefined)
    const factorUnit = autoIndex >= 0 ? weights[autoIndex] ?? 0 : Math.min(...weights.filter((w) => w > 0))
    const canConvert =
      shareSum > 0 &&
      shares.every((share) => share >= 0) &&
      (mode !== "absolute" || effectiveTotal > 0) &&
      (mode !== "factor" || factorUnit > 0)
    const newShares = enteredShares.map((share, i) => {
      if (!canConvert || share === undefined) return undefined
      const weight = weights[i] ?? 0
      return mode === "factor" ? weight / factorUnit : mode === "percent" ? weight * 100 : weight * effectiveTotal
    })
    setParticipants(participants.map((p, i) => ({ ...p, share: newShares[i] })))
    setSelfShare(newShares[participants.length])
    setTotalAmount(effectiveTotal)
    setSplitMode(mode)
  }

  const addParticipant = (userId: string) => {
    if (!userId || participants.some((p) => p.userId === userId)) return
    keepTotal()
    setParticipants([...participants, { userId }])
  }

  const updateShare = (userId: string, share: number | undefined) => {
    keepTotal()
    setParticipants(participants.map((p) => (p.userId === userId ? { ...p, share } : p)))
  }

  const updateSelfShare = (share: number | undefined) => {
    keepTotal()
    setSelfShare(share)
  }

  const removeParticipant = (userId: string) => {
    keepTotal()
    setParticipants(participants.filter((p) => p.userId !== userId))
  }

  const toggleIncludeSelf = (include: boolean) => {
    keepTotal()
    setSelfShare(undefined)
    setIncludeSelf(include)
  }

  const getMoneyAction = async () => {
    if (validationError) return
    await apiRetractMoney.mutateAsync(
      {
        requests: participants.map((p, i) => ({
          moneySourceUserId: p.userId,
          amount: participantAmounts[i] ?? 0,
        })),
        note: noteSend,
      },
      {
        onError: (error) => {
          console.error(error)
          animate(animationRef, "failure", error.message)
        },
        onSuccess: async () => {
          animate(animationRef, "success")
          setParticipants([])
          setTotalAmount(0)
          setSelfShare(undefined)
          setNoteSend("")
          await trpcUtils.user.invalidate()
        },
      }
    )
  }

  // automatic shares show their calculated value (grey) - typing into a field fixes it, ⭮ makes it automatic again
  const shareInput = (value: number | undefined, autoValue: number, onChange: (value: number | undefined) => void) => (
    <>
      <div className="relative w-28 shrink-0">
        <input
          type="number"
          className={`input input-sm w-full pr-6 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${value === undefined ? "text-base-content/50" : ""}`}
          value={value === undefined ? +autoValue.toFixed(2) : Number.isNaN(value) ? "" : value}
          min={0}
          step={splitMode === "factor" ? 0.5 : 0.01}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-base-content/60">
          {unit}
        </span>
      </div>
      {value !== undefined ? (
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => onChange(undefined)}
          title="Automatisch berechnen"
          aria-label="Automatisch berechnen"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-8 shrink-0" />
      )}
    </>
  )

  const shareRow = (key: string, name: string | null | undefined, index: number, onChange: (value: number | undefined) => void, onRemove?: () => void) => (
    // "contents": the cells are laid out by the surrounding grid, so each column fits its widest entry
    <div key={key} className="contents">
      <span className="truncate font-medium">{name}</span>
      {shareInput(enteredShares[index], shares[index] ?? 0, onChange)}
      {/* invisible for absolute amounts, so the input keeps its position */}
      <span className={`text-right text-sm tabular-nums text-base-content/70 ${splitMode === "absolute" ? "invisible" : ""}`}>
        {(amounts[index] ?? 0).toFixed(2)}€
      </span>
      {onRemove ? (
        <button className="btn btn-ghost btn-sm btn-square" onClick={onRemove} aria-label="Entfernen">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-8 shrink-0" />
      )}
    </div>
  )

  return (
    <>
      <div className="card bg-linear-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
        <div className="card-body p-6">
          {/* Amount Input */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Gesamtbetrag</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className="input input-lg w-full pr-12 text-2xl font-semibold"
                value={allAmountsFixed ? +effectiveTotal.toFixed(4) : Number.isNaN(totalAmount) ? "" : totalAmount}
                min={0}
                step={0.01}
                placeholder="0.00"
                disabled={allAmountsFixed}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-base-content/60">
                €
              </span>
            </div>
            {allAmountsFixed && (
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Summe der einzelnen Beträge
                </span>
              </label>
            )}
          </div>

          {/* Split Mode */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Aufteilen nach</span>
            </label>
            <div className="join w-full">
              {splitModes.map((m) => (
                <button
                  key={m.mode}
                  className={`btn join-item flex-1 ${splitMode === m.mode ? "btn-primary" : ""}`}
                  onClick={() => changeSplitMode(m.mode)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Von Nutzern</span>
            </label>
            <select
              className="select select-bordered w-full font-medium"
              value=""
              onChange={(e) => addParticipant(e.target.value)}
            >
              <option value="" disabled>
                Nutzer hinzufügen...
              </option>
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id && !participants.some((p) => p.userId === user.id))
                  return (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  )
              })}
            </select>
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={includeSelf}
                onChange={(e) => toggleIncludeSelf(e.target.checked)}
              />
              <span className="label-text">Ich bin auch beteiligt (mein Anteil wird nicht eingefordert)</span>
            </label>
          </div>

          {/* Shares */}
          {(participants.length > 0 || includeSelf) && (
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
              {participants.map((p, i) =>
                shareRow(
                  p.userId,
                  getUserName(p.userId),
                  i,
                  (value) => updateShare(p.userId, value),
                  () => removeParticipant(p.userId)
                )
              )}
              {includeSelf &&
                shareRow("self", `${session.data?.user.name ?? ""} (ich)`, participants.length, updateSelfShare)}
            </div>
          )}

          {/* Note Input */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Anmerkung (optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-lg w-full"
              rows={3}
              value={noteSend}
              placeholder="Grund für die Forderung..."
              onChange={(e) => setNoteSend(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            className={`btn btn-lg gap-2 ${
              validationError || apiRetractMoney.isPending
                ? "btn-disabled"
                : "btn-warning hover:btn-warning-focus"
            } transition-all duration-200`}
            onClick={() => getMoneyAction()}
            disabled={!!validationError || apiRetractMoney.isPending}
          >
            <ArrowDown className="h-5 w-5" />
            {props.sendDescription ?? "Geld einfordern"}
          </button>
          {validationError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-base-content/60">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          {/* Transaction Summary */}
          {!validationError && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg border">
              <div className="text-sm text-base-content/70 mb-1">Übersicht:</div>
              {participants.map((p, i) => (
                <div key={p.userId} className="flex justify-between items-center">
                  <span className="font-medium">Von {getUserName(p.userId)}</span>
                  <span className="font-semibold text-warning">{(participantAmounts[i] ?? 0).toFixed(2)}€</span>
                </div>
              ))}
              {participants.length > 1 && (
                <div className="mt-2 flex justify-between items-center border-t border-base-300 pt-2">
                  <span className="font-medium">Gesamt ({participants.length} Nutzer)</span>
                  <span className="text-lg font-bold text-warning">{requestedAmount.toFixed(2)}€</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GetMoney
