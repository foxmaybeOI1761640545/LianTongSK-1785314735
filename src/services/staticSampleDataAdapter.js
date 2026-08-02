import dashboardSummary from '../data/real-dashboard-summary.json'
import { DIRECTIONS, SEGMENTS, createExperienceKpis } from '../utils/metrics.js'

const PROFILE_SUMMARY = Object.freeze({ highUsageUsers: 218, headTrafficShare: 0.9044392579485016, frequentTravelCandidates: 25, recallCandidates: 504, enterpriseCandidates: 26, highFrequencyLowVolumeUsers: 1, duplicateCandidateUsers: 358, growthCandidates: 253, companionGroupCandidates: 86 })

function selectedRange(range) { return dashboardSummary.ranges[range] ?? dashboardSummary.ranges.all }
function selectedDailyRows(range) {
  if (range === 'all' || !dashboardSummary.ranges[range]) return dashboardSummary.daily
  const { startDay, endDay } = dashboardSummary.ranges[range]
  return dashboardSummary.daily.filter((row) => row.date >= startDay && row.date <= endDay)
}
function buildTrend(range) { return selectedDailyRows(range).map((row) => ({ date: row.date, activeUsers: row.users, recordCount: row.records, totalBytes: row.bytes })) }
function buildExperienceSignals() {
  return [
    { id: SEGMENTS.RECALL, name: '低活跃召回候选', value: PROFILE_SUMMARY.recallCandidates, tone: '#ffbf5a' },
    { id: SEGMENTS.GROWTH, name: '价值提升候选', value: PROFILE_SUMMARY.growthCandidates, tone: '#45e6ff' },
    { id: SEGMENTS.HIGH_USAGE, name: '高用量重点用户', value: PROFILE_SUMMARY.highUsageUsers, tone: '#786cff' },
    { id: 'COMPANION', name: '同行使用群体候选', value: PROFILE_SUMMARY.companionGroupCandidates, tone: '#4c8dff' },
    { id: SEGMENTS.ENTERPRISE, name: '企业场景特征候选', value: PROFILE_SUMMARY.enterpriseCandidates, tone: '#48e1a8' },
    { id: 'FREQUENT', name: '高频商旅特征候选', value: PROFILE_SUMMARY.frequentTravelCandidates, tone: '#ff7184' },
  ]
}
function buildHighValueRecords(summary, range) {
  return summary.topRecords.map((record) => ({
    id: `HV-${range.toUpperCase()}-${String(record.rank).padStart(3, '0')}`,
    time: `${record.lastDay} 00:00:00`, lastActiveDay: record.lastDay, direction: DIRECTIONS.GD_TO_HK,
    phone: record.maskedPhone, subscriberTier: 'Top 10% 高用量重点用户', homeRegion: '广东侧样本用户', visitedRegion: '香港网络',
    totalBytes: record.bytes, recordCount: record.records, activeDays: record.activeDays, averageRecordBytes: record.avgRecordBytes,
    weekdayShare: record.weekdayShare, trafficShare: record.trafficShare, focusType: '高用量服务保障', status: '建议关怀',
    rule: '按筛选周期内用户总流量降序，取 Top 10% 用户群体',
    cause: '该样本用户在当前周期内的聚合流量位于头部，且流量贡献显著高于普通用户。',
    impact: '适合用于大流量套餐匹配、用量提醒、跨境权益和服务保障；该标签不等同于收入或身份认定。',
    suggestion: '结合资费、套餐、实名属性与合规授权后再做精准运营，本页面仅展示脱敏行为聚合。', provenance: 'derived',
  }))
}
function ratioPercent(numerator, denominator) { return denominator ? `${((numerator / denominator) * 100).toFixed(2)}%` : '0.00%' }
function buildPipeline(summary) {
  return [
    { id: 'sample', label: '静态真实样本', description: `${summary.records.toLocaleString('zh-CN')} 条脱敏聚合`, status: 'healthy', latency: '已覆盖' },
    { id: 'rg-parse', label: '流量字段', description: 'RG 结构与加和校验通过', status: 'healthy', latency: '100%' },
    { id: 'identity-map', label: '用户映射', description: '号码 / IMSI 一对一无冲突', status: 'healthy', latency: '100%' },
    { id: 'time-quality', label: '时间粒度', description: '00 点记录占比异常偏高', status: 'warning', latency: ratioPercent(summary.midnightRecords, summary.records) },
    { id: 'counterpart', label: '对侧样本', description: '未提供香港用户访粤记录', status: 'warning', latency: '未覆盖' },
  ]
}
function buildSummary(summary) { return { recordCount: summary.records, totalBytes: summary.bytes, activeUsers: summary.users, highUsageUsers: summary.top10Count, headTrafficShare: summary.top10TrafficShare } }

export class StaticSampleDataAdapter {
  async loadDashboardData(filters = { range: 'all', segment: SEGMENTS.ALL }) {
    const range = dashboardSummary.ranges[filters.range] ? filters.range : 'all'
    const sourceSummary = selectedRange(range)
    const summary = buildSummary(sourceSummary)
    const highValueRecords = buildHighValueRecords(sourceSummary, range)
    return {
      source: { kind: 'static-sample', label: '真实样本 · 静态脱敏聚合', message: '31,410 条记录 / 2,177 名用户', scope: '仅覆盖广东侧样本用户访问香港网络', disclaimer: '画像为行为规则推导，不代表身份、收入或满意度认定', version: 'v2026.08.02', snapshotAt: '2026-08-01 00:11:33' },
      filters: { ...filters, range }, summary, kpis: createExperienceKpis(sourceSummary, PROFILE_SUMMARY), trend: buildTrend(range), experienceSignals: buildExperienceSignals(),
      flows: [{ direction: DIRECTIONS.GD_TO_HK, completedCount: sourceSummary.records, totalBytes: sourceSummary.bytes, userCount: sourceSummary.users, coverageNote: '当前样本仅覆盖单侧漫游行为，不用于双边结算稽核' }],
      highValueRecords,
      recentFocusUsers: [...highValueRecords].sort((left, right) => right.lastActiveDay.localeCompare(left.lastActiveDay)).slice(0, 7),
      pipeline: buildPipeline(sourceSummary),
      value: { highUsageUsers: PROFILE_SUMMARY.highUsageUsers, headTrafficShare: PROFILE_SUMMARY.headTrafficShare, recallCandidates: PROFILE_SUMMARY.recallCandidates, growthCandidates: PROFILE_SUMMARY.growthCandidates, enterpriseCandidates: PROFILE_SUMMARY.enterpriseCandidates, frequentTravelCandidates: PROFILE_SUMMARY.frequentTravelCandidates, companionGroupCandidates: PROFILE_SUMMARY.companionGroupCandidates, selectedSegment: filters.segment ?? SEGMENTS.ALL, note: '月度多标签行为规则结果，群体之间可重叠，不代表身份或收入认定' },
      profileSummary: PROFILE_SUMMARY,
    }
  }
}
