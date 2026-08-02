import { formatBytes } from './traffic.js'

export const DIRECTIONS = { GD_TO_HK: 'GD_TO_HK' }
export const SEGMENTS = { ALL: 'ALL', HIGH_USAGE: 'HIGH_USAGE', RECALL: 'RECALL', GROWTH: 'GROWTH', ENTERPRISE: 'ENTERPRISE' }

export function createExperienceKpis(summary, profile) {
  const averageBytes = summary.users ? summary.bytes / summary.users : 0
  const specs = [
    ['users', '活跃用户', summary.users, (value) => value.toLocaleString('zh-CN'), '真实聚合｜计费号码与 IMSI 一对一去重', 'cyan'],
    ['traffic', '漫游总流量', summary.bytes, formatBytes, '真实聚合｜RG 使用量总量字段求和', 'blue'],
    ['averageTraffic', '人均漫游流量', averageBytes, (value) => formatBytes(value, 1), '真实聚合｜漫游总流量 ÷ 活跃用户数', 'green'],
    ['highUsage', '高用量重点用户', summary.top10Count, (value) => value.toLocaleString('zh-CN'), '行为规则｜按当前周期用户流量降序取前 10%', 'indigo'],
    ['recall', '低活跃召回候选', profile.recallCandidates, (value) => value.toLocaleString('zh-CN'), '月度规则｜低流量且近期活跃不足，仅作召回候选', 'amber'],
    ['concentration', '头部流量贡献', summary.top10TrafficShare, (value) => `${(value * 100).toFixed(2)}%`, '真实聚合｜Top 10% 用户流量 ÷ 总流量', 'red'],
  ]
  return specs.map(([id, label, value, formatter, definition, tone]) => ({ id, label, value, displayValue: formatter(value), trend: null, trendGood: true, definition, tone }))
}
