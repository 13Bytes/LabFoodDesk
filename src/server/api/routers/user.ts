import { z } from "zod"
import { env } from "~/env.mjs"
import { id } from "~/helper/zodTypes"

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc"
import {
  averageOverWindow,
  daysPerMonth,
  daysPerWeek,
  isDepositTransaction,
  rankByCountPerWeek,
} from "~/server/helper/statistics"

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    })
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
    })
    // reserved group-order buys (type 4) only count once they are booked as type 0
    const buyTransactions = await ctx.prisma.transaction.findMany({
      where: {
        userId: ctx.session.user.id,
        type: 0,
        canceled: false,
      },
      select: {
        totalAmount: true,
        createdAt: true,
        note: true,
        items: { select: { canonicalItemId: true, item: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    })
    const procurementTransactions = await ctx.prisma.transaction.findMany({
      where: {
        moneyDestinationUserId: ctx.session.user.id,
        type: 3,
        canceled: false,
      },
    })
    const usersWithMoreMoney = await ctx.prisma.user.findMany({
      where: {
        balance: { gt: user.balance },
      },
    })
    const totalAmountBought = buyTransactions.reduce((acc, curr) => acc + curr.totalAmount, 0)
    const now = new Date()
    return {
      prepaidVolumePlacement: usersWithMoreMoney.length + 1,
      totalAmountBought,
      totalAmountProcured: procurementTransactions.reduce((acc, curr) => acc + curr.totalAmount, 0),
      averagePerWeek: averageOverWindow(buyTransactions, now, daysPerWeek),
      averagePerMonth: averageOverWindow(buyTransactions, now, daysPerMonth),
      depositPaid: buyTransactions
        .filter(isDepositTransaction)
        .reduce((acc, curr) => acc + curr.totalAmount, 0),
      favoriteItems: rankByCountPerWeek(
        buyTransactions.flatMap((transaction) =>
          transaction.items.map((mapping) => ({
            key: mapping.canonicalItemId,
            name: mapping.item.name,
            createdAt: transaction.createdAt,
          })),
        ),
        3,
        now,
      ),
    }
  }),

  getUser: adminProcedure
    .input(z.object({ id }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id },
      })
    }),

  updateUser: adminProcedure
    .input(z.object({ id, allowOverdraw: z.boolean() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { allowOverdraw: input.allowOverdraw },
      })
    }),

  getCtx: publicProcedure.query(() => {
    return {
      LDAP_URL: env.LDAP_URL,
      LDAP_BIND_USER: env.LDAP_BIND_USER,
      LDAP_BIND_PASSWORT: env.LDAP_BIND_PASSWORT,
      LDAP_SEARCH_BASE: env.LDAP_SEARCH_BASE,
      LDAP_ADMIN_GROUP: env.LDAP_ADMIN_GROUP,
    }
  }),

  // Disabled as name is taken from LDAP
  // updateMe: protectedProcedure
  //   .input(
  //     z.object({
  //       name: z.string(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const user = await ctx.prisma.user.update({
  //       where: { id: ctx.session.user.id },
  //       data: { name: input.name },
  //     })
  //     return user
  //   }),

  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { name: true, id: true },
      orderBy: { name: "asc" },
    })
  }),

  getAllUsersWithAllowOverdraw: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { allowOverdraw: true },
      select: { name: true, id: true },
      orderBy: { name: "asc" },
    })
  }),

  getAllBalances: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { name: true, id: true, balance: true },
      orderBy: { name: "asc" },
    })
  }),

  getAllUsersDetailed: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { name: true, id: true, is_admin: true, balance: true, allowOverdraw: true },
      orderBy: { name: "asc" },
    })
  }),
})
