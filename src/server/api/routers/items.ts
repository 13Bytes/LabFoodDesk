import { TRPCError } from "@trpc/server"
import { randomUUID } from "crypto"
import { type Prisma, type PrismaClient } from "~/generated/prisma/client"
import { z } from "zod"
import { createItemSchema } from "~/components/Forms/ItemForm"
import { createProcItemSchema } from "~/components/Forms/ProcurementItemForm"
import { calculateFeesPerCategory } from "~/helper/dataProcessing"
import { type Tid, id, idObj } from "~/helper/zodTypes"
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { checkAccountBacking, getReservedAmount } from "~/server/helper/dbCallHelper"

export const itemRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({ where: { is_active: true }, include: { categories: true, account: true } })
  }),

  getItem: protectedProcedure.input(idObj).query(({ ctx, input }) => {
    return ctx.prisma.item.findUniqueOrThrow({
      where: { id: input.id },
      include: { categories: true, _count: true },
    })
  }),

  getAllProcurementItems: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.procurementItem.findMany({
      where: { is_active: true },
      include: { categories: true },
    })
  }),

  getBuyable: protectedProcedure.query(async ({ ctx }) => {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const items = await ctx.prisma.item.findMany({
      where: { is_active: true, for_grouporders: false },
      include: { categories: true },
    })
    const groupedOrders = await ctx.prisma.itemCategoryMapping.groupBy({
      by: ["canonicalItemId"],
      where: { Transaction: { userId: ctx.session.user.id, canceled: false, type: 0 } },
      _count: { _all: true },
    })
    const recentOrders = await ctx.prisma.itemCategoryMapping.findMany({
      where: {
        Transaction: {
          userId: ctx.session.user.id,
          canceled: false,
          type: 0,
          createdAt: { gte: twoYearsAgo },
        },
      },
      select: {
        canonicalItemId: true,
        Transaction: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { Transaction: { createdAt: "desc" } },
    })
    const orderCountByCanonicalItemId = new Map(
      groupedOrders.map((groupedOrder) => [groupedOrder.canonicalItemId, groupedOrder._count._all]),
    )
    const lastBoughtAtByCanonicalItemId = new Map<string, Date>()
    recentOrders.forEach((order) => {
      if (!lastBoughtAtByCanonicalItemId.has(order.canonicalItemId)) {
        lastBoughtAtByCanonicalItemId.set(order.canonicalItemId, order.Transaction.createdAt)
      }
    })
    return items.map((item) => ({
      ...item,
      userOrderCount: orderCountByCanonicalItemId.get(item.canonicalItemId) ?? 0,
      userLastBoughtAt: lastBoughtAtByCanonicalItemId.get(item.canonicalItemId) ?? null,
    }))
  }),


  createItem: adminProcedure.input(createItemSchema).mutation(async ({ ctx, input }) => {
    const categories = await Promise.all(
      input.categories.map(async (categoryId) => {
        return prisma.category.findUniqueOrThrow({
          where: {
            id: categoryId,
          },
        })
      }),
    )
    const canonicalItemId = randomUUID()
    return await ctx.prisma.item.create({
      data: {
        canonicalItemId,
        id: canonicalItemId,
        name: input.name,
        price: input.price,
        deposit: input.deposit,
        account: { connect: { id: input.account } },
        categories: { connect: categories.map((category) => ({ id: category.id })) },
        is_active: true,
        for_grouporders: input.for_grouporders,
      },
    })
  }),

  updateItem: adminProcedure
    .input(createItemSchema.extend({ id }))
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return ctx.prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )
      const { id, ...inputData } = input
      const existingItem = await ctx.prisma.item.findUniqueOrThrow({
        where: { id },
        select: { canonicalItemId: true },
      })
      await ctx.prisma.$transaction([
        ctx.prisma.item.update({ where: { id }, data: { is_active: false } }),
        ctx.prisma.item.create({
          data: {
            ...inputData,
            canonicalItemId: existingItem.canonicalItemId,
            account: { connect: { id: input.account } },
            categories: { connect: categories.map((category) => ({ id: category.id })) },
          },
        }),
      ])
    }),

  deleteItem: adminProcedure.input(idObj).mutation(({ ctx, input }) => {
    return ctx.prisma.item.update({
      where: { is_active: true, id: input.id },
      data: { is_active: false },
    })
  }),

  getProcurementItem: protectedProcedure.input(idObj).query(({ ctx, input }) => {
    return ctx.prisma.procurementItem.findUniqueOrThrow({
      where: { id: input.id },
      include: { categories: true },
    })
  }),

  createProcurementItem: adminProcedure
    .input(createProcItemSchema)
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return ctx.prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )
      const item = await ctx.prisma.procurementItem.create({
        data: {
          name: input.name,
          categories: { connect: categories.map((category) => ({ id: category.id })) },
          is_active: true,
        },
      })
      return item
    }),

  updateProcurementItem: adminProcedure
    .input(createProcItemSchema.extend({ id }))
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return ctx.prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )

      const { id, ...inputData } = input

      await ctx.prisma.$transaction([
        ctx.prisma.procurementItem.update({ where: { id }, data: { is_active: false } }),
        ctx.prisma.procurementItem.create({
          data: {
            ...inputData,
            categories: { connect: categories.map((category) => ({ id: category.id })) },
          },
        }),
      ])
    }),

  deleteProcuremenntItem: adminProcedure.input(idObj).mutation(({ ctx, input }) => {
    return ctx.prisma.procurementItem.update({
      where: { is_active: true, id: input.id },
      data: { is_active: false },
    })
  }),

  getGroupBuyItems: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({
      where: { for_grouporders: true, is_active: true },
      include: { categories: true },
    })
  }),

  getGroupBuyProcurementItems: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.procurementItem.findMany({
      where: { is_active: true },
      include: { categories: true },
    })
  }),

  buyOneItem: protectedProcedure
    .input(z.object({ productID: id }))
    .mutation(async ({ ctx, input }) => {
      await buyItem(ctx.prisma, input.productID, ctx.session.user.id)
    }),

  buyItem: protectedProcedure
    .input(z.object({ productID: id, quantity: z.number().int().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      await buyItem(ctx.prisma, input.productID, ctx.session.user.id, undefined, input.quantity)
    }),

  buyDeposit: protectedProcedure
    .input(z.object({ productID: id, quantity: z.number().int().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      await buyDeposit(ctx.prisma, input.productID, ctx.session.user.id, input.quantity)
    })
})

/**
 * Books only the deposit of an item as its own buy (without category-markup) on the item's clearing-account
 */
export const buyDeposit = async (prisma: PrismaClient, productID: Tid, userId: Tid, quantity: number = 1) => {
  const product = await prisma.item.findUniqueOrThrow({ where: { id: productID } })
  if (!(product.deposit > 0)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This item has no deposit" })
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    checkAccountBacking(user, product.deposit * quantity + (await getReservedAmount(tx, userId)))

    // one transaction per piece - like buyItem
    for (let i = 1; i <= quantity; i++) {
      await tx.transaction.create({
        data: {
          user: { connect: { id: userId } },
          clearingAccount: { connect: { id: product.accountId } },
          type: 0,
          amountWithoutFees: product.deposit,
          totalAmount: product.deposit,
          note: `Pfand: ${product.name}`,
        },
      })
    }
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: product.deposit * quantity } },
    })
    await tx.clearingAccount.update({
      where: { id: product.accountId },
      data: { balance: { increment: product.deposit * quantity } },
    })
  })
}

export const buyItem = async (
  prisma: PrismaClient,
  productID: Tid,
  userId: Tid,
  groupId?: Tid,
  quantity: number = 1,
) => {
  const product = await prisma.item.findUniqueOrThrow({
    where: {
      id: productID,
    },
    include: { categories: { include: { markupDestination: true } }, account: true },
  })

  const fees = calculateFeesPerCategory(product.price, product.categories)
  // fees without a clearing-account would be charged but booked nowhere
  if (fees.categories.some((cat) => cat.charges !== 0 && !cat.clearingAccountId)) {
    throw new TRPCError({
      code: "METHOD_NOT_SUPPORTED",
      message: "Category has no clearing-account set - please contact an admin and let them fix it",
    })
  }
  const totalPriceSingleQty = product.price + fees.total

  await prisma.$transaction(async (tx) => {
    if (groupId) {
      // claim the group order row before anything else: closing or settling it has to wait for this
      // transaction (and vice versa), so a reservation can't slip in after the orders were stopped
      const openGroup = await tx.groupOrder.updateMany({
        where: { id: groupId, status: 0 },
        data: { status: 0 },
      })
      if (openGroup.count === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
      }
    }
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    checkAccountBacking(user, totalPriceSingleQty * quantity + (await getReservedAmount(tx, userId)))

    const transaction: Prisma.TransactionCreateInput = {
      user: { connect: { id: userId } },
      items: {
        create: [
          {
            item: { connect: { id: product.id } },
            canonicalItemId: product.canonicalItemId,
            categories: {
              connect: product.categories.map((category) => ({ id: category.id })),
            },
          },
        ],
      },
      clearingAccount: { connect: { id: product.accountId } },
      type: 0,
      amountWithoutFees: product.price,
      totalAmount: totalPriceSingleQty,
    }
    if (groupId) {
      // group-order buys are only reserved (type 4) and booked when the group order is closed;
      // the item price then goes to the destination-user instead of the clearing-account
      transaction["groupOrder"] = { connect: { id: groupId } }
      transaction.type = 4
      delete transaction.clearingAccount
      // fees are calculated on close - keep today's markups: until then categories can be edited and their
      // link to this buy (ItemCategoryMapping) can move to a later buy
      transaction.categoryFees = {
        create: product.categories.map((category) => ({
          categoryId: category.id,
          markupFixed: category.markupFixed,
          markupPercentage: category.markupPercentage,
          markupDestinationId: category.markupDestinationId,
        })),
      }
    }

    for (let i = 1; i <= quantity; i++) {
      await tx.transaction.create({
        data: transaction
      })
      if (groupId) {
        continue
      }
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalPriceSingleQty } },
      })
      await tx.clearingAccount.update({
        where: { id: product.accountId },
        data: { balance: { increment: product.price } },
      })
      for (const cat of fees.categories) {
        if (cat.clearingAccountId) {
          await tx.clearingAccount.update({
            where: { id: cat.clearingAccountId },
            data: { balance: { increment: cat.charges } },
          })
        }
      }
    }
  })
}
