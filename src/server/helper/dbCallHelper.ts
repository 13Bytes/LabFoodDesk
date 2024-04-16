import type { User } from "@prisma/client"
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

export const checkAccountBacking = (user: User, requiredBacking: number) => {
  if (user.balance < requiredBacking && !user.allowOverdraw) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Your account hasn't enough credit",
    })
  }
}
