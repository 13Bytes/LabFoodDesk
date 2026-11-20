import { describe, expect, it } from "vitest"
import { isCurrentBuild, sessionBuildId } from "./sessionBuild"

describe("isCurrentBuild", () => {
  it("accepts tokens of the running build", () => {
    expect(isCurrentBuild({ build_id: sessionBuildId })).toBe(true)
  })

  it("rejects tokens of an older build or without build", () => {
    expect(isCurrentBuild({ build_id: "1700000000000" })).toBe(false)
    expect(isCurrentBuild({})).toBe(false)
    expect(isCurrentBuild(null)).toBe(false)
  })
})
