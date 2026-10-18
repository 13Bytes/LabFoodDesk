import type { Category, Item } from "~/generated/prisma/client"
import { type Tid } from "./zodTypes"

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
