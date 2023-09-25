import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { itemRouter } from "./routers/items";
import { userRouter } from "./routers/user";
import { transactionRouter } from "./routers/transactions";
import { categoryRouter } from "./routers/categories";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  item: itemRouter,
  user: userRouter,
  transaction: transactionRouter,
  category: categoryRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
