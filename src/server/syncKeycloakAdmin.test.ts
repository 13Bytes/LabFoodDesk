import { describe, expect, it, vi } from "vitest"
import type { PrismaClient } from "~/generated/prisma/client"
import { isAdminFromGroups, syncKeycloakAdmin } from "./syncKeycloakAdmin"

describe("isAdminFromGroups", () => {
  it("detects the admin group", () => {
    expect(isAdminFromGroups(["labeats_admin"])).toBe(true)
    expect(isAdminFromGroups(["users"])).toBe(false)
    expect(isAdminFromGroups([])).toBe(false)
    expect(isAdminFromGroups(undefined)).toBeUndefined()
    // a malformed claim must not revoke the admin right
    expect(isAdminFromGroups(["users", 42])).toBeUndefined()
  })
})

describe("syncKeycloakAdmin", () => {
  const prismaMock = () => {
    const update = vi.fn()
    return { prisma: { user: { update } } as unknown as PrismaClient, update }
  }

  it("grants and revokes the admin right", async () => {
    const { prisma, update } = prismaMock()
    expect(await syncKeycloakAdmin(prisma, { id: "1", is_admin: false }, ["LABEATS_ADMIN"])).toBe(true)
    expect(await syncKeycloakAdmin(prisma, { id: "1", is_admin: true }, ["users"])).toBe(false)
    expect(update).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenLastCalledWith({ where: { id: "1" }, data: { is_admin: false } })
  })

  it("keeps the admin right without groups claim", async () => {
    const { prisma, update } = prismaMock()
    expect(await syncKeycloakAdmin(prisma, { id: "1", is_admin: true }, undefined)).toBe(true)
    expect(update).not.toHaveBeenCalled()
  })
})
