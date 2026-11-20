import { type Prisma } from "~/generated/prisma/client"
import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { splitSubmitSchema } from "~/components/FormElements/GroupOrderSplit"
import { validationSchema as groupOrderValidationSchema } from "~/components/Forms/GrouporderForm"
import { validationSchema as groupOrderTemplateValidationSchema } from "~/components/Forms/GrouporderTemplateForm"
import { env } from "~/env.mjs"
import { calculateFeesPerCategory, categoryFeesAsMarkups, timeToDate } from "~/helper/dataProcessing"
import { type Tid, id } from "~/helper/zodTypes"
import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { checkAccountBacking, getReservedAmount } from "~/server/helper/dbCallHelper"
import { buyItem } from "./items"
import { BILLING_TOLERANCE, ITEM_SECURITY_DEPOSIT } from "~/helper/globalTypes"
import { canRevertGroupOrder } from "~/helper/generalFunctions"

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
        shopper: { select: { id: true, name: true } },
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
        closedBy: { select: { id: true, name: true } },
        revertedBy: { select: { id: true, name: true } },
        shopper: { select: { id: true, name: true } },
        orders: {
          include: {
            user: { select: { id: true, name: true } },
            items: { include: { item: true } },
            categoryFees: true,
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
        revertedBy: { select: { id: true, name: true } },
        shopper: { select: { id: true, name: true } },
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

  create: adminProcedure.input(groupOrderValidationSchema).mutation(async ({ input }) => {
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
        ? {
            ...payload,
            GroupOrderTemplate: { connect: { id: groupOrderTemplate.id } },
            filterCategory: groupOrderTemplate.defaultCategoryId
              ? { connect: { id: groupOrderTemplate.defaultCategoryId } }
              : undefined,
          }
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
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // checks (in the same transaction) that the group order is still open
      await buyItem(ctx.prisma, input.item, ctx.session.user.id, input.groupId, input.quantity)
    }),

  undoBuyGroupOrderItem: protectedProcedure
    .input(
      z.object({
        transactionId: id,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUniqueOrThrow({
          where: {
            id: input.transactionId,
            userId: ctx.session.user.id,
          },
          include: { groupOrder: true },
        })
        if (transaction.type !== 4 || transaction.groupOrder?.status !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
        }
        // nothing has been booked yet (see buyItem) - so just remove the reservation
        await tx.itemCategoryMapping.deleteMany({ where: { transactionId: transaction.id } })
        await tx.transactionCategoryFee.deleteMany({ where: { transactionId: transaction.id } })
        await tx.transaction.delete({ where: { id: transaction.id } })
      })
    }),

  procureGroupOrderItem: protectedProcedure
    .input(
      z.object({
        groupId: id,
        items: z.array(id),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
      })
      if (group.status !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
      }
      const items = await Promise.all(
        input.items.map((item) =>
          ctx.prisma.procurementItem.findUniqueOrThrow({ where: { id: item } }),
        ),
      )

      const requiredBacking = items.length * input.quantity * ITEM_SECURITY_DEPOSIT // secure x€ per item
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } })

      if (env.DISABLE_PROCUREMENT_ACCOUNT_BACKING_CHECK !== "true") {
        checkAccountBacking(user, requiredBacking + (await getReservedAmount(ctx.prisma, user.id)))
      }

      return ctx.prisma.$transaction(async (tx) => {
        // claim the group order row first, so it can't be closed between the check and the wishes (see buyItem)
        const openGroup = await tx.groupOrder.updateMany({
          where: { id: group.id, status: 0 },
          data: { status: 0 },
        })
        if (openGroup.count === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
        }
        // one wish per piece, as a wish can contain every item only once
        const procWishes = []
        for (let i = 0; i < input.quantity; i++) {
          procWishes.push(
            await tx.procurementWish.create({
              data: {
                user: { connect: { id: ctx.session.user.id } },
                GroupOrder: { connect: { id: group.id } },
                items: { connect: items.map((itm) => ({ id: itm.id })) },
              },
            }),
          )
        }
        return procWishes
      })
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

  /**
   * Announce to go shopping (overwrites a previous shopper) - or step back as shopper
   */
  setShopper: protectedProcedure
    .input(z.object({ groupId: id, goShopping: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({ where: { id: input.groupId } })
      if (group.status !== 0 || group.ordersClosedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orders are already closed" })
      }
      if (!input.goShopping && group.shopperId !== ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are not the shopper of this group order" })
      }
      return ctx.prisma.groupOrder.update({
        where: { id: group.id },
        data: {
          shopper: input.goShopping
            ? { connect: { id: ctx.session.user.id } }
            : { disconnect: true },
        },
      })
    }),

  /**
   * Only show items of one category when ordering - set by admins or the shopper
   */
  setFilterCategory: protectedProcedure
    .input(z.object({ groupId: id, categoryId: id.nullable() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({ where: { id: input.groupId } })
      if (group.status !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Group Order is already closed" })
      }
      if (!ctx.session.user.is_admin && group.shopperId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins or the shopper can set the category" })
      }
      return ctx.prisma.groupOrder.update({
        where: { id: group.id },
        data: {
          filterCategory: input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true },
        },
      })
    }),

  stopOrders: protectedProcedure.input(z.object({ groupId: id })).mutation(async ({ ctx, input }) => {
    const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
      where: { id: input.groupId },
      include: { orders: true, procurementWishes: { include: { items: true } } },
    })
    if (group.ordersClosedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Orders are already closed" })
    }

    const updatedGroup = await prisma.groupOrder.update({
      where: { id: group.id },
      data: {
        ordersClosedAt: { set: new Date() },
        status: 5,
        // whoever stops the orders goes shopping - if nobody announced it before
        ...(group.shopperId ? {} : { shopper: { connect: { id: ctx.session.user.id } } }),
      },
    })
    return updatedGroup
  }),

  /**
   * Close group order and create transactions
   */
  close: protectedProcedure
    .input(
      z.object({
        split: splitSubmitSchema,
        groupId: id,
        destination: id,
        // adjusted prices (without fees) of reserved single-item buys, e.g. if there was an offer
        itemBuyPrices: z.array(z.object({ id, price: z.number().min(0) })).default([]),
        // total the shopper paid (without fees) - all billed prices together have to match it
        expectedTotal: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const split = input.split
      const group = await ctx.prisma.groupOrder.findUniqueOrThrow({
        where: { id: input.groupId },
        include: {
          orders: { include: { categoryFees: true } },
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
      // reserved single-item buys (type 4) are booked now - their price goes to the destination-user
      const pendingItemBuys = group.orders
        .filter((order) => order.type === 4 && !order.canceled)
        .map((order) => {
          const price =
            input.itemBuyPrices.find((itemBuy) => itemBuy.id === order.id)?.price ??
            order.amountWithoutFees ??
            0
          // markups as they were on the reservation - revertClosed uses the same
          const fees = calculateFeesPerCategory(price, categoryFeesAsMarkups(order.categoryFees))
          if (fees.categories.some((cat) => cat.charges !== 0 && !cat.clearingAccountId)) {
            throw new TRPCError({
              code: "METHOD_NOT_SUPPORTED",
              message: "Category has no clearing-account set - please contact an admin and let them fix it",
            })
          }
          return { order, price, fees, totalAmount: price + fees.total }
        })
      if (
        input.itemBuyPrices.some(
          (itemBuy) => !pendingItemBuys.some((pending) => pending.order.id === itemBuy.id),
        )
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Item buy is not part of this group order" })
      }
      for (const pending of pendingItemBuys) {
        creditOfDest += pending.price
      }
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
      if (Math.abs(creditOfDest - input.expectedTotal) > BILLING_TOLERANCE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Billed prices (${creditOfDest.toFixed(2)}€) don't match the total amount (${input.expectedTotal.toFixed(2)}€)`,
        })
      }

      await ctx.prisma.$transaction(async (tx) => {
        // only one close can book the group order - a second (parallel) one finds no status 5 anymore
        const locked = await tx.groupOrder.updateMany({
          where: { id: group.id, status: 5 },
          data: { status: 6 },
        })
        if (locked.count === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group order has already been closed" })
        }
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
        // book reserved single-item buys
        for (const { order, price, fees, totalAmount } of pendingItemBuys) {
          await tx.transaction.update({
            where: { id: order.id },
            data: { type: 0, amountWithoutFees: price, totalAmount },
          })
          await tx.user.update({
            where: { id: order.userId },
            data: { balance: { decrement: totalAmount } },
          })
          for (const cat of fees.categories) {
            if (cat.clearingAccountId && cat.charges !== 0) {
              await tx.clearingAccount.update({
                where: { id: cat.clearingAccountId },
                data: { balance: { increment: cat.charges } },
              })
            }
          }
        }
        // add money to clearing-account
        for (const cat of allCategorieFees) {
          if (cat.charges !== 0) {
            if (!cat.balanceAccountId) {
              throw new TRPCError({
                code: "METHOD_NOT_SUPPORTED",
                message: "Category has no clearing-account set - please contact an admin and let them fix it",
              })
            }
            await tx.clearingAccount.update({
              where: { id: cat.balanceAccountId },
              data: { balance: { increment: cat.charges } },
            })
          }
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
          data: {
            status: 6,
            closedBy: { connect: { id: ctx.session.user.id } },
            // the user who paid is the one who went shopping
            shopper: { connect: { id: destinationUser.id } },
          },
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
          orders: { include: { procurementItems: { include: { item: { include: { categories: { include: { markupDestination: true } } } } } }, items: true, categoryFees: true, clearingAccount: true } },
          procurementWishes: { include: { items: { include: { categories: true } } } },
        },
      })

      if (group.status !== 6) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Orders are not closed yet - can't revert!",
        })
      }
      const compensation = group.orders.find((order) => order.type === 3 && !order.canceled)
      if (!canRevertGroupOrder(ctx.session.user, group.closedById, compensation?.createdAt)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins or the user who closed the group order (within 2h) can revert it",
        })
      }

      if (group.orders.filter(order => order.type === 3).filter(order => order.canceled === false).length > 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GroupOrder should have only one (or zero) compensation transaction!",
        })
      }

      await ctx.prisma.$transaction(async (tx) => {
        // only one revert can run - a second (parallel) one finds no status 6 anymore
        const locked = await tx.groupOrder.updateMany({
          where: { id: group.id, status: 6 },
          data: { status: 5 },
        })
        if (locked.count === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group order has already been reverted" })
        }

        for (const transaction of group.orders) {
          if (transaction.canceled) {
            continue
          }
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
                // like on close: fees of 0 were not booked
                if (catFee.charges === 0) {
                  continue
                }
                await tx.clearingAccount.update({
                  where: { id: catFee.clearingAccountId },
                  data: { balance: { decrement: catFee.charges } },
                })
              }
            }
            // undo user-transactions
            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                canceled: true,
                canceledBy: { connect: { id: ctx.session.user.id } },
                canceledDate: new Date(),
                note: transaction.note + "(grouporder reverted)"
              },
            })
            // revert user-balance
            await tx.user.update({
              where: { id: transaction.userId },
              data: { balance: { increment: transaction.totalAmount } },
            })
          }
          else if (transaction.type === 0 && transaction.items.length > 0) {
            // single-item buy: refund and reserve it again (type 4) - it is booked again on the next close
            // fees based on the booked price (may have been adjusted on close)
            const fees = calculateFeesPerCategory(
              transaction.amountWithoutFees ?? 0,
              categoryFeesAsMarkups(transaction.categoryFees),
            )
            for (const cat of fees.categories) {
              if (cat.clearingAccountId && cat.charges !== 0) {
                await tx.clearingAccount.update({
                  where: { id: cat.clearingAccountId },
                  data: { balance: { decrement: cat.charges } },
                })
              }
            }
            // buys from before the deferred booking credited the item price to the clearing-account
            if (transaction.clearingAccountId) {
              await tx.clearingAccount.update({
                where: { id: transaction.clearingAccountId },
                data: { balance: { decrement: transaction.amountWithoutFees ?? 0 } },
              })
            }
            await tx.transaction.update({
              where: { id: transaction.id },
              data: { type: 4, clearingAccount: { disconnect: true } },
            })
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
                canceledBy: { connect: { id: ctx.session.user.id } },
                canceledDate: new Date(),
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
    const result = await ctx.prisma.groupOrderTemplate.findMany({
      where: { active: true },
      include: { defaultCategory: { select: { name: true } } },
      orderBy: [{ weekday: "asc" }, { ordersCloseAt: "asc" }],
    })
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
    .mutation(async ({ input }) => {
      const item = await prisma.groupOrderTemplate.create({
        data: {
          name: input.name,
          weekday: input.weekday,
          ordersCloseAt: timeToDate(input.ordersCloseAt_h, input.ordersCloseAt_min),
          ordersStartsAt: input.ordersStartsAt,
          defaultCategoryId: input.defaultCategoryId ?? null,
          active: true,
        },
      })
      return item
    }),

  updateTemplate: adminProcedure
    .input(groupOrderTemplateValidationSchema.extend({ id }))
    .mutation(async ({ input }) => {
      const { id, ordersCloseAt_h, ordersCloseAt_min, ...inputWithoutID } = input
      const item = await prisma.groupOrderTemplate.update({
        where: { id: id },
        data: {
          ...inputWithoutID,
          defaultCategoryId: inputWithoutID.defaultCategoryId ?? null,
          ordersCloseAt: timeToDate(ordersCloseAt_h, ordersCloseAt_min),
        },
      })
      return item
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id }))
    .mutation(async ({ input }) => {
      await prisma.groupOrderTemplate.delete({
        where: { id: input.id },
      })
    }),
})
