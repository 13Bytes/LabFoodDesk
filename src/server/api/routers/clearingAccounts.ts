import { TRPCError } from "@trpc/server"
import { validationSchema as clearingAccountValidationSchema } from "~/components/Forms/ClearingAccountForm"
import { id, idObj } from "~/helper/zodTypes"
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc"

export const clearingAccountRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.clearingAccount.findMany()
  }),
  get: adminProcedure.input(idObj).query(async ({ ctx, input }) => {
    const account =  ctx.prisma.clearingAccount.findFirstOrThrow({ where: { id: input.id }})
    return account
  }),

  create: adminProcedure.input(clearingAccountValidationSchema).mutation(async ({ ctx, input }) => {
    const account = await ctx.prisma.clearingAccount.create({ data: input })
    return account
  }),
  delete: adminProcedure.input(idObj).mutation(async ({ ctx, input }) => {
    const account = await ctx.prisma.clearingAccount.findUniqueOrThrow({ where: { id: input.id }})
    if(account.balance != 0){
      throw new TRPCError({code:"CONFLICT" , message: "Account has a balance and can't be deleted"})
    } 
    else{
      await ctx.prisma.clearingAccount.delete({ where: { id: input.id }})
      return true
    }
  }),

  update: adminProcedure.input(clearingAccountValidationSchema.extend({id: id})).mutation(async ({ ctx, input }) => {
    const {id, ...data} = input
    const account = await ctx.prisma.clearingAccount.update({where: {id: input.id}, data })
    return account
  }),
})
