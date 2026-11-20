const dayInMs = 24 * 60 * 60 * 1000
export const daysPerWeek = 7
export const daysPerMonth = 365.25 / 12

/**
 * deposits are booked as normal buys (type 0) without items, see buyDeposit
 */
export const isDepositTransaction = (transaction: { note: string | null }) =>
  transaction.note?.startsWith("Pfand: ") ?? false

/**
 * @returns the average amount per period since the first booking (at least one full period)
 */
export const averagePerPeriod = (total: number, since: Date | undefined, now: Date, periodDays: number) => {
  if (!since) {
    return 0
  }
  const spanDays = Math.max(periodDays, (now.getTime() - since.getTime()) / dayInMs)
  return (total / spanDays) * periodDays
}

export const averageWindowWeeks = 12

/**
 * @returns the start for averages: the later of the first booking and the begin of the window
 */
export const averageWindowStart = (firstAt: Date | undefined, now: Date) => {
  if (!firstAt) {
    return undefined
  }
  const windowStart = daysAgo(now, averageWindowWeeks * daysPerWeek)
  return firstAt > windowStart ? firstAt : windowStart
}

/**
 * @returns the average amount per period within the window, see averageWindowStart
 */
export const averageOverWindow = (
  bookings: { totalAmount: number; createdAt: Date }[],
  now: Date,
  periodDays: number,
) => {
  const firstAt = bookings.reduce<Date | undefined>(
    (first, booking) => (!first || booking.createdAt < first ? booking.createdAt : first),
    undefined,
  )
  const since = averageWindowStart(firstAt, now)
  if (!since) {
    return 0
  }
  return averagePerPeriod(sumSince(bookings, since), since, now, periodDays)
}

/**
 * Counts entries by key and returns the most frequent ones, with the average count per week within
 * the window (starting at the later of the key's first booking and the begin of the window).
 * The last name seen for a key is used, so pass entries ordered from old to new to get the
 * current name of versioned items.
 */
export const rankByCountPerWeek = (
  entries: { key: string; name: string; createdAt: Date }[],
  limit: number,
  now: Date,
) => {
  const counts = new Map<string, { name: string; count: number; bookings: { totalAmount: number; createdAt: Date }[] }>()
  for (const entry of entries) {
    const current = counts.get(entry.key) ?? { name: entry.name, count: 0, bookings: [] }
    current.name = entry.name
    current.count += 1
    current.bookings.push({ totalAmount: 1, createdAt: entry.createdAt })
    counts.set(entry.key, current)
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ name, count, bookings }) => ({
      name,
      count,
      averagePerWeek: averageOverWindow(bookings, now, daysPerWeek),
    }))
}

export const sumSince = (bookings: { totalAmount: number; createdAt: Date }[], since: Date) =>
  bookings
    .filter((booking) => booking.createdAt >= since)
    .reduce((acc, booking) => acc + booking.totalAmount, 0)

export const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * dayInMs)
