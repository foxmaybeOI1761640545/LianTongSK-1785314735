import { dashboardSource } from '../data/mock-dashboard.js'
import {
  DIRECTIONS,
  aggregateRows,
  createKpis,
  groupAnomalies,
  groupDaily,
} from '../utils/metrics.js'

function splitPeriods(rows, filters) {
  const days = Number.parseInt(filters.range, 10) || 7
  const directionRows = rows.filter(
    (row) => filters.direction === DIRECTIONS.ALL || row.direction === filters.direction,
  )
  const dates = [...new Set(directionRows.map((row) => row.date))].sort()
  const currentDates = new Set(dates.slice(-days))
  const previousDates = new Set(dates.slice(-(days * 2), -days))
  return {
    current: directionRows.filter((row) => currentDates.has(row.date)),
    previous: directionRows.filter((row) => previousDates.has(row.date)),
    currentDates,
  }
}

function buildFlows(rows) {
  return [DIRECTIONS.GD_TO_HK, DIRECTIONS.HK_TO_GD].map((direction) => {
    const selected = rows.filter((row) => row.direction === direction)
    const aggregate = aggregateRows(selected)
    return { direction, ...aggregate }
  })
}

export class MockDataAdapter {
  async loadDashboardData(filters = { range: '7', direction: DIRECTIONS.ALL }) {
    const { current, previous, currentDates } = splitPeriods(dashboardSource.dailyRows, filters)
    const currentAggregate = aggregateRows(current)
    const previousAggregate = aggregateRows(previous)
    const recordFilter = (record) =>
      (filters.direction === DIRECTIONS.ALL || record.direction === filters.direction) &&
      currentDates.has(record.time.slice(0, 10))
    const records = dashboardSource.anomalyRecords.filter(recordFilter)

    return {
      source: {
        kind: 'mock',
        label: '演示数据',
        message: 'DataEase 未配置，当前使用确定性演示数据',
        seed: dashboardSource.seed,
        snapshotAt: dashboardSource.snapshotAt,
      },
      filters: { ...filters },
      summary: currentAggregate,
      kpis: createKpis(currentAggregate, previousAggregate),
      trend: groupDaily(current),
      anomalyDistribution: groupAnomalies(current),
      flows: buildFlows(current),
      highValueRecords: records.slice(0, 10),
      recentAnomalies: [...records].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 7),
      pipeline: dashboardSource.pipeline,
      value: {
        recoveredAmount: currentAggregate.recoveredAmount,
        manualHoursSaved: currentAggregate.manualHoursSaved,
        pendingCases: records.filter((record) => record.status === '待核查').length,
      },
    }
  }
}
