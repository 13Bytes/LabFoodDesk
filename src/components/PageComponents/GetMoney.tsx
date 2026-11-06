import { useSession } from "next-auth/react"
import { type ReactNode, useRef, useState } from "react"
import { AlertCircle, AlertTriangle, ArrowDown, Undo, X } from "lucide-react"
import ActionResponsePopup, {
  animate,
  type AnimationHandle,
} from "~/components/General/ActionResponsePopup"
import DecimalInput from "~/components/General/DecimalInput"
import { calculateSplit, type SplitMode } from "~/helper/generalFunctions"
import { api } from "~/utils/api"

type Props = {
  comment?: string
  sendDescription?: string
  groupMode?: boolean
}

type MoneyRequest = { moneySourceUserId: string; amount: number }

// amount and note are shared by both forms, so they survive switching between them
type FormProps = {
  sendDescription?: string
  amount: number
  setAmount: (amount: number) => void
  note: string
  setNote: (note: string) => void
  submit: (requests: MoneyRequest[], onSuccess: () => void) => Promise<void>
  isPending: boolean
}

const GetMoney = (props: Props) => {
  const animationRef = useRef<AnimationHandle>(null)
  const trpcUtils = api.useUtils()
  const [amount, setAmount] = useState<number>(1)
  const [note, setNote] = useState(props.comment || "")

  const apiRetractMoney = api.transaction.retractMoney.useMutation()

  const submit = async (requests: MoneyRequest[], onSuccess: () => void) => {
    await apiRetractMoney.mutateAsync(
      { requests, note },
      {
        onError: (error) => {
          console.error(error)
          animate(animationRef, "failure", error.message)
        },
        onSuccess: async () => {
          animate(animationRef, "success")
          setAmount(1)
          setNote("")
          onSuccess()
          await trpcUtils.user.invalidate()
        },
      }
    )
  }

  const formProps: FormProps = {
    sendDescription: props.sendDescription,
    amount,
    setAmount,
    note,
    setNote,
    submit,
    isPending: apiRetractMoney.isPending,
  }

  return (
    <>
      <div className="card dither bg-linear-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
        <div className="card-body p-6">
          {props.groupMode ? <GroupRequestForm {...formProps} /> : <SingleRequestForm {...formProps} />}
        </div>
      </div>

      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

const AmountInput = (props: {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  hint?: string
}) => (
  <div className="form-control mb-4">
    <label className="label">
      <span className="label-text font-medium">{props.label}</span>
    </label>
    <div className="relative">
      <DecimalInput
        className="input input-lg w-full pr-12 text-2xl font-semibold"
        value={props.value}
        min={0}
        placeholder="0.00"
        disabled={props.disabled}
        onChange={props.onChange}
      />
      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-base-content/60">
        €
      </span>
    </div>
    {props.hint && (
      <label className="label">
        <span className="label-text-alt text-base-content/60">{props.hint}</span>
      </label>
    )}
  </div>
)

const NoteInput = (props: { value: string; onChange: (value: string) => void }) => (
  <div className="form-control mb-6">
    <label className="label">
      <span className="label-text font-medium">Anmerkung (optional)</span>
    </label>
    <textarea
      className="textarea textarea-bordered textarea-lg w-full"
      rows={3}
      value={props.value}
      placeholder="Grund für die Forderung..."
      onChange={(e) => props.onChange(e.target.value)}
    />
  </div>
)

const SubmitButton = (props: { disabled: boolean; label?: string; onClick: () => void }) => (
  <button
    className={`btn btn-lg gap-2 ${props.disabled ? "btn-disabled" : "btn-warning hover:btn-warning-focus"
      } transition-all duration-200`}
    onClick={props.onClick}
    disabled={props.disabled}
  >
    <ArrowDown className="h-5 w-5" />
    {props.label ?? "Geld einfordern"}
  </button>
)

// request money from one user
const SingleRequestForm = (props: FormProps) => {
  const allUserRequest = api.user.getAllUsers.useQuery()
  const session = useSession()
  const [selectedUser, setSelectedUser] = useState<string>()
  const [errorMessage, setErrorMessage] = useState("")

  const getMoneyAction = async () => {
    if (selectedUser) {
      setErrorMessage("")
      await props.submit([{ moneySourceUserId: selectedUser, amount: props.amount }], () =>
        setSelectedUser(undefined)
      )
    } else {
      setErrorMessage("Bitte wähle einen User aus")
    }
  }

  return (
    <>
      <AmountInput label="Betrag" value={props.amount} onChange={props.setAmount} />

      {/* User Selection */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text font-medium">Von Nutzer</span>
        </label>
        <select
          className="select select-bordered select-lg w-full font-medium"
          value={selectedUser ?? ""}
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

      <NoteInput value={props.note} onChange={props.setNote} />

      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-error mb-4">
          <AlertCircle className="h-6 w-6" />
          <span>{errorMessage}</span>
        </div>
      )}

      <SubmitButton
        disabled={!selectedUser || !(props.amount > 0) || props.isPending}
        label={props.sendDescription}
        onClick={() => void getMoneyAction()}
      />

      {/* Transaction Summary */}
      {selectedUser && props.amount > 0 && (
        <div className="mt-4 p-4 bg-base-200 rounded-lg border">
          <div className="text-sm text-base-content/70 mb-1">Übersicht:</div>
          <div className="flex justify-between items-center">
            <span className="font-medium">
              Von {allUserRequest.data?.find((u) => u.id === selectedUser)?.name}
            </span>
            <span className="text-lg font-bold text-warning">{props.amount.toFixed(2)}€</span>
          </div>
        </div>
      )}
    </>
  )
}

// share === undefined: calculated automatically
type Participant = { userId: string; share?: number }

const splitModes: { mode: SplitMode; label: string; unit: string }[] = [
  { mode: "factor", label: "Faktoren", unit: "×" },
  { mode: "percent", label: "Prozent", unit: "%" },
  { mode: "absolute", label: "Beträge", unit: "€" },
]

// split a total between several users (and optionally yourself)
const GroupRequestForm = (props: FormProps) => {
  const allUserRequest = api.user.getAllUsers.useQuery()
  const session = useSession()
  const [splitMode, setSplitMode] = useState<SplitMode>("factor")
  const [includeSelf, setIncludeSelf] = useState(true)
  const [selfShare, setSelfShare] = useState<number>()
  const [participants, setParticipants] = useState<Participant[]>([])

  const totalAmount = props.amount
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
    if (allAmountsFixed) props.setAmount(effectiveTotal)
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
    // factor 1 = the automatic share - or the smallest positive one, if there is none (or it's negative)
    const autoWeight = autoIndex >= 0 ? weights[autoIndex] ?? 0 : 0
    const factorUnit = autoWeight > 0 ? autoWeight : Math.min(...weights.filter((w) => w > 0))
    // negative automatic shares (fixed shares exceed the whole) are fine: the fixed ones are converted anyway
    const canConvert =
      shareSum > 0 &&
      (mode !== "absolute" || effectiveTotal > 0) &&
      (mode !== "factor" || factorUnit > 0)
    const newShares = enteredShares.map((share, i) => {
      if (!canConvert || share === undefined) return undefined
      const weight = weights[i] ?? 0
      return mode === "factor" ? weight / factorUnit : mode === "percent" ? weight * 100 : weight * effectiveTotal
    })
    setParticipants(participants.map((p, i) => ({ ...p, share: newShares[i] })))
    setSelfShare(newShares[participants.length])
    props.setAmount(effectiveTotal)
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
    await props.submit(
      participants.map((p, i) => ({ moneySourceUserId: p.userId, amount: participantAmounts[i] ?? 0 })),
      () => {
        setParticipants([])
        setSelfShare(undefined)
      }
    )
  }

  // automatic shares show their calculated value as placeholder - typing into a field fixes it, ⭮ or clearing it makes it automatic again
  const shareRow = (
    key: string,
    name: ReactNode,
    index: number,
    onChange: (value: number | undefined) => void,
    onRemove?: () => void
  ) => {
    const value = enteredShares[index]
    return (
      // "contents": the cells are laid out by the surrounding grid, so each column fits its widest entry
      <div key={key} className="contents">
        <span className="truncate font-medium">{name}</span>
        <div className="relative w-24">
          <DecimalInput
            className="input input-sm w-full pr-6 text-right placeholder:text-base-content/50"
            value={value}
            placeholder={(+(shares[index] ?? 0).toFixed(4)).toString()}
            min={0}
            max={splitMode === "percent" ? 100 : undefined}
            // empty field: automatic again
            onChange={(share) => onChange(Number.isNaN(share) ? undefined : share)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-base-content/60">{unit}</span>
        </div>
        <span className="text-right text-sm tabular-nums text-base-content/70">
          {splitMode !== "absolute" && `${(amounts[index] ?? 0).toFixed(2)}€`}
        </span>
        {/* fixed slots, so the buttons stay aligned in every row */}
        <div className="flex">
          {value !== undefined ? (
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => onChange(undefined)}
              title="Automatisch berechnen"
              aria-label="Automatisch berechnen"
            >
              <Undo className="h-3 w-3" />
            </button>
          ) : (shares[index] ?? 0) < 0 ? (
            // automatic share is negative: the fixed shares exceed the whole
            <span
              className="inline-flex h-6 w-6 items-center justify-center text-warning"
              title="Die festen Anteile übersteigen das Ganze"
            >
              <AlertTriangle className="h-3 w-3" />
            </span>
          ) : (
            <span className="w-6" />
          )}
          {onRemove ? (
            <button className="btn btn-ghost btn-xs btn-square" onClick={onRemove} aria-label="Entfernen">
              <X className="h-3 w-3" />
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <AmountInput
        label="Gesamtbetrag"
        value={allAmountsFixed ? +effectiveTotal.toFixed(4) : props.amount}
        onChange={props.setAmount}
        disabled={allAmountsFixed}
        hint={allAmountsFixed ? "Summe der einzelnen Beträge" : undefined}
      />

      {/* User Selection */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text font-medium">Von Nutzern</span>
        </label>
        <select
          className="select select-bordered select-lg w-full font-medium"
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
        <label className="label cursor-pointer justify-start gap-2 mt-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={includeSelf}
            onChange={(e) => toggleIncludeSelf(e.target.checked)}
          />
          <span className="label-text">Ich bin auch beteiligt</span>
        </label>
      </div>

      {/* Shares */}
      {participants.length > 0 && (
        <div className="mb-4 rounded-lg border border-base-300 bg-base-100 p-3">
          <div className="join mb-3 w-full">
            {splitModes.map((m) => (
              <button
                key={m.mode}
                className={`btn btn-sm join-item flex-1 ${splitMode === m.mode ? "btn-primary" : ""}`}
                onClick={() => changeSplitMode(m.mode)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
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
              shareRow(
                "self",
                <>
                  {session.data?.user.name} <span className="italic text-base-content/50">ich</span>
                </>,
                participants.length,
                updateSelfShare
              )}
          </div>
        </div>
      )}

      <NoteInput value={props.note} onChange={props.setNote} />

      <SubmitButton
        disabled={!!validationError || props.isPending}
        label={props.sendDescription}
        onClick={() => void getMoneyAction()}
      />
      {validationError ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-base-content/60">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      ) : (
        <div className="mt-4 p-4 bg-base-200 rounded-lg border flex justify-between items-center">
          <span className="font-medium">Gesamt von {participants.length} Nutzer(n)</span>
          <span className="text-lg font-bold text-warning">{requestedAmount.toFixed(2)}€</span>
        </div>
      )}
    </>
  )
}

export default GetMoney
