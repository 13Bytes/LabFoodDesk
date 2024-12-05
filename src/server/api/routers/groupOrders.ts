import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { splitSubmitSchema } from "~/components/FormElements/GroupOrderSplit"
import { validationSchema as groupOrderValidationSchema } from "~/components/Forms/GrouporderForm"
import { validationSchema as groupOrderTemplateValidationSchema } from "~/components/Forms/GrouporderTemplateForm"
import { env } from "~/env.mjs"
import { calculateFeesPerCategory, timeToDate } from "~/helper/dataProcessing"
import { Tid, id } from "~/helper/zodTypes"
import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { checkAccountBacking } from "~/server/helper/dbCallHelper"
import { buyOneItem } from "./items"

const pageSize = 20
export const grouporderRouter = createTRPCRouter({
  getRelevant: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrder.findMany({
      where: {
        status: 0,
        ordersCloseAt: {
          lte: dayjs().add(14, "days").toDate(),
        },
        ordersClosedAt: null,
      },
      orderBy: {
        ordersCloseAt: "asc",
      },
      include: {
        orders: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { item: true } }
          }
        },
        procurementWishes: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { categories: true } }
          }
        },
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

  get: protectedProcedure
    .input(z.object({ id }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: {
          id: input.id,
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
            moneyDestination: { select: { id: true, name: true } },
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
      }),
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

  update: adminProcedure.input(groupOrderValidationSchema.extend({ id })).mutation(async ({ ctx, input }) => {
    const groupOrder = await ctx.prisma.groupOrder.findUniqueOrThrow({ where: { id: input.id } })
    if (groupOrder.status !== 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
    }
    const payload = {
      name: input.name,
      ordersCloseAt: input.ordersCloseAt,
    }
    const item = await prisma.groupOrder.update({ data: payload, where: { id: input.id } })
    return item
  }),

  delete: adminProcedure
    .input(z.object({ id }))
    .mutation(async ({ ctx, input }) => {

      await ctx.prisma.$transaction(async (tx) => {

        const groupOrder = await tx.groupOrder.findUniqueOrThrow({ where: { id: input.id }, include: { orders: true } })
        if (groupOrder.status !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
        }
        if (groupOrder.orders.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order already has orders" })
        }
        await tx.groupOrder.update({ where: { id: input.id }, data: { status: 99 } })
      })
    }),

  buyGroupOrderItem: protectedProcedure
    .input(
      z.object({
        groupId: id,
        item: id,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
      })
      await buyOneItem(ctx.prisma, input.item, ctx.session.user.id, group.id)
    }),

  procureGroupOrderItem: protectedProcedure
    .input(
      z.object({
        groupId: id,
        items: z.array(id),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
      })
      const items = await Promise.all(
        input.items.map((item) =>
          ctx.prisma.procurementItem.findUniqueOrThrow({ where: { id: item } }),
        ),
      )

      const requiredBacking = items.length * 5 // secure 5€ per item
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })

      if (env.DISABLE_PROCUREMENT_ACCOUNT_BACKING_CHECK !== "true") {
        checkAccountBacking(user, requiredBacking)
      }

      const procWish = await prisma.procurementWish.create({
        data: {
          user: { connect: { id: ctx.session.user.id } },
          GroupOrder: { connect: { id: group.id } },
          items: { connect: items.map((itm) => ({ id: itm.id })) },
        },
      })
      return procWish
    }),

  undoProcureGroupOrderItem: protectedProcedure
    .input(
      z.object({
        procurementWishId: id,
      }),
    )
    .mutation(async ({ ctx, input }) => {

      await ctx.prisma.$transaction(async (tx) => {
        const pcWish = await tx.procurementWish.findUniqueOrThrow({
          where: {
            id: input.procurementWishId,
            userId: ctx.session.user.id
          },
          include: { GroupOrder: true }
        })
        if (pcWish.GroupOrder?.status !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
        }
        await tx.procurementWish.delete({
          where: {
            id: input.procurementWishId,
          }
        })
      })
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

  /**
   * Close group order and create transactions
   */
  close: protectedProcedure
    .input(
      z.object({ split: splitSubmitSchema, groupId: id, destination: id }),
    )
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

      const allCategorieFees: { catId: Tid; charges: number; balanceAccountId: Tid }[] = []
      const transactions: {
        transaction: Prisma.TransactionCreateInput
        totalAmountWithCat: number
      }[] = []
      let creditOfDest = 0
      for (const wish of group.procurementWishes) {
        const splitIndex = split.findIndex((split) => split.user === wish.userId)
        if (splitIndex !== -1) {
          const userSplitSection = split[splitIndex]
          const userProcBilling = userSplitSection?.procurementWishs.find(
            (procWish) => procWish.id === wish.id,
          )
          if (userProcBilling !== undefined) {
            let amountWithoutFees = 0
            let totalAmountWithCat = 0
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
              const categorieFees = calculateFeesPerCategory(item.price, dbItem.categories)
              for (const categorie of categorieFees.categories) {
                const catIndex = allCategorieFees.findIndex(
                  (fee) => fee.catId === categorie.categoryId,
                )
                if (catIndex === -1) {
                  allCategorieFees.push({
                    catId: categorie.categoryId,
                    charges: categorie.charges,
                    balanceAccountId:
                      dbItem.categories.find((cat) => cat.id === categorie.categoryId)
                        ?.markupDestinationId ?? "",
                  })
                } else {
                  allCategorieFees[catIndex]!.charges += categorie.charges
                }
              }
              creditOfDest += item.price
              amountWithoutFees += item.price
              totalAmountWithCat += item.price + categorieFees.total
              itemPriceMap.push({ itemId: dbItem.id, price: item.price })
              billingItems.splice(itemIndex, 1)
            }
            transactions.push({
              transaction: {
                user: { connect: { id: wish.userId } },
                procurementItems: {
                  create: itemPriceMap.map((item) => ({
                    item: { connect: { id: item.itemId } },
                    cost: item.price,
                  })),
                },
                groupOrder: { connect: { id: group.id } },
                type: 0,
                amountWithoutFees: amountWithoutFees,
                totalAmount: totalAmountWithCat,
              },
              totalAmountWithCat,
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

      await ctx.prisma.$transaction(async (tx) => {
        // create transactions and update user balances
        for (const transaction of transactions) {
          const finishedTransaction = await tx.transaction.create({ data: transaction.transaction })
          await tx.user.update({
            data: {
              balance: {
                decrement: transaction.totalAmountWithCat,
              },
            },
            where: {
              id: finishedTransaction.userId,
            },
          })
        }
        // add money to clearing-account
        for (const cat of allCategorieFees) {
          await tx.clearingAccount.update({
            where: { id: cat.balanceAccountId },
            data: { balance: { increment: cat.charges } },
          })
        }

        const destinationUser = await ctx.prisma.user.findUniqueOrThrow({
          where: { id: input.destination },
        })
        // Compensate destination-user
        await tx.transaction.create({
          data: {
            user: { connect: { id: ctx.session.user.id } },
            moneyDestination: { connect: { id: destinationUser.id } },
            groupOrder: { connect: { id: group.id } },
            type: 3,
            totalAmount: creditOfDest,
          },
        })
        await tx.user.update({
          data: {
            balance: {
              increment: creditOfDest,
            },
          },
          where: {
            id: destinationUser.id,
          },
        })
        // close group order (by setting status)
        await tx.groupOrder.update({
          where: { id: group.id },
          data: { status: 6, closedBy: { connect: { id: ctx.session.user.id } } },
        })
      })
    }),

  /**
 * Revert the transactions of a closed group
 */
  revertClosed: protectedProcedure
    .input(
      z.object({ groupId: id }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
        include: {
          orders: { include: { procurementItems: { include: { item: { include: { categories: { include: { markupDestination: true } } } } } }, items: true, clearingAccount: true } },
          procurementWishes: { include: { items: { include: { categories: true } } } },
        },
      })

      if (group.status !== 6) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Orders are not closed yet - can't revert!",
        })
      }

      if ((group.orders.filter(order => order.type === 3)).length > 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GroupOrder should have only one (or zero) compensation transaction!",
        })
      }

      await ctx.prisma.$transaction(async (tx) => {

        for (const transaction of group.orders) {
          if (transaction.canceled) {
            continue
          }
          // Only undo procurement items; regular items should already be fulfilled
          if (transaction.type === 0 && transaction.procurementItems.length > 0) {
            if (transaction.items.length > 0) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Combined transactions are currently not supported - please contact an admin",
              })
            }

            // remove category fees from clearing accounts
            for (const procItem of transaction.procurementItems) {
              const feesPerCat = calculateFeesPerCategory(procItem.cost, procItem.item.categories)
              for (const catFee of feesPerCat.categories) {
                await tx.clearingAccount.update({
                  where: { id: catFee.clearingAccountId },
                  data: { balance: { decrement: catFee.charges } },
                })
              }
            }
            // undo user-transactions
            await tx.transaction.update({
              where: { id: transaction.id },
              data: { canceled: true, canceledBy: { connect: { id: ctx.session.user.id } }, note: transaction.note + "(grouporder reverted)" },
            })
            // revert user-balance
            await tx.user.update({
              where: { id: transaction.userId },
              data: { balance: { increment: transaction.totalAmount } },
            })
          }
          else if (transaction.type === 3) {
            // Undo compensation for destination-user
            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                canceled: true,
              },
            })
            await tx.user.update({
              where: { id: transaction.moneyDestinationUserId! },
              data: { balance: { decrement: transaction.totalAmount } },
            })
          }
        }

        // revert group order status
        await tx.groupOrder.update({
          where: { id: group.id },
          data: { status: 5, revertedBy: { connect: { id: ctx.session.user.id } } },
        })

      })
    }),

  getAllTemplates: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.groupOrderTemplate.findMany({ where: { active: true } })
    return result
  }),

  getTemplate: protectedProcedure
    .input(z.object({ id }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.prisma.groupOrderTemplate.findUniqueOrThrow({ where: { active: true, id: input.id } })
      const { ordersCloseAt, ...data } = result
      return { ordersCloseAt_h: ordersCloseAt.getHours(), ordersCloseAt_min: ordersCloseAt.getMinutes(), ...data }
    }),

  createTemplate: adminProcedure
    .input(groupOrderTemplateValidationSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.groupOrderTemplate.create({
        data: {
          name: input.name,
          weekday: input.weekday,
          ordersCloseAt: timeToDate(input.ordersCloseAt_h, input.ordersCloseAt_min),
          active: true,
        },
      })
      return item
    }),

  updateTemplate: adminProcedure
    .input(groupOrderTemplateValidationSchema.extend({ id }))
    .mutation(async ({ ctx, input }) => {
      const { id, ordersCloseAt_h, ordersCloseAt_min, ...inputWithoutID } = input
      const item = await prisma.groupOrderTemplate.update({
        where: { id: id },
        data: {
          ...inputWithoutID,
          ordersCloseAt: timeToDate(ordersCloseAt_h, input.ordersCloseAt_min),
        },
      })
      return item
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id }))
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.groupOrderTemplate.delete({
        where: { id: input.id },
      })
    }),
})
