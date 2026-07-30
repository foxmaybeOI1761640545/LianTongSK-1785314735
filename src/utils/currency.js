const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  return currency.format(Number(value) || 0)
}

export function formatCompactCurrency(value) {
  const amount = Number(value) || 0
  if (Math.abs(amount) >= 10000) return `¥${(amount / 10000).toFixed(1)}万`
  return currency.format(amount)
}
