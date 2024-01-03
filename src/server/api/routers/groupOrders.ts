import { z } from "zod"
import { id } from "~/helper/zodTypes"

import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { validationSchema as groupOrderValidationSchema } from "~/components/General/AddGrouporderForm"
import { validationSchema as groupOrderTemplateValidationSchema } from "~/components/General/AddGrouporderTemplateForm"
import dayjs from "dayjs"
import { checkAccountBacking, verifyAllCategories } from "~/server/helper/dbCallHelper"
import { TRPCError } from "@trpc/server"
import { itemRouter } from "./items"
import { ProcurementItem } from "@prisma/client"

const pageSize = 20
export const grouporderRouter = createTRPCRouter({
  getRelevant: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrder.findMany({
      where: {
        ordersCloseAt: {
          gte: dayjs().subtract(2, "days").toDate(),
          lte: dayjs().add(14, "days").toDate(),
        },
        ordersClosedAt: null,
      },
      orderBy: {
        ordersCloseAt: "asc",
      },
      include: {
        orders: { include: { user: { select: { id: true, name: true } } } },
        procurementWishes: { include: { user: { select: { id: true, name: true } } } },
      },
    })
    return result
  }),

  getInProgress: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrder.findMany({
      where: {
        ordersClosedAt: { gte: dayjs().subtract(2, "days").toDate() },
        status: 5, // incomming orders closed
      },
      orderBy: {
        ordersCloseAt: "asc",
      },
      include: {
        orders: { include: { user: { select: { id: true, name: true } }, item: true } },
        procurementWishes: { include: { user: { select: { id: true, name: true } }, items: true } },
      },
    })
    return result
  }),

  getAll: protectedProcedure
    .input(
      z.object({
        cursor: z.number().min(1).optional().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.cursor ?? 1
      const items = await ctx.prisma.groupOrder.findMany({
        take: pageSize + 1, // get an extra item at the end which we'll use as next cursor
        skip: (page - 1) * pageSize,
        orderBy: {
          ordersCloseAt: "desc",
        },
        include: { orders: { include: { user: { select: { id: true, name: true } } } } },
      })
      // Last element is to check if list extends past current page
      const nextPageExists = items.length > pageSize
      if (nextPageExists) {
        items.pop()
      }

      return {
        items,
        pageNumber: page,
        nextPageExists,
      }
    }),

  create: adminProcedure.input(groupOrderValidationSchema).mutation(async ({ ctx, input }) => {
    let groupOrderTemplate = null
    if (input.groupOrderTemplate) {
      groupOrderTemplate = await prisma.groupOrderTemplate.findUniqueOrThrow({
        where: {
          id: input.groupOrderTemplate,
        },
      })
    }
    const categories = await verifyAllCategories(input.categories)

    const payload = {
      name: input.name,
      ordersCloseAt: input.ordersCloseAt,
      categories: { connect: categories.map((c) => ({ id: c.id })) || [] },
    }
    const item = await prisma.groupOrder.create({
      data: !!groupOrderTemplate
        ? { ...payload, GroupOrderTemplate: { connect: { id: groupOrderTemplate.id } } }
        : payload,
    })
    return item
  }),

  buyGroupOrderItem: protectedProcedure
    .input(
      z.object({
        groupId: id,
        items: z.array(id),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
      })
      const items = await Promise.all(
        input.items.map((item) => ctx.prisma.item.findUniqueOrThrow({ where: { id: item } }))
      )
      const totalPrice = items.reduce((acc, item) => acc + item.price, 0)
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })
      await checkAccountBacking(user, totalPrice)

      await prisma.$transaction([
        ...items.map((item) =>
          prisma.transaction.create({
            data: {
              quantity: 1,
              user: { connect: { id: ctx.session.user.id } },
              item: { connect: { id: item.id } },
              GroupOrder: { connect: { id: group.id } },
              type: 0,
              totalAmount: item.price,
            },
          })
        ),
        prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: totalPrice } },
        }),
      ])
    }),

  procureGroupOrderItem: protectedProcedure
    .input(
      z.object({
        groupId: id,
        items: z.array(id),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
      })
      const items = await Promise.all(
        input.items.map((item) =>
          ctx.prisma.procurementItem.findUniqueOrThrow({ where: { id: item } })
        )
      )

      const requiredBacking = items.length * 5 // secure 5€ per item
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })
      await checkAccountBacking(user, requiredBacking)

      const procWish = await prisma.procurementWish.create({
        data: {
          user: { connect: { id: ctx.session.user.id } },
          GroupOrder: { connect: { id: group.id } },
          items: { connect: items.map((itm) => ({ id: itm.id })) },
        },
      })
      return procWish
    }),

  stopOrders: adminProcedure.input(z.object({ groupId: id })).mutation(async ({ ctx, input }) => {
    const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
      where: { id: input.groupId },
      include: { orders: true, procurementWishes: { include: { items: true } } },
    })
    if (group.ordersClosedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Orders are already closed" })
    }

    const updatedGroup = await prisma.groupOrder.update({
      where: { id: group.id },
      data: { ordersClosedAt: { set: new Date() }, status: 5 },
    })
    return updatedGroup
  }),

  close: adminProcedure.input(z.object({ groupId: id })).mutation(async ({ ctx, input }) => {
    const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
      where: { id: input.groupId },
      include: { orders: true, procurementWishes: { include: { items: true } } },
    })

    type extendedProcurementWish = (typeof group.procurementWishes)[number] & {
      item: ProcurementItem
    }
    const transcationDrafts: extendedProcurementWish[] = []
    for (const wish of group.procurementWishes) {
      for (const item of wish.items) {
        transcationDrafts.push({ ...wish, item: item })
      }
    }

    // atomic action:
    await prisma.$transaction([
      ...transcationDrafts.map((wish) =>
        prisma.transaction.create({
          data: {
            quantity: 1,
            user: { connect: { id: wish.userId } },
            item: { connect: { id: wish.item.id } },
            GroupOrder: { connect: { id: group.id } },
            type: 0,
            totalAmount: 424242424242, // TODO: calculate price from inserted price
          },
        })
      ),
    ])
  }),

  getAllTemplates: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrderTemplate.findMany({ where: { active: true } })
    return result
  }),

  createTemplate: adminProcedure
    .input(groupOrderTemplateValidationSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.groupOrderTemplate.create({
        data: {
          name: input.name,
          weekday: input.weekday,
          repeatWeeks: input.repeatWeeks,
          ordersCloseAt: input.ordersCloseAt,
          active: true,
        },
      })
      return item
    }),
})
