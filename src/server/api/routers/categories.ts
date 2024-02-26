import { z } from "zod"
import { addCategoryValidationSchem } from "~/components/General/AddCategoryForm"
import { Prisma } from "@prisma/client"

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"

export const categoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.category.findMany({
      include: {},
    })
  }),

  createCategory: adminProcedure
    .input(addCategoryValidationSchem)
    .mutation(async ({ ctx, input }) => {
      const { markupDestination, ...correctedData } = input
      if(markupDestination == undefined){
        correctedData.markupFixed = 0
        correctedData.markupPercentage = 0
      }

      const category = await ctx.prisma.category.create({
        data: {
          markupDestination:
            markupDestination != undefined ? { connect: { id: markupDestination } } : undefined,
          ...correctedData,
        },
      })
      return category
    }),
})
