import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc"

export const clearingAccountRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.clearingAccount.findMany()
  })
})
