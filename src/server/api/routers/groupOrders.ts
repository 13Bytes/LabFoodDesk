import { z } from "zod"
import { Tid, id } from "~/helper/zodTypes"

import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { validationSchema as groupOrderValidationSchema } from "~/components/Forms/AddGrouporderForm"
import { validationSchema as groupOrderTemplateValidationSchema } from "~/components/Forms/AddGrouporderTemplateForm"
import dayjs from "dayjs"
import { checkAccountBacking, verifyAllCategories } from "~/server/helper/dbCallHelper"
import { TRPCError } from "@trpc/server"
import { itemRouter } from "./items"
import { type ProcurementItem, Prisma } from "@prisma/client"
import { splitSubmitSchema } from "~/components/FormElements/GroupOrderSplit"
import { group } from "console"
import { calculateAdditionalItemPricing, calculateAdditionalPricing } from "~/helper/dataProcessing"

const pageSize = 20
export const grouporderRouter = createTRPCRouter({
  getRelevant: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrder.findMany({
      where: {
        status: 0,
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
        status: 5, // incomming orders closed
      },
      orderBy: {
        ordersCloseAt: "asc",
      },
      include: {
        orders: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { item: true } },
          },
        },
        procurementWishes: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { categories: true } },
          },
        },
      },
    })
    return result
  }),

  getLatelyClosed: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrder.findMany({
      where: {
        status: { gt: 5 }, // closed, aborted, ...
        ordersClosedAt: {
          gte: dayjs().subtract(21, "days").toDate(),
        },
      },
      orderBy: {
        ordersCloseAt: "desc",
      },
      include: {
        orders: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { item: true, categories: true } },
            procurementItems: { include: { item: { include: { categories: true } } } },
          },
        },
        procurementWishes: { include: { user: { select: { id: true, name: true } }, items: true } },
        closedBy: { select: { id: true, name: true } },
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

    const payload = {
      name: input.name,
      ordersCloseAt: input.ordersCloseAt,
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
              user: { connect: { id: ctx.session.user.id } },
              items: { connect: [{ id: item.id }] },
              groupOrder: { connect: { id: group.id } },
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

  close: adminProcedure
    .input(z.object({ split: splitSubmitSchema, groupId: id }))
    .mutation(async ({ ctx, input }) => {
      const split = input.split
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
        include: {
          orders: true,
          procurementWishes: { include: { items: { include: { categories: true } } } },
        },
      })
      if (group.status !== 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Orders are not closed yet / or already have been closed",
        })
      }

      const userProcurementWishes: { [key: Tid]: typeof group.procurementWishes } = {}

      const transactions: Prisma.TransactionCreateInput[] = []
      for (const wish of group.procurementWishes) {
        const splitIndex = split.findIndex((split) => split.user === wish.userId)
        if (splitIndex !== -1) {
          const userSplitSection = split[splitIndex]
          const userProcBilling = userSplitSection?.procurementWishs.find(
            (procWish) => procWish.id === wish.id
          )
          if (userProcBilling !== undefined) {
            let totalAmount = 0
            const billingItems = [...userProcBilling.items] // remove elements from this array to check if all items are billed
            const itemPriceMap: { itemId: Tid; price: number }[] = []
            for (const dbItem of wish.items) {
              const itemIndex = billingItems.findIndex((item) => item.id === dbItem.id)
              if (itemIndex === -1) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message:
                    "Item missing at billing! (Seems like a bad internal Error, or a malicious attempt)",
                })
              }
              const item = billingItems[itemIndex]!
              totalAmount += item.price + calculateAdditionalPricing(item.price, dbItem.categories)
              itemPriceMap.push({ itemId: dbItem.id, price: item.price })
              billingItems.splice(itemIndex, 1)
            }
            transactions.push({
              user: { connect: { id: wish.userId } },
              procurementItems: {
                create: itemPriceMap.map((item) => ({
                  item: { connect: { id: item.itemId } },
                  cost: item.price,
                })),
              },
              groupOrder: { connect: { id: group.id } },
              type: 0,
              totalAmount: totalAmount,
            })

            continue
          }
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "User missing at billing! (Seems like a bad internal Error, or a malicious attempt)",
        })
      }

      await prisma.$transaction([
        ...transactions.map((transaction) => prisma.transaction.create({ data: transaction })),
        prisma.groupOrder.update({
          where: { id: group.id },
          data: { status: 6, closedBy: { connect: { id: ctx.session.user.id } } },
        }),
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
