import { createSeededRandom, deterministicRange } from '../utils/seed.js'
import { DIRECTIONS } from '../utils/metrics.js'

export const DEMO_SEED = 20260729

const anomalyTypes = [
  '流量单位换算异常',
  '双方流量不一致',
  '漫游方向标识异常',
  '重复计费',
  '金额偏差',
  '话单缺失',
]

const typeWeights = [0.27, 0.24, 0.18, 0.12, 0.11, 0.08]

function formatDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function splitAnomalies(total) {
  const result = {}
  let allocated = 0
  anomalyTypes.forEach((type, index) => {
    const count = index === anomalyTypes.length - 1 ? total - allocated : Math.floor(total * typeWeights[index])
    result[type] = count
    allocated += count
  })
  return result
}

function buildDailyRows() {
  const random = createSeededRandom(DEMO_SEED)
  const rows = []
  const end = new Date(2026, 6, 29)

  for (let offset = 59; offset >= 0; offset -= 1) {
    const date = new Date(end)
    date.setDate(end.getDate() - offset)
    const weekdayBoost = [0.82, 1.03, 1.06, 1.08, 1.12, 1.18, 0.93][date.getDay()]

    for (const direction of [DIRECTIONS.GD_TO_HK, DIRECTIONS.HK_TO_GD]) {
      const directionFactor = direction === DIRECTIONS.GD_TO_HK ? 1.12 : 0.88
      const completedCount = Math.round(deterministicRange(random, 7800, 11200) * weekdayBoost * directionFactor)
      const anomalyRate = direction === DIRECTIONS.GD_TO_HK
        ? 0.022 + random() * 0.013
        : 0.016 + random() * 0.011
      const anomalyCount = Math.round(completedCount * anomalyRate)
      const averageBytes = deterministicRange(random, 280, 520) * 1024 * 1024
      const totalBytes = completedCount * averageBytes
      const differenceAmount = anomalyCount * deterministicRange(random, 17, 34)
      const highValueRiskCount = Math.max(8, Math.round(anomalyCount * (0.16 + random() * 0.08)))
      const settlementBase = completedCount * deterministicRange(random, 16, 23)

      rows.push({
        date: formatDate(date),
        direction,
        completedCount,
        anomalyCount,
        totalBytes,
        differenceAmount,
        highValueRiskCount,
        recoveredAmount: Math.round(differenceAmount * (0.56 + random() * 0.15)),
        manualHoursSaved: Math.round(completedCount / deterministicRange(random, 390, 470)),
        gdReceivable: direction === DIRECTIONS.HK_TO_GD ? settlementBase : 0,
        hkPayable: direction === DIRECTIONS.GD_TO_HK ? settlementBase : 0,
        anomalyBreakdown: splitAnomalies(anomalyCount),
      })
    }
  }
  return rows
}

const anomalyProfiles = {
  '流量单位换算异常': {
    rule: 'R-TRF-001 · 字节/KB/MB 跨域归一校验',
    cause: '香港侧上报值按 KB 解析，广东侧按 bytes 入库，出现 1024 倍量级差异。',
    impact: '若进入批价，会放大漫游结算支出并触发用户账单争议。',
    suggestion: '阻断本批次入账，统一换算为 bytes 后重算，并回溯同接口近 24 小时话单。',
  },
  '双方流量不一致': {
    rule: 'R-TRF-003 · 双侧流量差异率 > 5%',
    cause: '会话切换时终止报文延迟，香港侧末段流量未同步至广东侧话单。',
    impact: '双方对账不平，可能形成少计收入或多付结算费用。',
    suggestion: '补采终止报文并按会话标识重聚合，差异消除后再进入结算。',
  },
  '漫游方向标识异常': {
    rule: 'R-DIR-002 · 归属地/上网地/GGSN 三字段交叉校验',
    cause: '报文来源地与用户归属地组合错误，漫游方向被反向标记。',
    impact: '收入与支出方向颠倒，影响粤港双方结算口径。',
    suggestion: '以归属地 + 实际上网地重新判向，GGSN 仅作为交叉校验字段。',
  },
  '重复计费': {
    rule: 'R-DUP-001 · 会话标识 + 时间窗幂等校验',
    cause: '消息计费接口重试导致相同会话生成两条标准 CDR。',
    impact: '用户被重复计费，同时扩大对侧结算支出。',
    suggestion: '按会话标识去重并补充接口幂等键，核销重复话单。',
  },
  '金额偏差': {
    rule: 'R-AMT-004 · 双侧计费金额差异 ≥ ¥30',
    cause: '双方资费版本生效时间不同，跨零点会话分别命中旧、新资费。',
    impact: '高价值用户账单存在投诉风险，结算金额需要人工确认。',
    suggestion: '锁定资费版本时间窗，使用会话开始时间重批价并发起对账工单。',
  },
  '话单缺失': {
    rule: 'R-MIS-001 · 单侧 CDR 存在、对侧 30 分钟内无匹配',
    cause: '集中采集链路短时积压，部分香港侧话单尚未完成分拣。',
    impact: '结算依据不完整，可能造成漏收或延迟出账。',
    suggestion: '触发补采任务并暂缓对应批次结算，链路恢复后自动复核。',
  },
}

function buildAnomalyRecords() {
  const random = createSeededRandom(DEMO_SEED + 17)
  const records = []
  for (let index = 0; index < 18; index += 1) {
    const type = anomalyTypes[index % anomalyTypes.length]
    const direction = index % 3 === 1 ? DIRECTIONS.HK_TO_GD : DIRECTIONS.GD_TO_HK
    const gdBytes = deterministicRange(random, 2, 23) * 1024 ** 3 + deterministicRange(random, 30, 900) * 1024 ** 2
    const mismatch = type === '流量单位换算异常'
      ? 1024
      : 1 + (deterministicRange(random, 6, 27) / 100) * (index % 2 ? -1 : 1)
    const hkBytes = Math.max(1, Math.round(gdBytes * mismatch))
    const gdAmount = deterministicRange(random, 72, 328)
    const differenceAmount = type === '金额偏差'
      ? deterministicRange(random, 42, 108)
      : deterministicRange(random, 12, 68)
    const hkAmount = Math.max(1, gdAmount + (index % 2 ? -differenceAmount : differenceAmount))
    const profile = anomalyProfiles[type]
    const riskScore = Math.min(98, 62 + deterministicRange(random, 1, 30) + (type === '流量单位换算异常' ? 5 : 0))

    records.push({
      id: `CDR-20260729-${String(index + 1).padStart(4, '0')}`,
      time: `2026-07-${String(29 - (index % 6)).padStart(2, '0')} ${String(8 + (index % 11)).padStart(2, '0')}:${String(11 + index * 3).slice(-2)}:${String(17 + index * 7).slice(-2)}`,
      direction,
      phone: index % 2 ? '186****' + String(7210 + index) : '139****' + String(3600 + index),
      subscriberTier: index % 4 === 0 ? '高价值政企' : index % 3 === 0 ? '高价值个人' : '普通用户',
      homeRegion: direction === DIRECTIONS.GD_TO_HK ? '广东' : '香港',
      visitedRegion: direction === DIRECTIONS.GD_TO_HK ? '香港' : '广东',
      ggsn: direction === DIRECTIONS.GD_TO_HK ? 'HK-GGSN-02' : 'GD-GGSN-07',
      gdBytes,
      hkBytes,
      gdAmount,
      hkAmount,
      differenceAmount,
      anomalyType: type,
      riskScore,
      status: index % 5 === 0 ? '处理中' : '待核查',
      ...profile,
    })
  }
  return records.sort((a, b) => b.riskScore - a.riskScore)
}

export const dashboardSource = Object.freeze({
  seed: DEMO_SEED,
  snapshotAt: '2026-07-29 18:30:00',
  dailyRows: buildDailyRows(),
  anomalyRecords: buildAnomalyRecords(),
  pipeline: [
    { id: 'ggsn-gd', label: '广东 GGSN', description: 'DCC 实时报文', status: 'healthy', latency: '0.8s' },
    { id: 'ggsn-hk', label: '香港 GGSN', description: 'DCC 实时报文', status: 'healthy', latency: '1.1s' },
    { id: 'collector', label: '集中采集', description: '话单统一汇聚', status: 'healthy', latency: '2.4s' },
    { id: 'splitter', label: '话单分拣', description: '一单双路分发', status: 'warning', latency: '8.7s' },
    { id: 'audit', label: '稽核结算', description: '双方交叉对账', status: 'healthy', latency: '3.2s' },
  ],
})
