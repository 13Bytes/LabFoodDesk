import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure
} from "~/server/api/trpc";

// export const stockRouter = createTRPCRouter({

//   getAll: publicProcedure.query(({ ctx }) => {
//     return ctx.prisma.item.findMany();
//   }),

//   getSecretMessage: protectedProcedure.query(() => {
//     return "you can now see a proteted item";
//   }),
// });
export const itemRouter = createTRPCRouter({
  getAll: adminProcedure.query(({ ctx }) => {
    return ctx.prisma.item.findMany();
  }),
});
