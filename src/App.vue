<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardHeader from './components/DashboardHeader.vue'
import KpiCard from './components/KpiCard.vue'
import PanelFrame from './components/PanelFrame.vue'
import TrafficTrendChart from './components/TrafficTrendChart.vue'
import AnomalyTrendChart from './components/AnomalyTrendChart.vue'
import AnomalyDistribution from './components/AnomalyDistribution.vue'
import RoamingFlowMap from './components/RoamingFlowMap.vue'
import HighValueRanking from './components/HighValueRanking.vue'
import RecentAnomalyList from './components/RecentAnomalyList.vue'
import SettlementPanel from './components/SettlementPanel.vue'
import PipelineStatus from './components/PipelineStatus.vue'
import ValuePanel from './components/ValuePanel.vue'
import CdrDetailDrawer from './components/CdrDetailDrawer.vue'
import DetailRouteView from './components/DetailRouteView.vue'
import { useDashboardData } from './composables/useDashboardData.js'
import { useDemoTour } from './composables/useDemoTour.js'
import { formatCompactCurrency } from './utils/currency.js'
import { formatBytes } from './utils/traffic.js'

const { filters, dashboard, loading, error, setRange, setDirection, reload } = useDashboardData()
const selectedRecord = ref(null)
const manualActive = ref('')
let manualTimer = null

function readDetailId() {
  const match = (globalThis.location?.hash ?? '').match(/^#\/detail\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

const routeDetailId = ref(readDetailId())

function syncRoute() {
  routeDetailId.value = readDetailId()
}

onMounted(() => globalThis.addEventListener('hashchange', syncRoute))
onBeforeUnmount(() => globalThis.removeEventListener('hashchange', syncRoute))

function highlight(section) {
  manualActive.value = section
  globalThis.clearTimeout(manualTimer)
  manualTimer = globalThis.setTimeout(() => { manualActive.value = '' }, 1800)
}

const tour = useDemoTour({
  onStep(step) {
    if (step === 'detail') selectedRecord.value = dashboard.value?.highValueRecords?.[0] ?? null
    else if (selectedRecord.value) selectedRecord.value = null
  },
})

const activeStep = computed(() => tour.activeStep.value || manualActive.value)

function manualInteraction() {
  if (tour.state.value !== 'idle') tour.stop()
}

function changeRange(value) {
  manualInteraction()
  setRange(value)
}

function changeDirection(value) {
  manualInteraction()
  setDirection(value)
}

function selectRecord(record) {
  manualInteraction()
  selectedRecord.value = record
  highlight('ranking')
}

function selectKpi(kpi) {
  manualInteraction()
  if (['anomaly', 'rate'].includes(kpi.id)) highlight('anomaly')
  else if (kpi.id === 'difference') highlight('settlement')
  else if (kpi.id === 'traffic') highlight('flow')
  else highlight('kpis')
}

function openDetail(target) {
  manualInteraction()
  selectedRecord.value = null
  const id = typeof target === 'string'
    ? target
    : target?.id?.startsWith('CDR-')
      ? target.id
      : `kpi-${target?.id}`
  if (!id) return
  routeDetailId.value = id
  globalThis.location.hash = `/detail/${encodeURIComponent(id)}`
}

function goHome() {
  routeDetailId.value = ''
  if (globalThis.location?.hash) {
    globalThis.history.pushState('', document.title, globalThis.location.pathname + globalThis.location.search)
  }
}

const combinedRecords = computed(() => {
  const records = [...(dashboard.value?.highValueRecords ?? []), ...(dashboard.value?.recentAnomalies ?? [])]
  return [...new Map(records.map((record) => [record.id, record])).values()]
})

const detailCatalog = computed(() => {
  if (!dashboard.value) return new Map()
  const catalog = new Map()
  const summary = dashboard.value.summary
  const value = dashboard.value.value

  for (const kpi of dashboard.value.kpis) {
    catalog.set(`kpi-${kpi.id}`, {
      eyebrow: 'KPI DRILLDOWN',
      title: kpi.label,
      subtitle: kpi.definition,
      metrics: [
        { label: '当前值', value: kpi.displayValue, note: '来自当前筛选周期的同源聚合结果' },
        { label: '较上期', value: `${kpi.trend >= 0 ? '+' : '-'}${Math.abs(kpi.trend).toFixed(1)}%`, note: kpi.trendGood ? '趋势处于可接受方向' : '需要优先进入异常排查' },
        { label: '筛选口径', value: `${filters.range} 天`, note: filters.direction === 'ALL' ? '覆盖粤港双向漫游' : '仅展示当前漫游方向' },
      ],
      bullets: ['单击 KPI 联动高亮，双击进入详情路由。', '所有 KPI 使用同一批 dailyRows 聚合。', '趋势对比基于相同筛选条件下的上一周期。'],
    })
  }

  catalog.set('traffic-trend', {
    eyebrow: 'CDR VOLUME & TRAFFIC',
    title: '话单总量趋势',
    subtitle: '展示近周期话单处理规模与流量走势，帮助先判断系统压力是否异常。',
    metrics: [
      { label: '完成稽核', value: summary.completedCount.toLocaleString('zh-CN'), note: '已完成双方比对并输出结论的话单数' },
      { label: '双向流量', value: formatBytes(summary.totalBytes, 2), note: '底层统一按 bytes 聚合后再换算展示' },
      { label: '人工节省', value: `${value.manualHoursSaved.toLocaleString('zh-CN')} 小时`, note: '按批量稽核替代人工抽检估算' },
    ],
    bullets: ['用于开场说明业务规模。', '结合异常率趋势解释业务波动。', '后续接 DataEase 时优先替换这组时序数据。'],
  })

  catalog.set('anomaly-distribution', {
    eyebrow: 'ANOMALY TAXONOMY',
    title: '异常类型分布',
    subtitle: '按稽核规则归因，展示当前周期异常主要集中在哪类问题。',
    metrics: dashboard.value.anomalyDistribution.slice(0, 3).map((item) => ({ label: item.name, value: item.value.toLocaleString('zh-CN'), note: '由每日 anomalyBreakdown 汇总得到' })),
    bullets: ['异常分布总和与异常话单 KPI 保持一致。', '流量、方向、金额、缺失异常由不同字段关系驱动。', '适合回答 what 与 why。'],
  })

  catalog.set('flow-topology', {
    eyebrow: 'ROAMING FLOW TOPOLOGY',
    title: '粤港漫游稽核态势',
    subtitle: '按方向拆解漫游流量、异常率与结算口径，作为动态态势模块的基础。',
    metrics: dashboard.value.flows.map((flow) => ({ label: flow.direction === 'GD_TO_HK' ? '粤 → 港' : '港 → 粤', value: `${flow.anomalyRate.toFixed(2)}%`, note: `${flow.completedCount.toLocaleString('zh-CN')} 张话单，${formatBytes(flow.totalBytes, 2)} 流量` })),
    bullets: ['广东用户赴港与香港用户来粤分开聚合。', '结算收入和支出方向由漫游方向推导。', '后续动态态势可增加流入、流出和事故扰动。'],
  })

  catalog.set('anomaly-rate', {
    eyebrow: 'AUDIT EXCEPTION RATE',
    title: '异常率趋势',
    subtitle: '观察规则命中率是否持续超过阈值，辅助判断是否需要升级处理。',
    metrics: [
      { label: '当前异常率', value: `${summary.anomalyRate.toFixed(2)}%`, note: '异常话单数 / 完成稽核话单数' },
      { label: '异常话单', value: summary.anomalyCount.toLocaleString('zh-CN'), note: '至少命中一条稽核规则' },
      { label: '关注阈值', value: '3.00%', note: summary.anomalyRate > 3 ? '当前超过演示阈值' : '当前低于演示阈值' },
    ],
    bullets: ['异常率比异常数量更适合跨周期比较。', '阈值用于演示，不代表生产规则。', '可与最新异常队列联动解释。'],
  })

  catalog.set('risk-ranking', {
    eyebrow: 'HIGH-VALUE RISK RANKING',
    title: '高价值风险话单 TOP 10',
    subtitle: '把金额、流量和用户价值因素叠加，优先展示最值得人工复核的样本。',
    metrics: dashboard.value.highValueRecords.slice(0, 3).map((record) => ({ label: record.phone, value: `${record.riskScore} 分`, note: `${record.anomalyType} · ${record.status}` })),
    bullets: ['单击打开证据抽屉，双击进入话单详情路由。', '风险分受异常类型、金额差异和缺失情况影响。', '适合比赛时从总览切到证据链。'],
  })

  catalog.set('recent-queue', {
    eyebrow: 'LIVE EXCEPTION QUEUE',
    title: '最新异常话单队列',
    subtitle: '按发生时间排序，体现稽核平台正在处理的实时问题。',
    metrics: dashboard.value.recentAnomalies.slice(0, 3).map((record) => ({ label: record.time.slice(11, 16), value: record.status, note: `${record.id} · ${record.anomalyType}` })),
    bullets: ['适合后续接动态态势刷新。', '状态区分待核查与处理中。', '双击队列项可进入具体话单。'],
  })

  catalog.set('settlement-value', {
    eyebrow: 'SETTLEMENT VALUE',
    title: '结算价值洞察',
    subtitle: '把稽核结果转化为收入、支出和差异金额，回答成果价值。',
    metrics: [
      { label: '结算差异', value: formatCompactCurrency(summary.differenceAmount), note: '逐条比对后的金额差异绝对值' },
      { label: '已挽回', value: formatCompactCurrency(summary.recoveredAmount), note: '按演示规则估算的可挽回金额' },
      { label: '待处理', value: `${value.pendingCases} 单`, note: '当前筛选周期内仍待核查的样本' },
    ],
    bullets: ['结算金额与漫游方向保持一致。', '挽回金额不超过差异金额。', '适合承接业务价值说明。'],
  })

  catalog.set('value-conversion', {
    eyebrow: 'VALUE CONVERSION',
    title: '从稽核到经营',
    subtitle: '把规则命中转成可解释、可跟进、可沉淀的运营动作。',
    metrics: [
      { label: '已挽回金额', value: formatCompactCurrency(value.recoveredAmount), note: '自动阻断与复核带来的直接价值' },
      { label: '节省工时', value: `${value.manualHoursSaved.toLocaleString('zh-CN')} 小时`, note: '批量规则引擎替代人工抽查' },
      { label: '待处理案例', value: `${value.pendingCases} 单`, note: '进入工单或复核队列' },
    ],
    bullets: ['从成果价值角度服务 PK 评分。', '强调自动稽核沉淀闭环动作。', '后续可加入事故模拟后的损失拦截曲线。'],
  })

  catalog.set('pipeline-health', {
    eyebrow: 'PIPELINE HEALTH',
    title: '数据链路健康',
    subtitle: '展示 GGSN、采集、分拣、稽核等链路状态，解释异常从哪里被发现。',
    metrics: dashboard.value.pipeline.slice(0, 3).map((item) => ({ label: item.label, value: item.latency, note: item.status === 'healthy' ? '链路健康' : '需要关注' })),
    bullets: ['链路状态用于解释 how。', '话单分拣延迟会影响缺失类异常。', '后续重大事故模拟可优先扰动链路健康。'],
  })

  for (const record of combinedRecords.value) {
    catalog.set(record.id, { eyebrow: 'CDR EVIDENCE ROUTE', title: record.id, subtitle: `${record.homeRegion} → ${record.visitedRegion} · ${record.time}`, record })
  }

  return catalog
})

const activeDetail = computed(() => {
  if (!routeDetailId.value) return null
  return detailCatalog.value.get(routeDetailId.value) ?? {
    eyebrow: 'DETAIL ROUTE',
    title: '未找到详情',
    subtitle: '当前筛选条件下没有这条详情数据。',
    metrics: [],
    bullets: ['返回根路由后重新选择卡片。'],
  }
})
</script>

<template>
  <DetailRouteView v-if="activeDetail" :detail="activeDetail" @home="goHome" />

  <div v-else class="dashboard-shell">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <DashboardHeader
      :source="dashboard?.source"
      :filters="filters"
      :tour-state="tour.state.value"
      :tour-step="tour.stepIndex.value"
      :tour-total="tour.totalSteps"
      @range-change="changeRange"
      @direction-change="changeDirection"
      @tour-start="tour.start"
      @tour-pause="tour.pause"
      @tour-resume="tour.resume"
      @tour-restart="tour.restart"
    />

    <div v-if="loading && !dashboard" class="loading-state" aria-live="polite">
      <span class="loading-ring"></span><strong>正在装载统一话单数据契约</strong><small>MockDataAdapter · Seed 20260729</small>
    </div>
    <div v-else-if="error && !dashboard" class="error-state" role="alert">
      <strong>数据装载失败</strong><span>{{ error }}</span><button type="button" @click="reload">重新加载</button>
    </div>

    <main v-if="dashboard" class="dashboard-content" :class="{ 'is-refreshing': loading }">
      <section class="kpi-grid" :class="{ 'tour-highlight': activeStep === 'kpis' }" aria-label="核心稽核指标" data-testid="kpi-grid">
        <KpiCard v-for="(kpi, index) in dashboard.kpis" :key="kpi.id" :kpi="kpi" :index="index + 1" :active="activeStep === 'kpis'" @select="selectKpi" @open-detail="openDetail" />
      </section>

      <section class="analytics-grid">
        <div class="left-column">
          <PanelFrame title="话单总量趋势" eyebrow="CDR VOLUME & TRAFFIC" detail-id="traffic-trend" @open-detail="openDetail">
            <TrafficTrendChart :data="dashboard.trend" />
          </PanelFrame>
          <PanelFrame title="异常类型分布" eyebrow="ANOMALY TAXONOMY" :active="activeStep === 'anomaly'" detail-id="anomaly-distribution" @open-detail="openDetail">
            <AnomalyDistribution :data="dashboard.anomalyDistribution" />
          </PanelFrame>
        </div>

        <div class="center-column">
          <PanelFrame title="粤港漫游稽核态势" eyebrow="ROAMING FLOW TOPOLOGY" :active="activeStep === 'flow'" detail-id="flow-topology" @open-detail="openDetail">
            <template #header><span class="panel-badge">DCC / GGSN</span></template>
            <RoamingFlowMap :flows="dashboard.flows" :selected="filters.direction" :active="activeStep === 'flow'" @select="changeDirection" />
          </PanelFrame>
          <PanelFrame title="异常率趋势" eyebrow="AUDIT EXCEPTION RATE" :active="activeStep === 'anomaly'" detail-id="anomaly-rate" @open-detail="openDetail">
            <template #header><span class="threshold-note">关注阈值 3.0%</span></template>
            <AnomalyTrendChart :data="dashboard.trend" />
          </PanelFrame>
        </div>

        <div class="right-column">
          <PanelFrame title="高价值风险话单 TOP 10" eyebrow="HIGH-VALUE RISK RANKING" :active="activeStep === 'ranking'" detail-id="risk-ranking" @open-detail="openDetail">
            <template #header><span class="panel-badge danger">风险评分</span></template>
            <HighValueRanking :records="dashboard.highValueRecords" @select="selectRecord" @open-detail="openDetail" />
          </PanelFrame>
          <PanelFrame title="最新异常话单" eyebrow="LIVE EXCEPTION QUEUE" compact detail-id="recent-queue" @open-detail="openDetail">
            <template #header><span class="queue-count">{{ dashboard.recentAnomalies.length }} 条待关注</span></template>
            <RecentAnomalyList :records="dashboard.recentAnomalies" @select="selectRecord" @open-detail="openDetail" />
          </PanelFrame>
        </div>
      </section>

      <section class="bottom-grid">
        <PanelFrame title="结算价值洞察" eyebrow="SETTLEMENT VALUE" :active="activeStep === 'settlement'" compact detail-id="settlement-value" @open-detail="openDetail">
          <SettlementPanel :summary="dashboard.summary" />
        </PanelFrame>
        <PanelFrame title="从稽核到经营" eyebrow="VALUE CONVERSION" compact detail-id="value-conversion" @open-detail="openDetail">
          <ValuePanel :value="dashboard.value" />
        </PanelFrame>
        <PanelFrame title="数据链路健康" eyebrow="PIPELINE HEALTH" :active="activeStep === 'pipeline'" compact detail-id="pipeline-health" @open-detail="openDetail">
          <PipelineStatus :items="dashboard.pipeline" />
        </PanelFrame>
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>指标口径：流量统一为 bytes · 漫游方向由归属地 + 实际上网地判断 · GGSN 仅作交叉校验</span>
      <span>演示数据，不含真实用户信息</span>
    </footer>

    <div v-if="tour.state.value !== 'idle'" class="tour-status" aria-live="polite">
      <span class="tour-wave"></span>
      <div><small>演示导览</small><strong>{{ tour.stepIndex.value + 1 }} / {{ tour.totalSteps }} · {{ activeStep }}</strong></div>
    </div>

    <CdrDetailDrawer :record="selectedRecord" @close="selectedRecord = null" />
  </div>
</template>
