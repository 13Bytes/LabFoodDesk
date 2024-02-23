import { z } from "zod"
import { id } from "~/helper/zodTypes"

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { checkAccountBacking } from "~/server/helper/dbCallHelper"

const pageSize = 20
export const transactionRouter = createTRPCRouter({
  getMineLatest: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId: ctx.session.user.id },
    })
  }),

  getMineInfinite: protectedProcedure
    .input(
      z.object({
        cursor: z.number().min(1).optional().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.cursor ?? 1
      const items = await ctx.prisma.transaction.findMany({
        take: pageSize + 1, // get an extra item at the end which we'll use as next cursor
        where: {
          OR: [{ userId: ctx.session.user.id }, { moneyDestinationUserId: ctx.session.user.id }],
        },
        include: {
          items: true,
          procurementItems: true,
        },
        skip: (page - 1) * pageSize,
        orderBy: {
          createdAt: "desc",
        },
      })

      // Last element is to check if list extends past current page
      const nextPageExists = items.length > pageSize
      if (nextPageExists) {
        items.pop()
      }

      return {
        items,
        pageNumber: page,
        nextPageExists,
      }
    }),

  sendMoney: protectedProcedure
    .input(z.object({ destinationUserId: id, amount: z.number(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const destinationUser = await prisma.user.findUniqueOrThrow({
        where: { id: input.destinationUserId },
      })

      const user = await ctx.prisma.user.findUniqueOrThrow({where: {id: ctx.session.user.id}})
      await checkAccountBacking(user, input.amount)

      // atomic action:
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            user: { connect: { id: ctx.session.user.id } },
            type: 2,
            moneyDestination: { connect: { id: destinationUser.id } },
            totalAmount: input.amount,
            note: input.note,
          },
        }),
        prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: input.amount } },
        }),
        prisma.user.update({
          where: { id: destinationUser.id },
          data: { balance: { increment: input.amount } },
        }),
      ])
    }),
})
