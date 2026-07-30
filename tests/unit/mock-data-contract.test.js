import { describe, expect, it } from 'vitest'
import { dashboardSource } from '../../src/data/mock-dashboard.js'
import { trafficDifferencePercent } from '../../src/utils/traffic.js'

const recordsByType = (type) => dashboardSource.anomalyRecords.filter((record) => record.anomalyType === type)
const ratio = (left, right) => Math.max(left, right) / Math.max(1, Math.min(left, right))

describe('mock dashboard data contract', () => {
  it('keeps daily aggregate fields internally consistent', () => {
    for (const row of dashboardSource.dailyRows) {
      const breakdownTotal = Object.values(row.anomalyBreakdown).reduce((total, value) => total + value, 0)
      expect(breakdownTotal).toBe(row.anomalyCount)
      expect(row.highValueRiskCount).toBeLessThanOrEqual(row.anomalyCount)
      expect(row.recoveredAmount).toBeLessThanOrEqual(row.differenceAmount)
    }
  })

  it('derives every record amount gap from the two side CDR amounts', () => {
    for (const record of dashboardSource.anomalyRecords) {
      expect(record.differenceAmount).toBe(Math.abs(record.gdAmount - record.hkAmount))
    }
  })

  it('models traffic unit conversion as a 1024x traffic and billing gap', () => {
    for (const record of recordsByType('流量单位换算异常')) {
      expect(ratio(record.gdBytes, record.hkBytes)).toBeCloseTo(1024, 0)
      expect(ratio(record.gdAmount, record.hkAmount)).toBeGreaterThan(900)
    }
  })

  it('keeps amount deviation focused on money rather than traffic', () => {
    for (const record of recordsByType('金额偏差')) {
      expect(trafficDifferencePercent(record.gdBytes, record.hkBytes)).toBeLessThanOrEqual(3)
      expect(record.differenceAmount).toBeGreaterThanOrEqual(42)
    }
  })

  it('models missing CDR records with one empty side', () => {
    for (const record of recordsByType('话单缺失')) {
      expect([record.gdBytes, record.hkBytes].filter((value) => value === 0)).toHaveLength(1)
      expect([record.gdAmount, record.hkAmount].filter((value) => value === 0)).toHaveLength(1)
    }
  })
})
