import { describe, expect, it } from 'vitest'
import { StaticSampleDataAdapter } from '../../src/services/staticSampleDataAdapter.js'

describe('StaticSampleDataAdapter', () => {
  const adapter = new StaticSampleDataAdapter()

  it('returns the reconciled full-sample totals with a visible source boundary', async () => {
    const first = await adapter.loadDashboardData({ range: 'all', direction: 'ALL' })
    const second = await adapter.loadDashboardData({ range: 'all', direction: 'ALL' })
    expect(first).toEqual(second)
    expect(first.source.kind).toBe('static-sample')
    expect(first.summary.completedCount).toBe(31410)
    expect(first.summary.totalBytes).toBe(23685836196)
    expect(first.summary.activeUsers).toBe(2177)
    expect(first.settlement.rateCnyPerGiB).toBe(5)
    expect(first.summary.hkPayable).toBeCloseTo(110.295769739896)
    expect(first.highValueRecords[0].phone).toBe('131****6407')
    expect(first.highValueRecords.every((record) => /^1\d{2}\*{4}\d{4}$/.test(record.phone))).toBe(true)
    expect(first.kpis).toHaveLength(6)
  })

  it('keeps range metrics and their provenance signals internally consistent', async () => {
    const data = await adapter.loadDashboardData({ range: '7', direction: 'ALL' })
    const crossPeriodKpi = data.kpis.find((kpi) => kpi.id === 'crossPeriod')
    const crossPeriodSignal = data.anomalyDistribution.find((item) => item.name === '跨期记录')
    expect(data.summary.completedCount).toBe(6409)
    expect(data.trend).toHaveLength(7)
    expect(crossPeriodKpi.value).toBe(409)
    expect(crossPeriodSignal.value).toBe(409)
  })

  it('shows that the supplied sample has no reverse-direction records', async () => {
    const gdToHk = await adapter.loadDashboardData({ range: '7', direction: 'GD_TO_HK' })
    const hkToGd = await adapter.loadDashboardData({ range: '7', direction: 'HK_TO_GD' })
    expect(gdToHk.filters.direction).toBe('GD_TO_HK')
    expect(hkToGd.filters.direction).toBe('HK_TO_GD')
    expect(gdToHk.summary.completedCount).toBe(6409)
    expect(hkToGd.summary.completedCount).toBe(0)
    expect(hkToGd.highValueRecords).toHaveLength(0)
  })
})
