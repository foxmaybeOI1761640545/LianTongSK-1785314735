import { describe, expect, it } from 'vitest'
import { MockDataAdapter } from '../../src/services/mockDataAdapter.js'

describe('MockDataAdapter', () => {
  const adapter = new MockDataAdapter()

  it('returns deterministic dashboard data with a visible source boundary', async () => {
    const first = await adapter.loadDashboardData({ range: '7', direction: 'ALL' })
    const second = await adapter.loadDashboardData({ range: '7', direction: 'ALL' })
    expect(first).toEqual(second)
    expect(first.source.kind).toBe('mock')
    expect(first.source.seed).toBe(20260729)
    expect(first.kpis).toHaveLength(6)
  })

  it('keeps KPI and anomaly chart totals consistent', async () => {
    const data = await adapter.loadDashboardData({ range: '14', direction: 'ALL' })
    const anomalyKpi = data.kpis.find((kpi) => kpi.id === 'anomaly')
    const distributionTotal = data.anomalyDistribution.reduce((sum, item) => sum + item.value, 0)
    expect(anomalyKpi.value).toBe(distributionTotal)
    expect(data.trend).toHaveLength(14)
  })

  it('supports both roaming directions without changing the contract', async () => {
    const gdToHk = await adapter.loadDashboardData({ range: '7', direction: 'GD_TO_HK' })
    const hkToGd = await adapter.loadDashboardData({ range: '7', direction: 'HK_TO_GD' })
    expect(gdToHk.filters.direction).toBe('GD_TO_HK')
    expect(hkToGd.filters.direction).toBe('HK_TO_GD')
    expect(gdToHk.summary.completedCount).toBeGreaterThan(hkToGd.summary.completedCount)
  })
})
