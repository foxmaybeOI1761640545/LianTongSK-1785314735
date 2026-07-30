import { formatBytes } from './traffic.js'
import { formatCompactCurrency } from './currency.js'

export const DIRECTIONS = {
  ALL: 'ALL',
  GD_TO_HK: 'GD_TO_HK',
  HK_TO_GD: 'HK_TO_GD',
}

export function filterDailyRows(rows, filters) {
  const days = Number.parseInt(filters.range, 10) || 7
  const dates = [...new Set(rows.map((row) => row.date))].sort()
  const selectedDates = new Set(dates.slice(-days))
  return rows.filter(
    (row) => selectedDates.has(row.date) && (filters.direction === DIRECTIONS.ALL || row.direction === filters.direction),
  )
}

export function sum(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0)
}

export function aggregateRows(rows) {
  const completedCount = sum(rows, 'completedCount')
  const anomalyCount = sum(rows, 'anomalyCount')
  const totalBytes = sum(rows, 'totalBytes')
  const differenceAmount = sum(rows, 'differenceAmount')
  const highValueRiskCount = sum(rows, 'highValueRiskCount')
  const recoveredAmount = sum(rows, 'recoveredAmount')
  const manualHoursSaved = sum(rows, 'manualHoursSaved')

  return {
    completedCount,
    anomalyCount,
    totalBytes,
    anomalyRate: completedCount ? (anomalyCount / completedCount) * 100 : 0,
    differenceAmount,
    highValueRiskCount,
    recoveredAmount,
    manualHoursSaved,
    gdReceivable: sum(rows, 'gdReceivable'),
    hkPayable: sum(rows, 'hkPayable'),
  }
}

function trendValue(current, previous) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function createKpis(current, previous) {
  const specs = [
    ['completed', '已完成稽核话单', current.completedCount, previous.completedCount, (value) => value.toLocaleString('zh-CN'), '已完成双方比对并输出稽核结论的话单总数', 'cyan', false],
    ['traffic', '双向漫游总流量', current.totalBytes, previous.totalBytes, formatBytes, '底层统一以 bytes 聚合，展示层自动换算', 'blue', false],
    ['anomaly', '异常话单', current.anomalyCount, previous.anomalyCount, (value) => value.toLocaleString('zh-CN'), '命中至少一项稽核规则的话单数量', 'red', true],
    ['rate', '异常率', current.anomalyRate, previous.anomalyRate, (value) => `${value.toFixed(2)}%`, '异常话单数 ÷ 已完成稽核话单数', 'amber', true],
    ['difference', '结算差异金额', current.differenceAmount, previous.differenceAmount, formatCompactCurrency, '双方话单逐条比对后的金额差异绝对值', 'indigo', true],
    ['highValue', '高价值风险话单', current.highValueRiskCount, previous.highValueRiskCount, (value) => value.toLocaleString('zh-CN'), '金额、流量或差异命中高价值阈值的话单', 'green', true],
  ]

  return specs.map(([id, label, value, oldValue, formatter, definition, tone, betterWhenLower]) => ({
    id,
    label,
    value,
    displayValue: formatter(value),
    trend: trendValue(value, oldValue),
    trendGood: betterWhenLower ? value <= oldValue : value >= oldValue,
    definition,
    tone,
  }))
}

export function groupDaily(rows) {
  const grouped = new Map()
  for (const row of rows) {
    const current = grouped.get(row.date) ?? { date: row.date, completedCount: 0, anomalyCount: 0, totalBytes: 0 }
    current.completedCount += row.completedCount
    current.anomalyCount += row.anomalyCount
    current.totalBytes += row.totalBytes
    grouped.set(row.date, current)
  }
  return [...grouped.values()].map((row) => ({
    ...row,
    anomalyRate: row.completedCount ? (row.anomalyCount / row.completedCount) * 100 : 0,
  }))
}

export function groupAnomalies(rows) {
  const totals = new Map()
  for (const row of rows) {
    for (const [type, count] of Object.entries(row.anomalyBreakdown)) {
      totals.set(type, (totals.get(type) ?? 0) + count)
    }
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}
