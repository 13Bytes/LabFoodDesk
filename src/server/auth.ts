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
import { env } from "~/env.mjs"
import { prisma } from "~/server/db"
import { manageLdapLogin } from "./ldap"

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

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
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
    CredentialsProvider({
      name: "ASL-Account",
      credentials: {
        username: { label: "ASL-Username", type: "text", placeholder: "sally.ride" },
        password: { label: "Password", type: "password", placeholder: "sUper $ecr3t" },
      },
      async authorize(credentials, req) {
        if (!credentials || credentials.username.length <= 1 || credentials.password.length <= 1) {
          return null
        }
        return manageLdapLogin(credentials?.username, credentials?.password)
      },
    }),
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
            sendVerificationRequest(params) {
              console.log("\n", "=".repeat(40))
              console.log(`🔗 Verification URL: ${params.url}`)
              console.log("=".repeat(40), "\n")
            },
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
