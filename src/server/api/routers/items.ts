import { z } from "zod"
import { id } from "~/helper/zodTypes"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { validationSchema as AddProcurementItemSchema } from "~/components/General/AddProcurementItemForm"
import { Category } from "@prisma/client"
import { checkAccountBacking } from "~/server/helper/dbCallHelper"

export const itemRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({ include: { categories: true } })
  }),

  getAllProcurementItems: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.procurementItem.findMany({ include: { categories: true } })
  }),

  getBuyable: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany({
      where: { is_active: true, for_grouporders: false },
      include: { categories: true },
    })
  }),

  createItem: adminProcedure
    .input(
      z.object({
        name: z.string(),
        categories: z.array(id),
        price: z.number(),
        for_grouporders: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        })
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

  createProcurementItem: adminProcedure
    .input(AddProcurementItemSchema)
    .mutation(async ({ ctx, input }) => {
      const categories = await Promise.all(
        input.categories.map(async (categoryId) => {
          return prisma.category.findUniqueOrThrow({
            where: {
              id: categoryId,
            },
          })
        })
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
      const product = await prisma.item.findUniqueOrThrow({
        where: {
          id: input.productID,
        },
      })
      const quantity = 1 // currently only single item purchases supported
      
      const totalPrice = product.price * quantity
      const user = await ctx.prisma.user.findUniqueOrThrow({where: {id: ctx.session.user.id}})
      checkAccountBacking(user, product.price * totalPrice)

      // atomic action:
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            quantity: quantity,
            // userId: ctx.session.user.id,
            user: { connect: { id: ctx.session.user.id } },
            // itemId: product.id,
            item: { connect: { id: product.id } },
            type: 0,
            totalAmount: totalPrice,
          },
        }),
        prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: totalPrice } },
        }),
      ])
    }),
})
