import { z } from "zod"
import { addCategoryValidationSchem } from "~/components/Forms/CategoryForm"
import { Prisma } from "@prisma/client"
import { prisma } from "~/server/db"

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { id, idObj } from "~/helper/zodTypes"

export const categoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.category.findMany({
      where: { is_active: true },
    })
  }),

  get: protectedProcedure.input(idObj).query(({ ctx, input }) => {
    return ctx.prisma.category.findUniqueOrThrow({
      where: { id: input.id },
      // include: { markupDestination: true },
    })
  }),

  create: adminProcedure.input(addCategoryValidationSchem).mutation(async ({ ctx, input }) => {
    console.log(input)
    const { markupDestination, ...correctedData } = input
    const entryWithMarkup = markupDestination != undefined && markupDestination !== ""
    if (!entryWithMarkup) {
      correctedData.markupFixed = 0
      correctedData.markupPercentage = 0
    }

    const category = await ctx.prisma.category.create({
      data: {
        markupDestination: entryWithMarkup ? { connect: { id: markupDestination } } : undefined,
        ...correctedData,
      },
    })
    return category
  }),

  update: adminProcedure
    .input(addCategoryValidationSchem.extend({ id }))
    .mutation(async ({ ctx, input }) => {
      const { markupDestination, id, ...data } = input

      if (markupDestination == undefined) {
        data.markupFixed = 0
        data.markupPercentage = 0
      }

      const oldCategory = await ctx.prisma.category.findUniqueOrThrow({ where: { id } })
      const {markupDestinationId, itemPurchaseId, ...oldCategoryWithoutMoneyDest} = oldCategory
      const oldCategoryWithInclude = await ctx.prisma.category.findUniqueOrThrow({
        where: { id },
        include: { items: true, procurementItems: true },
      })

      await prisma.$transaction([
        prisma.category.create({
          data: {
            ...oldCategoryWithoutMoneyDest,
            markupDestination:  markupDestination ? { connect: { id: markupDestination } } : undefined,
            id: undefined,
            items: { connect: oldCategoryWithInclude.items.map((item) => ({ id: item.id })) },
            procurementItems: {
              connect: oldCategoryWithInclude.procurementItems.map((item) => ({ id: item.id })),
            },
            ...data,
          },
        }),
        prisma.category.update({
          where: { id: oldCategory.id },
          data: {
            is_active: false,
            items: { set: [] },
            procurementItems: { set: [] },
          },
        }),
      ])
    }),

  delete: adminProcedure.input(idObj).mutation(async ({ ctx, input }) => {
    const cat = await ctx.prisma.category.findUniqueOrThrow({
      where: { id: input.id },
      include: { procurementItems: true, items: true },
    })
    if (cat.procurementItems.length === 0 && cat.items.length === 0) {
      return await ctx.prisma.category.delete({ where: { id: input.id } })
    } else {
      return await ctx.prisma.category.update({
        where: { id: input.id },
        data: { is_active: false },
      })
    }
  }),
})
