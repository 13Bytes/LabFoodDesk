import { describe, expect, it } from "vitest"
import {
  averageOverWindow,
  averagePerPeriod,
  daysAgo,
  isDepositTransaction,
  rankByCountPerWeek,
  sumSince,
} from "~/server/helper/statistics"

const now = new Date("2026-10-18T12:00:00Z")

describe("isDepositTransaction", () => {
  it("detects deposit buys by their note", () => {
    expect(isDepositTransaction({ note: "Pfand: Club Mate" })).toBe(true)
    expect(isDepositTransaction({ note: "Danke" })).toBe(false)
    expect(isDepositTransaction({ note: null })).toBe(false)
  })
})

describe("averagePerPeriod", () => {
  it("divides by the time since the first booking", () => {
    expect(averagePerPeriod(40, daysAgo(now, 28), now, 7)).toBeCloseTo(10)
  })

  it("counts at least one full period", () => {
    expect(averagePerPeriod(12, daysAgo(now, 2), now, 7)).toBeCloseTo(12)
  })

  it("is 0 without bookings", () => {
    expect(averagePerPeriod(0, undefined, now, 7)).toBe(0)
  })
})

describe("averageOverWindow", () => {
  it("only uses the last 12 weeks", () => {
    const bookings = [
      { totalAmount: 100, createdAt: daysAgo(now, 200) },
      { totalAmount: 24, createdAt: daysAgo(now, 30) },
    ]
    expect(averageOverWindow(bookings, now, 7)).toBeCloseTo(2)
  })

  it("starts at the first booking when it is within the window", () => {
    const bookings = [{ totalAmount: 6, createdAt: daysAgo(now, 21) }]
    expect(averageOverWindow(bookings, now, 7)).toBeCloseTo(2)
  })

  it("is 0 without bookings", () => {
    expect(averageOverWindow([], now, 7)).toBe(0)
  })
})

describe("rankByCountPerWeek", () => {
  it("sorts by count, limits and keeps the latest name", () => {
    const at = daysAgo(now, 1)
    expect(
      rankByCountPerWeek(
        [
          { key: "a", name: "Mate", createdAt: at },
          { key: "b", name: "Kaffee", createdAt: at },
          { key: "a", name: "Club Mate", createdAt: at },
          { key: "c", name: "Tee", createdAt: at },
          { key: "b", name: "Kaffee", createdAt: at },
          { key: "a", name: "Club Mate", createdAt: at },
        ],
        2,
        now,
      ).map(({ name, count }) => ({ name, count })),
    ).toEqual([
      { name: "Club Mate", count: 3 },
      { name: "Kaffee", count: 2 },
    ])
  })

  it("averages per item from its first sale within the window", () => {
    const entries = [
      { key: "old", name: "Mate", createdAt: daysAgo(now, 300) },
      ...[...Array<undefined>(12)].map(() => ({ key: "old", name: "Mate", createdAt: daysAgo(now, 10) })),
      ...[...Array<undefined>(6)].map(() => ({ key: "new", name: "Tee", createdAt: daysAgo(now, 21) })),
    ]
    expect(rankByCountPerWeek(entries, 5, now)).toEqual([
      { name: "Mate", count: 13, averagePerWeek: 1 },
      { name: "Tee", count: 6, averagePerWeek: 2 },
    ])
  })
})

describe("sumSince", () => {
  it("only sums bookings from the given date on", () => {
    const bookings = [
      { totalAmount: 5, createdAt: daysAgo(now, 10) },
      { totalAmount: 2, createdAt: daysAgo(now, 3) },
      { totalAmount: 1, createdAt: now },
    ]
    expect(sumSince(bookings, daysAgo(now, 7))).toBe(3)
  })
})
