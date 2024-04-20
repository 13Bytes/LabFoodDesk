import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { id } from "~/helper/zodTypes"
import { sendMoneyProcurementSchema } from "~/pages/admin/procurement"

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
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
          // userId with type 3 not shown, as user only created tranasaction, but has no monetarian stake
          OR: [{ userId: ctx.session.user.id,  type: {lte: 2 } }, {moneyDestinationUserId: ctx.session.user.id}],   
        },
        include: {
          items: { include: { item: { include: { categories: true } } } },
          procurementItems: { include: { item: { include: { categories: true } } } },
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

      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })
      if (input.amount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't send a negative amount",
        })
      }
      checkAccountBacking(user, input.amount)

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

  sendMoneyProcurement: adminProcedure
    .input(sendMoneyProcurementSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const recipient = await tx.user.update({
          data: {
            balance: {
              increment: input.amount,
            },
          },
          where: {
            id: input.destinationUserId,
          },
        })
        await tx.transaction.create({
          data: {
            totalAmount: input.amount,
            type: 3,
            moneyDestination: { connect: { id: recipient.id } },
            note: input.note,
            user: { connect: { id: ctx.session.user.id } },
          },
        })
      })
    }),
})
