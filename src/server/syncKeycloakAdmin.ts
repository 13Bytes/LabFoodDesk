import type { PrismaClient } from "~/generated/prisma/client"

// The admin right comes from the LDAP group LABEATS_ADMIN, which Keycloak passes on as
// the "groups" claim. NextAuth only uses the profile when creating a user, so the
// admin right has to be synced on every login - otherwise it is never granted or revoked.

const adminGroup = "LABEATS_ADMIN"

/** Returns undefined if the groups claim is missing or malformed, so a broken response changes nothing. */
export const isAdminFromGroups = (groups: unknown) => {
  if (!Array.isArray(groups) || !groups.every((group) => typeof group === "string")) return undefined
  return groups.some((group: string) => group.toUpperCase() === adminGroup)
}

/** Updates the admin right of the user from the Keycloak groups, returns the resulting value. */
export const syncKeycloakAdmin = async (
  prisma: PrismaClient,
  user: { id: string; is_admin: boolean },
  groups: unknown,
) => {
  const isAdmin = isAdminFromGroups(groups)
  if (isAdmin === undefined || isAdmin === user.is_admin) return user.is_admin
  await prisma.user.update({ where: { id: user.id }, data: { is_admin: isAdmin } })
  console.info(`Admin-sync: ${user.id} is_admin ${user.is_admin} -> ${isAdmin}`)
  return isAdmin
}
