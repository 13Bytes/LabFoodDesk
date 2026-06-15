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
import { checkAccountBacking } from "~/server/helper/dbCallHelper"

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
    .input(z.object({ productID: id, quantity: z.number().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      await buyItem(ctx.prisma, input.productID, ctx.session.user.id, undefined, input.quantity)
    })
})

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
  const totalPriceSingleQty = product.price + fees.total

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    checkAccountBacking(user, totalPriceSingleQty * quantity)

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
      transaction["groupOrder"] = { connect: { id: groupId } }
    }

    for (let i = 1; i <= quantity; i++) {
      await tx.transaction.create({
        data: transaction
      })
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
