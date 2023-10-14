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
