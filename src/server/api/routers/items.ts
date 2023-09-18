import { z } from "zod"
import {
  ItemSchema,
  ItemSelectSchema,
  ItemFindUniqueArgsSchema,
  ItemOrderByWithRelationInputSchema,
} from "~/../prisma/generated/zod"

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { prisma } from "~/server/db"


export const itemRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany()
  }),



  createItem: adminProcedure
    .input(
      z.object({
        name: z.string(),
        categories: z.array(z.string()),
        price: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
       const categories = await Promise.all( input.categories.map(async (categoryId) => {
         return prisma.category.findUniqueOrThrow({
           where: {
             id: categoryId,
           },
         })
       }))

      const item = await prisma.item.create({
        data: {
          name: input.name,
          price: input.price,
          categories: {connect: categories},
          is_active: true,
        },
      })
      return item
    }),

  buyOneItem: protectedProcedure
    .input(z.object({ productID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await prisma.item.findUniqueOrThrow({
        where: {
          id: input.productID,
        },
      })

      // atomic action:
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            quantity: 1,
            // userId: ctx.session.user.id,
            user: { connect: { id: ctx.session.user.id } },
            // itemId: product.id,
            item: { connect: { id: product.id } },
            type: 0,
          },
        }),
        prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: product.price } },
        }),
      ])
    }),
})
