import dashboardSummary from '../data/real-dashboard-summary.json'
import { DIRECTIONS, createEvidenceKpis } from '../utils/metrics.js'

const SETTLEMENT_RATE_CNY_PER_GIB = 5
const PROFILE_SUMMARY = Object.freeze({
  highValueUsers: 218,
  highValueTrafficShare: 0.9044392579485016,
  frequentBusinessUsers: 25,
  churnWarningUsers: 504,
  b2bOpportunityUsers: 26,
  highFrequencyLowVolumeUsers: 1,
  duplicateCandidateUsers: 358,
  valueGrowthUsers: 253,
  familyClusterUsers: 86,
})

function emptySummary() {
  return {
    startDay: null,
    endDay: null,
    records: 0,
    bytes: 0,
    users: 0,
    outOfJulyRecords: 0,
    midnightRecords: 0,
    imeiMissingRecords: 0,
    exactDuplicateRows: 0,
    strongDuplicatePairs: 0,
    highFrequencyLowVolumeUsers: 0,
    top10Count: 0,
    top10Bytes: 0,
    top10TrafficShare: 0,
    topRecords: [],
  }
}

function selectedRange(range) {
  return dashboardSummary.ranges[range] ?? dashboardSummary.ranges.all
}

function selectedDailyRows(range) {
  if (range === 'all' || !dashboardSummary.ranges[range]) return dashboardSummary.daily
  const { startDay, endDay } = dashboardSummary.ranges[range]
  return dashboardSummary.daily.filter((row) => row.date >= startDay && row.date <= endDay)
}

function buildTrend(range, hasRows) {
  if (!hasRows) return []
  return selectedDailyRows(range).map((row) => ({
    date: row.date,
    completedCount: row.records,
    totalBytes: row.bytes,
    anomalyCount: row.outOfJulyRecords,
    anomalyRate: row.records ? (row.outOfJulyRecords / row.records) * 100 : 0,
  }))
}

function buildQualityDistribution(summary) {
  return [
    { name: 'IMEI 字段缺失', value: summary.imeiMissingRecords },
    { name: '00 点时间记录', value: summary.midnightRecords },
    { name: '跨期记录', value: summary.outOfJulyRecords },
    { name: '强重复候选', value: summary.strongDuplicatePairs },
    { name: '高频低量用户', value: summary.highFrequencyLowVolumeUsers },
  ].filter((item) => item.value > 0)
}

function trafficIndex(record) {
  return Math.max(0, 100 - record.rank)
}

function buildHighValueRecords(summary, range) {
  return summary.topRecords.map((record) => ({
    id: `HV-${range.toUpperCase()}-${String(record.rank).padStart(3, '0')}`,
    time: `${record.lastDay} 00:00:00`,
    lastActiveDay: record.lastDay,
    direction: DIRECTIONS.GD_TO_HK,
    phone: record.maskedPhone,
    subscriberTier: 'Top 10% 高流量用户',
    homeRegion: '广东侧用户',
    visitedRegion: '香港网络',
    totalBytes: record.bytes,
    recordCount: record.records,
    activeDays: record.activeDays,
    averageRecordBytes: record.avgRecordBytes,
    weekdayShare: record.weekdayShare,
    trafficShare: record.trafficShare,
    anomalyType: '高流量价值关注',
    riskScore: trafficIndex(record),
    status: '画像关注',
    rule: '按筛选周期内用户总流量降序，取 Top 10% 用户群体',
    cause: '该样本用户在当前周期内的聚合流量位于头部，且流量贡献显著高于普通用户。',
    impact: '适合用于大流量套餐、跨境权益和服务保障设计；该标签不等同于收入或身份认定。',
    suggestion: '结合资费、套餐、实名属性与合规授权后再做精准运营，本页面仅展示脱敏行为聚合。',
    provenance: 'derived',
  }))
}

function ratioPercent(numerator, denominator) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(2)}%` : '0.00%'
}

function buildPipeline(summary) {
  const periodMatched = summary.records - summary.outOfJulyRecords
  return [
    { id: 'time-parse', label: '时间解析', description: `${summary.records.toLocaleString('zh-CN')} 条均可解析`, status: 'healthy', latency: '100%' },
    { id: 'rg-parse', label: 'RG 使用量', description: '结构与加和校验通过', status: 'healthy', latency: '100%' },
    { id: 'identity-map', label: '号码 / IMSI', description: '一对一映射无冲突', status: 'healthy', latency: '100%' },
    { id: 'period-match', label: '月份一致性', description: '文件标称 2026-07', status: summary.outOfJulyRecords ? 'warning' : 'healthy', latency: ratioPercent(periodMatched, summary.records) },
    { id: 'imei-complete', label: 'IMEI 完整性', description: '源字段全为空', status: 'warning', latency: '0%' },
  ]
}

function buildSummary(summary) {
  const estimatedPayable = (summary.bytes / 1024 ** 3) * SETTLEMENT_RATE_CNY_PER_GIB
  return {
    completedCount: summary.records,
    anomalyCount: summary.outOfJulyRecords,
    totalBytes: summary.bytes,
    anomalyRate: summary.records ? (summary.outOfJulyRecords / summary.records) * 100 : 0,
    activeUsers: summary.users,
    highValueUsers: summary.top10Count,
    highValueTrafficShare: summary.top10TrafficShare,
    gdReceivable: 0,
    hkPayable: estimatedPayable,
  }
}

export class StaticSampleDataAdapter {
  async loadDashboardData(filters = { range: 'all', direction: DIRECTIONS.ALL }) {
    const range = dashboardSummary.ranges[filters.range] ? filters.range : 'all'
    const sourceSummary = selectedRange(range)
    const hasRows = filters.direction !== DIRECTIONS.HK_TO_GD
    const evidenceSummary = hasRows ? sourceSummary : emptySummary()
    const summary = buildSummary(evidenceSummary)
    const highValueRecords = buildHighValueRecords(evidenceSummary, range)

    return {
      source: {
        kind: 'static-sample',
        label: '真实样本 · 脱敏聚合',
        message: hasRows
          ? '源自 31,410 条话单的静态聚合，仅发布中间四位掩码号码'
          : '当前样本不含“香港用户 → 广东”方向记录',
        version: 'v2026.08.02',
        snapshotAt: '2026-08-01 00:11:33',
      },
      filters: { ...filters, range },
      summary,
      settlement: {
        kind: 'scenario',
        rateCnyPerGiB: SETTLEMENT_RATE_CNY_PER_GIB,
        note: '按 1 GB = ¥5 计算；缺少正式结算协议与对侧话单，金额仍为情景估算',
      },
      kpis: createEvidenceKpis(evidenceSummary),
      trend: buildTrend(range, hasRows),
      anomalyDistribution: buildQualityDistribution(evidenceSummary),
      flows: [
        {
          direction: DIRECTIONS.GD_TO_HK,
          completedCount: sourceSummary.records,
          totalBytes: sourceSummary.bytes,
          userCount: sourceSummary.users,
          networkShare: 100,
        },
        {
          direction: DIRECTIONS.HK_TO_GD,
          completedCount: 0,
          totalBytes: 0,
          userCount: 0,
          networkShare: 0,
        },
      ],
      highValueRecords,
      recentAnomalies: [...highValueRecords]
        .sort((left, right) => right.lastActiveDay.localeCompare(left.lastActiveDay))
        .slice(0, 7),
      pipeline: buildPipeline(sourceSummary),
      value: {
        highValueUsers: PROFILE_SUMMARY.highValueUsers,
        highValueTrafficShare: PROFILE_SUMMARY.highValueTrafficShare,
        churnWarningUsers: PROFILE_SUMMARY.churnWarningUsers,
        valueGrowthUsers: PROFILE_SUMMARY.valueGrowthUsers,
        b2bOpportunityUsers: PROFILE_SUMMARY.b2bOpportunityUsers,
        note: '月度多标签规则结果，群体之间可重叠',
      },
      profileSummary: PROFILE_SUMMARY,
    }
  }
}
