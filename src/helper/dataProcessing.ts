import type { Category, Item } from "@prisma/client"


export const calculateAdditionalPricing = (price: number, categories: Category[]) => {
    let sum = 0
    for (const category of categories) {
        const fixed = category.markupFixed ?? 0
        const procentual = (price * (category.markupPercentage ?? 0)) / 100
        sum += fixed + procentual
    }
    return sum
}

export const calculateAdditionalItemPricing = (item: Item, categories: Category[]) => {
  return calculateAdditionalPricing(item.price, categories)
}