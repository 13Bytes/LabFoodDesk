import { z } from "zod"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc"
import { validationSchema as clearingAccountValidationSchema }  from "~/components/General/ClearingAccountForm"
import { id } from "~/helper/zodTypes"

export const clearingAccountRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.clearingAccount.findMany()
  }),
  get: adminProcedure.input(z.object({id: id})).query(async ({ ctx, input }) => {
    const account =  ctx.prisma.clearingAccount.findFirstOrThrow({ where: { id: input.id }})
    return account
  }),

  create: adminProcedure.input(clearingAccountValidationSchema).mutation(async ({ ctx, input }) => {
    const account = await ctx.prisma.clearingAccount.create({ data: input })
    return account
  }),

  update: adminProcedure.input(clearingAccountValidationSchema.extend({id: id})).mutation(async ({ ctx, input }) => {
    const {id, ...data} = input
    const account = await ctx.prisma.clearingAccount.update({where: {id: input.id}, data })
    return account
  }),
})
