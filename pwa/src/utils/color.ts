export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim()
  const safeAlpha = Math.max(0, Math.min(1, alpha))

  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(0, 0, 0, ${safeAlpha})`
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return `rgba(0, 0, 0, ${safeAlpha})`
  }

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`
}

export function blendHex(from: string, to: string, ratio: number): string {
  const parse = (hex: string) => {
    const cleaned = hex.replace("#", "").trim()
    if (cleaned.length !== 6) return [0, 0, 0]
    return [
      Number.parseInt(cleaned.slice(0, 2), 16),
      Number.parseInt(cleaned.slice(2, 4), 16),
      Number.parseInt(cleaned.slice(4, 6), 16),
    ]
  }

  const [fromRed, fromGreen, fromBlue] = parse(from)
  const [toRed, toGreen, toBlue] = parse(to)
  const mix = (start: number, end: number) => Math.round(start + (end - start) * ratio)
  const toChannel = (value: number) => value.toString(16).padStart(2, "0")

  return `#${toChannel(mix(fromRed, toRed))}${toChannel(mix(fromGreen, toGreen))}${toChannel(mix(fromBlue, toBlue))}`
}
