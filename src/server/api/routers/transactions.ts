import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { calculateFeesPerCategory } from "~/helper/dataProcessing"
import { id } from "~/helper/zodTypes"

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { checkAccountBacking } from "~/server/helper/dbCallHelper"

export const sendMoneyProcurementSchema = z.object({
  destinationUserId: id,
  amount: z.number(),
  note: z.string().optional(),
})

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
          // userId with type 3 not shown, as user only created transaction, but has no monetarian stake
          OR: [{ userId: ctx.session.user.id, type: { lte: 2 } }, { moneyDestinationUserId: ctx.session.user.id }],
        },
        include: {
          items: { include: { item: { include: { categories: true } } } },
          procurementItems: { include: { item: { include: { categories: true } } } },
          moneyDestination: { select: { name: true } },
          user: { select: { name: true } },
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

  getAllInfinite: adminProcedure
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
        },
        include: {
          items: { include: { item: { include: { categories: true } } } },
          procurementItems: { include: { item: { include: { categories: true } } } },
          moneyDestination: { select: { name: true } },
          user: { select: { name: true } },
          canceledBy: { select: { name: true } },
          clearingAccount: { select: { name: true } },
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
      await ctx.prisma.$transaction([
        ctx.prisma.transaction.create({
          data: {
            user: { connect: { id: ctx.session.user.id } },
            type: 2,
            moneyDestination: { connect: { id: destinationUser.id } },
            totalAmount: input.amount,
            note: input.note,
          },
        }),
        ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: input.amount } },
        }),
        ctx.prisma.user.update({
          where: { id: destinationUser.id },
          data: { balance: { increment: input.amount } },
        }),
      ])
    }),

  retractMoney: protectedProcedure
    .input(z.object({ moneySourceUserId: id, amount: z.number(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const moneySourceUser = await prisma.user.findUniqueOrThrow({
        where: { id: input.moneySourceUserId },
      })
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })

      if (input.amount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't request a negative amount - send money instead",
        })
      }

      // atomic action:
      await ctx.prisma.$transaction([
        ctx.prisma.transaction.create({
          data: {
            user: { connect: { id: ctx.session.user.id } },
            type: 2,
            moneyDestination: { connect: { id: moneySourceUser.id } },
            totalAmount: -input.amount,  // send negative amount to retract money but still indicate the executing user
            note: input.note,
          },
        }),
        ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { increment: input.amount } },
        }),
        ctx.prisma.user.update({
          where: { id: moneySourceUser.id },
          data: { balance: { decrement: input.amount } },
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

  undoTransaction: protectedProcedure
    .input(z.object({ transactionId: id }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findUniqueOrThrow({
        where: { id: input.transactionId },
        include: { items: { include: { item: true, categories: true } }, procurementItems: { include: { item: { include: { categories: true } } } } }
      })
      if (transaction.createdAt < new Date(Date.now() - 1000 * 60 * 15)) { // 15min - in ms
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Transaction is too old to be undone",
        })
      }

      // 0: buy, 1: sell, 2: transfer, 3: procurement
      if (transaction.type === 0) {
        if (transaction.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can only undo your own Transactions",
          })
        }
        if (!!transaction.groupOrderId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can't exit from group-orders after the fact",
          })
        }
        await ctx.prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: input.transactionId },
            data: { type: 90 },
          })
          await tx.user.update({
            where: { id: transaction.userId },
            data: { balance: { increment: transaction.totalAmount } },
          })
          for (const item of transaction.items) {
            const fees = calculateFeesPerCategory(item.item.price, item.categories)
            for (const cat of fees.categories) {
              if (cat.charges !== 0) {
                await tx.clearingAccount.update({
                  where: { id: cat.clearingAccountId },
                  data: { balance: { decrement: cat.charges } },
                })
              }
            }
          }
        })
      }
      else {
        // TODO!
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This kind of transaction currently doesn't support undoing",
        })
      }
    })
})
