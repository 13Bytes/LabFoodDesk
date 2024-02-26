import { z } from "zod"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { validationSchema as clearingAccountValidationSchema }  from "~/components/General/AddClearingAccountForm"

export const clearingAccountRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.clearingAccount.findMany()
  }),

  create: adminProcedure.input(clearingAccountValidationSchema).mutation(async ({ ctx, input }) => {
    const account = await ctx.prisma.clearingAccount.create({ data: input })
    return account
  }),
})
