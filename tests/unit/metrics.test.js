import { describe, expect, it } from 'vitest'
import { aggregateRows, createEvidenceKpis, createKpis, filterDailyRows, groupAnomalies } from '../../src/utils/metrics.js'
import { formatBytes, trafficDifferencePercent } from '../../src/utils/traffic.js'

const rows = [
  { date: '2026-07-28', direction: 'GD_TO_HK', completedCount: 100, anomalyCount: 4, totalBytes: 1024, differenceAmount: 30, highValueRiskCount: 2, recoveredAmount: 10, manualHoursSaved: 1, gdReceivable: 0, hkPayable: 100, anomalyBreakdown: { A: 3, B: 1 } },
  { date: '2026-07-28', direction: 'HK_TO_GD', completedCount: 100, anomalyCount: 2, totalBytes: 2048, differenceAmount: 20, highValueRiskCount: 1, recoveredAmount: 8, manualHoursSaved: 1, gdReceivable: 120, hkPayable: 0, anomalyBreakdown: { A: 1, B: 1 } },
  { date: '2026-07-29', direction: 'GD_TO_HK', completedCount: 120, anomalyCount: 6, totalBytes: 4096, differenceAmount: 50, highValueRiskCount: 3, recoveredAmount: 30, manualHoursSaved: 2, gdReceivable: 0, hkPayable: 140, anomalyBreakdown: { A: 4, B: 2 } },
]

describe('dashboard metric contract', () => {
  it('filters date range and roaming direction together', () => {
    const selected = filterDailyRows(rows, { range: '1', direction: 'GD_TO_HK' })
    expect(selected).toHaveLength(1)
    expect(selected[0].date).toBe('2026-07-29')
  })

  it('calculates anomaly rate from the same source rows', () => {
    const aggregate = aggregateRows(rows)
    expect(aggregate.completedCount).toBe(320)
    expect(aggregate.anomalyCount).toBe(12)
    expect(aggregate.anomalyRate).toBeCloseTo(3.75)
    expect(aggregate.differenceAmount).toBe(100)
  })

  it('keeps anomaly distribution equal to anomaly total', () => {
    const distribution = groupAnomalies(rows)
    expect(distribution.reduce((total, item) => total + item.value, 0)).toBe(12)
  })

  it('creates all six required KPI definitions', () => {
    const current = aggregateRows(rows)
    const previous = { ...current, completedCount: 300 }
    const kpis = createKpis(current, previous)
    expect(kpis).toHaveLength(6)
    expect(kpis.map((item) => item.id)).toEqual(['completed', 'traffic', 'anomaly', 'rate', 'difference', 'highValue'])
  })

  it('creates six evidence-backed KPI definitions without inventing a comparison period', () => {
    const kpis = createEvidenceKpis({
      records: 31410,
      bytes: 23685836196,
      users: 2177,
      outOfJulyRecords: 411,
      top10Count: 218,
      top10TrafficShare: 0.9044392579485016,
    })
    expect(kpis.map((item) => item.id)).toEqual(['completed', 'traffic', 'users', 'crossPeriod', 'highValue', 'concentration'])
    expect(kpis.find((item) => item.id === 'concentration').displayValue).toBe('90.44%')
    expect(kpis.every((item) => item.trend === null)).toBe(true)
  })

  it('formats traffic and calculates cross-side difference', () => {
    expect(formatBytes(10 * 1024 ** 3)).toBe('10.0 GB')
    expect(trafficDifferencePercent(100, 80)).toBeCloseTo(20)
  })
})
