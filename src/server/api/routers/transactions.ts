import { z } from "zod"

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc"

const pageSize = 30
export const transactionRouter = createTRPCRouter({
  getMineLatest: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId: ctx.session.user.id },
    })
  }),
  // getMine: protectedProcedure
  // .input(z.object({ page: z.number().optional().default(1).or(z.number().positive())}))
  //   .query(async ({ ctx, input }) => {
  //     return ctx.prisma.transaction.findMany({
  //       orderBy: { createdAt: "desc" },
  //       take: pageSize,
  //       skip: input.page * pageSize,
  //       where: { userId: ctx.session.user.id },
  //     })
  //   }),
  getInfinite: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1
      const items = await ctx.prisma.transaction.findMany({
        take: pageSize, // get an extra item at the end which we'll use as next cursor
        where: { userId: ctx.session.user.id },
        skip: (page - 1) * pageSize,
        orderBy: {
          createdAt: "desc",
        },
      })
      return {
        items,
        pageNumber: page,
      }
    }),
  // getInfinite: protectedProcedure
  //   .input(
  //     z.object({
  //       limit: z.number().min(1).max(100).nullish(),
  //       cursor: z.number().nullish(), // <-- "cursor" needs to exist, but can be any type
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const { cursor, limit:input_limit } = input;
  //     const limit = input_limit ?? 50;

  //     const items = await ctx.prisma.transaction.findMany({
  //       take: limit + 1, // get an extra item at the end which we'll use as next cursor
  //       where: { userId: ctx.session.user.id },
  //       cursor: cursor
  //         ? {
  //             id: cursor,
  //           }
  //         : undefined,
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //     });

  //     let nextCursor: typeof cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop();
  //       nextCursor = nextItem!.id;
  //     }
  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),
})
