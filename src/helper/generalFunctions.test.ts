import { describe, expect, it } from "vitest"
import { calculateSplit, canRevertGroupOrder } from "~/helper/generalFunctions"

describe("calculateSplit", () => {
  it("splits by factors (empty = 1)", () => {
    expect(calculateSplit(30, [1, 1, 1], "factor").amounts).toEqual([10, 10, 10])
    expect(calculateSplit(30, [2, undefined], "factor")).toEqual({ shares: [2, 1], amounts: [20, 10] })
  })

  it("splits by percentages, empty ones share the rest of 100%", () => {
    expect(calculateSplit(50, [50, 30, 20], "percent").amounts).toEqual([25, 15, 10])
    expect(calculateSplit(50, [50, undefined, undefined], "percent")).toEqual({
      shares: [50, 25, 25],
      amounts: [25, 12.5, 12.5],
    })
    expect(calculateSplit(50, [undefined, undefined], "percent").shares).toEqual([50, 50])
  })

  it("uses absolute values, empty ones share the rest of the total", () => {
    expect(calculateSplit(100, [4.5, 3], "absolute").amounts).toEqual([4.5, 3])
    expect(calculateSplit(30, [10, undefined, undefined], "absolute").amounts).toEqual([10, 10, 10])
  })

  it("returns negative automatic shares if fixed shares exceed the target", () => {
    expect(calculateSplit(10, [80, 40, undefined], "percent").shares).toEqual([80, 40, -20])
    expect(calculateSplit(10, [15, undefined], "absolute").amounts).toEqual([15, -5])
  })

  it("treats invalid shares and totals as 0", () => {
    expect(calculateSplit(30, [NaN, -1, 1], "factor").amounts).toEqual([0, 0, 30])
    expect(calculateSplit(NaN, [1, 1], "factor").amounts).toEqual([0, 0])
    expect(calculateSplit(30, [0, 0], "factor").amounts).toEqual([0, 0])
    expect(calculateSplit(0, [NaN, 2], "absolute").amounts).toEqual([0, 2])
  })
})

describe("canRevertGroupOrder", () => {
  const closedAt = new Date("2026-01-01T12:00:00Z")
  const user = { id: "closer", is_admin: false }

  it("lets admins always revert", () => {
    expect(canRevertGroupOrder({ id: "admin", is_admin: true }, "closer", undefined)).toBe(true)
  })

  it("lets the closing user revert within 2h only", () => {
    expect(canRevertGroupOrder(user, "closer", closedAt, new Date("2026-01-01T13:59:00Z"))).toBe(true)
    expect(canRevertGroupOrder(user, "closer", closedAt, new Date("2026-01-01T14:01:00Z"))).toBe(false)
  })

  it("denies other users", () => {
    expect(canRevertGroupOrder({ id: "other", is_admin: false }, "closer", closedAt, closedAt)).toBe(false)
    expect(canRevertGroupOrder(undefined, "closer", closedAt, closedAt)).toBe(false)
  })
})
