export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }
  return 0
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

