import { type InputHTMLAttributes, useState } from "react"

/**
 * Parses "1,5" as well as "1.5" - independent of the browser language. Empty or invalid text is NaN.
 * Numbers are passed through (e.g. default values of react-hook-form's `setValueAs`).
 */
export const parseDecimal = (text: string | number) => {
  if (typeof text === "number") return text
  const trimmed = text.trim().replace(",", ".")
  return trimmed === "" || trimmed === "." || trimmed === "-" ? NaN : Number(trimmed)
}

const toText = (value: number | undefined) =>
  // at most 4 decimals, e.g. for calculated values like 5.900000000000001
  value === undefined || Number.isNaN(value) ? "" : String(+value.toFixed(4))

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max"> & {
  value: number | undefined
  /** NaN if the field is empty */
  onChange: (value: number) => void
  min?: number
  max?: number
}

/**
 * Number input that accepts "," and "." as decimal separator.
 * (`type="number"` only accepts the separator of the browser language and clears the field otherwise.)
 * Input that isn't a number or lies outside of min/max is ignored.
 */
const DecimalInput = ({ value, onChange, min, max, ...props }: Props) => {
  const [text, setText] = useState(toText(value))
  const [prevValue, setPrevValue] = useState(value)

  // take over changes from outside (e.g. a reset), but keep the text as typed while it means the same number ("1," = 1)
  if (!Object.is(value, prevValue)) {
    setPrevValue(value)
    if (!Object.is(parseDecimal(text), value ?? NaN)) setText(toText(value))
  }

  const allowNegative = min === undefined || min < 0
  const pattern = allowNegative ? /^-?\d*[.,]?\d*$/ : /^\d*[.,]?\d*$/

  return (
    <input
      type="text"
      inputMode="decimal"
      {...props}
      value={text}
      onChange={(e) => {
        const newText = e.target.value.trim()
        if (!pattern.test(newText)) return
        const newValue = parseDecimal(newText)
        if ((min !== undefined && newValue < min) || (max !== undefined && newValue > max)) return
        setText(newText)
        onChange(newValue)
      }}
    />
  )
}

export default DecimalInput
