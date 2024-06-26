import { z } from "zod"
import { Tid, id, idObj } from "~/helper/zodTypes"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { createProcItemSchema } from "~/components/Forms/ProcurementItemForm"
import { Category, Prisma, PrismaClient } from "@prisma/client"
import { checkAccountBacking } from "~/server/helper/dbCallHelper"
import { createItemSchema } from "~/components/Forms/ItemForm"
import { calculateFeesPerCategory } from "~/helper/dataProcessing"

export const itemRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({ where: { is_active: true }, include: { categories: true } })
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

  getBuyable: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({
      where: { is_active: true, for_grouporders: false },
      include: { categories: true },
    })
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

    const item = await prisma.item.create({
      data: {
        name: input.name,
        price: input.price,
        categories: { connect: categories.map((category) => ({ id: category.id })) },
        is_active: true,
        for_grouporders: input.for_grouporders,
      },
    })
    return item
  }),

  updateItem: adminProcedure
    .input(createItemSchema.extend({ id }))
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )

      const { id, ...inputData } = input

      await prisma.$transaction([
        prisma.item.update({ where: { id: input.id }, data: { is_active: false } }),
        prisma.item.create({
          data: {
            ...inputData,
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
          return prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )
      const item = await prisma.procurementItem.create({
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
          return prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        }),
      )

      const { id, ...inputData } = input

      await prisma.$transaction([
        prisma.procurementItem.update({ where: { id: input.id }, data: { is_active: false } }),
        prisma.procurementItem.create({
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
      await buyOneItem(ctx.prisma, input.productID, ctx.session.user.id)
    }),
})

export const buyOneItem = async (
  prisma: PrismaClient,
  productID: Tid,
  userId: Tid,
  groupId?: Tid,
) => {
  const product = await prisma.item.findUniqueOrThrow({
    where: {
      id: productID,
    },
    include: { categories: { include: { markupDestination: true } } },
  })
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const fees = calculateFeesPerCategory(product.price, product.categories)
  const totalPrice = product.price + fees.total
  checkAccountBacking(user, totalPrice)

  await prisma.$transaction(async (tx) => {
    const transaction: Prisma.TransactionCreateInput = {
      user: { connect: { id: userId } },
      items: {
        create: [
          {
            item: { connect: { id: product.id } },
            categories: {
              connect: product.categories.map((category) => ({ id: category.id })),
            },
          },
        ],
      },
      type: 0,
      amountWithoutFees: product.price,
      totalAmount: totalPrice,
    }
    if (groupId) {
      transaction["groupOrder"] = { connect: { id: groupId } }
    }

    await tx.transaction.create({
      data: transaction
    })
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalPrice } },
    })
    for (const cat of fees.categories) {
      if (cat.clearingAccountId) {
        await tx.clearingAccount.update({
          where: { id: cat.clearingAccountId },
          data: { balance: { increment: cat.charges } },
        })
      }
    }
  })
}
