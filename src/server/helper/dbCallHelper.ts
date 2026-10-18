import type { Prisma, User } from "~/generated/prisma/client"
import { TRPCError } from "@trpc/server"
import type { Tid } from "~/helper/zodTypes"
import { prisma } from "~/server/db"

export const verifyAllCategories = async (categories: Tid[]) => {
  const results = await Promise.all(
    categories.map(async (categoryId) => {
      return prisma.category.findUniqueOrThrow({
        where: {
          id: categoryId,
        },
      })
    })
  )
  return results
}

/**
 * @returns the sum of reserved (not yet booked) group-order buys of a user
 */
export const getReservedAmount = async (db: Prisma.TransactionClient, userId: Tid) => {
  const result = await db.transaction.aggregate({
    where: { userId, type: 4, canceled: false },
    _sum: { totalAmount: true },
  })
  return result._sum.totalAmount ?? 0
}

export const checkAccountBacking = (user: User, requiredBacking: number) => {
  if (user.balance < requiredBacking && !user.allowOverdraw) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Your account hasn't enough credit",
    })
  }
}
