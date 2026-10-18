// Every container update should sign out all users once. The session is a JWT cookie,
// so it can only be invalidated by checking it: each token stores the build it was issued
// by, tokens from an older build are rejected. SESSION_BUILD_ID is set in next.config.mjs.

export const sessionBuildId = process.env.SESSION_BUILD_ID ?? "dev"

/** True if the token was issued by the currently running build. */
export const isCurrentBuild = (token: { build_id?: unknown } | null | undefined) =>
  token?.build_id === sessionBuildId
