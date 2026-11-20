import type { PrismaClient } from "~/generated/prisma/client"

// The old LDAP login stored the lowercased username ("vorname.nachname") as name,
// Keycloak provides the display name ("Vorname Nachname"). NextAuth never updates the
// name of an existing user, so users from the LDAP era keep the old format.

const ldapUsernameRegex = /^[\w.-]+$/

export const isLdapUsername = (name: string | null | undefined) =>
  !!name && ldapUsernameRegex.test(name)

export const nameFromIdToken = (idToken: string | null | undefined) => {
  try {
    const payload = idToken?.split(".")[1]
    if (!payload) return undefined
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >
    return typeof claims.name === "string" && claims.name.trim() ? claims.name.trim() : undefined
  } catch {
    return undefined
  }
}

/** Replaces an old LDAP username with the Keycloak display name. */
export const renameLdapUser = async (
  prisma: PrismaClient,
  user: { id: string; name?: string | null },
  keycloakName: string | null | undefined,
) => {
  const newName = keycloakName?.trim()
  if (!newName || isLdapUsername(newName) || !isLdapUsername(user.name)) return
  await prisma.user.update({ where: { id: user.id }, data: { name: newName } })
  console.info(`User-rename: "${user.name}" (${user.id}) -> "${newName}"`)
}

/** Renames all users with a Keycloak login that still have the old LDAP username. */
export const syncKeycloakNames = async (prisma: PrismaClient) => {
  const keycloakAccounts = await prisma.account.findMany({
    where: { provider: "keycloak" },
    select: { id_token: true, user: { select: { id: true, name: true } } },
  })
  for (const { id_token, user } of keycloakAccounts) {
    await renameLdapUser(prisma, user, nameFromIdToken(id_token))
  }
}
