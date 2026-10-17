export const getUsernameLetters = (name: string | undefined | null) => {
  if (name) {
    const nameSegments = name.trim().split(" ")

    let firstLetter = ""
    let secondLetter = ""
    if (nameSegments.length >= 1) {
      firstLetter = nameSegments[0]![0] || ""
    }
    if (nameSegments.length >= 2) {
      secondLetter = nameSegments[nameSegments.length - 1]![0] || ""
    }
    return (firstLetter + secondLetter).toUpperCase()
  }
  return "?"
}

export const toggleElementInArray = <T>(array: T[], value: T) => {
  if (array.includes(value)) {
    return array.filter((item) => item !== value)
  } else {
    return [...array, value]
  }
}

export function toFlatPropertyMap(obj: object, keySeparator = '.') {
  const flattenRecursive = (obj: object, parentProperty?: string, propertyMap: Record<string, unknown> = {}) => {
    for (const [key, value] of Object.entries(obj)) {
      const property = parentProperty ? `${parentProperty}${keySeparator}${key}` : key;
      if (value && typeof value === 'object' && value instanceof Date) {
        propertyMap[property] = value.toISOString();
      }
      else if (value && typeof value === 'object') {
        flattenRecursive(value, property, propertyMap);
      } else {
        propertyMap[property] = value;
      }
    }
    return propertyMap;
  };
  return flattenRecursive(obj);
}

export type SplitMode = "factor" | "percent" | "absolute"

/**
 * Calculates the effective share and the amount of each participant.
 * Shares that are `undefined` are calculated automatically:
 * factor -> 1, percent/absolute -> equal part of what's left of 100% / the total.
 * Invalid (NaN/negative) shares count as 0.
 */
export const calculateSplit = (total: number, shares: (number | undefined)[], mode: SplitMode) => {
  const cleanTotal = Number.isFinite(total) && total > 0 ? total : 0
  const fixedShares = shares.map((share) =>
    share === undefined ? undefined : Number.isFinite(share) && share > 0 ? share : 0
  )
  if (mode === "factor") {
    const factors = fixedShares.map((share) => share ?? 1)
    const factorSum = factors.reduce((sum, factor) => sum + factor, 0)
    return {
      shares: factors,
      amounts: factors.map((factor) => (factorSum > 0 ? (cleanTotal * factor) / factorSum : 0)),
    }
  }
  const target = mode === "percent" ? 100 : cleanTotal
  const fixedSum = fixedShares.reduce<number>((sum, share) => sum + (share ?? 0), 0)
  const autoCount = fixedShares.filter((share) => share === undefined).length
  const autoShare = autoCount > 0 ? (target - fixedSum) / autoCount : 0 // negative if fixed shares exceed the target
  const effectiveShares = fixedShares.map((share) => share ?? autoShare)
  return {
    shares: effectiveShares,
    amounts: mode === "percent" ? effectiveShares.map((share) => (cleanTotal * share) / 100) : effectiveShares,
  }
}
