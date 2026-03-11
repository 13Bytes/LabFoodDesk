import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { type GetServerSidePropsContext } from "next"
import {
  getServerSession,
  type DefaultSession,
  type DefaultUser,
  type NextAuthOptions,
} from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import KeycloakProvider from "next-auth/providers/keycloak"
import { env } from "~/env.mjs"
import { prisma } from "~/server/db"
import { manageLdapLogin } from "./ldap"
import { Adapter, AdapterAccount } from "next-auth/adapters"

export const keycloakEnabled =
  !!env.KEYCLOAK_ISSUER &&
  !!env.KEYCLOAK_CLIENT_ID &&
  !!env.KEYCLOAK_CLIENT_SECRET

export const ldapEnabled =
  !!env.LDAP_URL &&
  !!env.LDAP_BIND_USER &&
  !!env.LDAP_BIND_PASSWORT

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      // ...other properties
      // role: UserRole;
      is_admin: boolean
    } & DefaultSession["user"]
  }
}
declare module "next-auth" {
  interface User extends DefaultUser {
    is_admin: boolean
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    is_admin_jwt: boolean
    subscribed: boolean
  }
}

/** IMPORTANT FOR INTEGRATING KEYCLOAK */
const prismaAdapter = PrismaAdapter(prisma) as Adapter
const extendedPrismaAdapter: Adapter = {
  ...prismaAdapter,
  async linkAccount(account: AdapterAccount) {
    if (!prismaAdapter.linkAccount)
      throw new Error("NextAuth: prismaAdapter.linkAccount not implemented");

    // Keycloak returns incompatible data with the nextjs-auth schema
    // (refresh_expires_in and not-before-policy).
    // refresh_expires_in was added to the schema, but not-before-policy is not compatible with Prisma's field naming conventions.
    // So, we need to remove this data from the payload before linking an account.
    // https://github.com/nextauthjs/next-auth/issues/7655
    if (account.provider === "keycloak") {
      delete account["not-before-policy"];
    }

    await prismaAdapter.linkAccount(account);
  },
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: extendedPrismaAdapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        is_admin: token.is_admin_jwt,
      },
    }),
    jwt({ token, user }) {
      if (user) {
        token.is_admin_jwt = user.is_admin
      }
      return token
    },
  },
  providers: [
    ...(ldapEnabled ? [
      CredentialsProvider({
      name: "ASL-Account",
      credentials: {
        username: { label: "ASL-Username", type: "text", placeholder: "sally.ride" },
        password: { label: "Password", type: "password", placeholder: "sUper $ecr3t" },
      },
        async authorize(credentials, _req) {
        if (!credentials || credentials.username.length <= 1 || credentials.password.length <= 1) {
          return null
        }
        return manageLdapLogin(credentials?.username, credentials?.password)
      },
      })
    ] : []),
    ...(keycloakEnabled
      ? [
        KeycloakProvider({
          clientId: env.KEYCLOAK_CLIENT_ID!,
          clientSecret: env.KEYCLOAK_CLIENT_SECRET!,
          issuer: env.KEYCLOAK_ISSUER!,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
    ...(env.NODE_ENV === "development"
      ? [
          EmailProvider({
            server: {
              host: env.EMAIL_SERVER_HOST,
              port: env.EMAIL_SERVER_PORT,
              auth: {
                user: env.EMAIL_SERVER_USER,
                pass: env.EMAIL_SERVER_PASSWORD,
              },
            },
            ...(env.EMAIL_DEV_PRINT_TOKEN === "true" && env.NODE_ENV === "development" && {
              sendVerificationRequest(params) {
                console.log("\n", "=".repeat(40))
                console.log(`🔗 Verification URL: ${params.url}`)
                console.log("=".repeat(40), "\n")
              },
            }),
            from: env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"]
  res: GetServerSidePropsContext["res"]
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions)
}
