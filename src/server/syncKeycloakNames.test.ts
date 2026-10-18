import { describe, expect, it } from "vitest"
import { isLdapUsername, nameFromIdToken } from "./syncKeycloakNames"

const idToken = (claims: object) => `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.y`

describe("isLdapUsername", () => {
  it("detects the old LDAP format", () => {
    expect(isLdapUsername("max.mustermann")).toBe(true)
    expect(isLdapUsername("Max Mustermann")).toBe(false)
    expect(isLdapUsername("Jürgen Müller")).toBe(false)
    expect(isLdapUsername(null)).toBe(false)
  })
})

describe("nameFromIdToken", () => {
  it("reads the name claim", () => {
    expect(nameFromIdToken(idToken({ name: " Jürgen Müller " }))).toBe("Jürgen Müller")
    expect(nameFromIdToken(idToken({ preferred_username: "x" }))).toBeUndefined()
    expect(nameFromIdToken("broken")).toBeUndefined()
    expect(nameFromIdToken(null)).toBeUndefined()
  })
})
