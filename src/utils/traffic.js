const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 100 ? 0 : decimals)} ${UNITS[index]}`
}

export function trafficDifferencePercent(leftBytes, rightBytes) {
  const baseline = Math.max(leftBytes, rightBytes, 1)
  return (Math.abs(leftBytes - rightBytes) / baseline) * 100
}
