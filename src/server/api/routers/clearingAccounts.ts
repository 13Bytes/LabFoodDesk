import { TRPCError } from "@trpc/server"
import { validationSchema as clearingAccountValidationSchema } from "~/components/Forms/ClearingAccountForm"
import { id, idObj } from "~/helper/zodTypes"
import { sendMoneyFromClearingAccountSchema } from "~/pages/admin/clearingAccounts"
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

  sendMoneyFromClearingAccount: adminProcedure
  .input(sendMoneyFromClearingAccountSchema)
  .mutation(async ({ ctx, input }) => {
    const clearingAccount = await ctx.prisma.clearingAccount.findUniqueOrThrow({
      where: { id: input.sourceClearingAccountId },
    })

    await ctx.prisma.$transaction(
      async (tx) => {
        // 1. Decrement amount from the sender.
        const sender = await tx.clearingAccount.update({
          data: {
            balance: {
              decrement: input.amount,
            },
          },
          where: {
            id: input.sourceClearingAccountId,
          },
        })
    
        // 2. Verify that the sender's balance didn't go below zero.
        if (sender.balance < 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "The account hasn't enough credit",
          })
        }
    
        // 3. Increment the recipient's balance
        const recipient = await tx.user.update({
          data: {
            balance: {
              increment: input.amount,
            },
          },
          where: {
            id: input.destinationUserId,
          },
        })
      })
  }),
})
