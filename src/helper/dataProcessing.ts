import type { Category, Item, ProcurementItem } from "@prisma/client"
import { Tid } from "./zodTypes"
import { RouterOutputs } from "~/utils/api"

/**
 * Returns all fees for a given price and categories
 * total as well as per category
 */
export const calculateFeesPerCategory = (price: number, categories: Category[]) => {
  const fees: {
    categories: { categoryId: Tid; charges: number; clearingAccountId?: Tid }[]
    total: number
  } = {
    categories: [],
    total: 0,
  }
  for (const category of categories) {
    const fixed = category.markupFixed ?? 0
    const procentual = (price * (category.markupPercentage ?? 0)) / 100
    fees.total += fixed + procentual
    fees.categories.push({
      categoryId: category.id,
      charges: fixed + procentual,
      clearingAccountId: category.markupDestinationId ?? undefined,
    })
  }
  return fees
}

export const calculateAdditionalPricing = (price: number, categories: Category[]) => {
  return calculateFeesPerCategory(price, categories).total
}

/**
 * @returns the total fees (without item cost itself)
 */
export const calculateAdditionalItemPricing = (item: Item, categories: Category[]) => {
  return calculateAdditionalPricing(item.price, categories)
}

type TransactionData = RouterOutputs["transaction"]["getMineInfinite"]["items"][0]

/**
 * @returns the total fees of a list of items (without item costs itself)
 */
export const getItemsFee = (
  items: TransactionData["items"] = [],
  procurementItems: TransactionData["procurementItems"] = [],
) => {
  let fees = 0
  for (const item of items) {
    fees += calculateAdditionalItemPricing(item.item, item.item.categories)
  }
  for (const procItem of procurementItems) {
    procItem.cost
    fees += calculateAdditionalPricing(procItem.cost, procItem.item.categories)
  }
  return fees
}

/**
 * @returns the total fees of all the items in a transaction (without item costs itself)
 */
export const getTransactionFees = (transaction: TransactionData) => {
  return getItemsFee(transaction.items, transaction.procurementItems)
}

export const getTimeFromDateString = (h: number, min: number) => {
  const hOut = h >= 10 ? h : "0" + h
  const minOut = min >= 10 ? min : "0" + min
  return hOut + ":" + minOut
}

export const timeToDate = (h: number, min: number) => {
  const date = new Date(Date.now())
  date.setHours(h)
  date.setMinutes(min)
  return date
}