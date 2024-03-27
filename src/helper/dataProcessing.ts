import type { Category, Item } from "@prisma/client"
import { Tid } from "./zodTypes"

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

export const calculateAdditionalItemPricing = (item: Item, categories: Category[]) => {
  return calculateAdditionalPricing(item.price, categories)
}
