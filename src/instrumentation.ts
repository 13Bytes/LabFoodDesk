export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { prisma } = await import("~/server/db")
  const { syncKeycloakNames } = await import("~/server/syncKeycloakNames")
  try {
    await syncKeycloakNames(prisma)
  } catch (error) {
    console.error("User-rename: failed", error)
  }
}
