import { env } from "~/env.mjs"
import { z } from "zod"


import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc"

export const userRouter = createTRPCRouter({
  
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    })
  }),

  getCtx: publicProcedure.query(({ ctx }) => {
    return {
      LDAP_URL:env.LDAP_URL,
      LDAP_BIND_USER:env.LDAP_BIND_USER,
      LDAP_BIND_PASSWORT:env.LDAP_BIND_PASSWORT,
      LDAP_SEARCH_BASE:env.LDAP_SEARCH_BASE,
      LDAP_ADMIN_GROUP:env.LDAP_ADMIN_GROUP,
    }
  }),

  updateMe: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name },
      })
      return user
    }),

  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({ select: { name: true, id: true } })
  }),

  getAllUsersWithAllowOverdraw: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({ where: {allowOverdraw: true}, select: { name: true, id: true } })
  }),
  
  getAllBalances: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({ select: { name: true, id: true, balance: true } })
  }),
})
