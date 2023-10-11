import { createTRPCRouter } from "~/server/api/trpc"
import { categoryRouter } from "./routers/categories"
import { grouporderRouter } from "./routers/groupOrders"
import { itemRouter } from "./routers/items"
import { transactionRouter } from "./routers/transactions"
import { userRouter } from "./routers/user"

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  item: itemRouter,
  user: userRouter,
  transaction: transactionRouter,
  groupOrders: grouporderRouter,
  category: categoryRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
