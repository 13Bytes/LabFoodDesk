export const weekdays = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
]

export const localStringOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
}

export const ITEM_SECURITY_DEPOSIT = 2 // secure x€ per item for procurement orders
export const GROUP_ORDER_REVERT_TIMEOUT = 1000 * 60 * 60 * 2 // the user who closed a group order can revert it for 2h - in ms
export const BILLING_TOLERANCE = 1e-6 // in € - billed prices aren't rounded, this only absorbs floating-point errors
