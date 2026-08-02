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
const focusOrigin = ref({ x: 50, y: 50 })
let manualTimer = null

function readDetailId() {
  const match = (globalThis.location?.hash ?? '').match(/^#\/detail\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

const routeDetailId = ref(readDetailId())

function syncRoute() {
  routeDetailId.value = readDetailId()
}

function handleKeydown(event) {
  if (event.key === 'Escape' && routeDetailId.value) goHome()
}

onMounted(() => {
  globalThis.addEventListener('hashchange', syncRoute)
  globalThis.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  globalThis.removeEventListener('hashchange', syncRoute)
  globalThis.removeEventListener('keydown', handleKeydown)
})

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
  if (kpi.id === 'crossPeriod') highlight('anomaly')
  else if (kpi.id === 'concentration') highlight('ranking')
  else if (kpi.id === 'traffic') highlight('flow')
  else highlight('kpis')
}

function openDetail(payload) {
  manualInteraction()
  selectedRecord.value = null
  const target = payload?.target ?? payload
  const origin = payload?.origin
  if (origin && globalThis.innerWidth && globalThis.innerHeight) {
    focusOrigin.value = {
      x: Math.min(96, Math.max(4, (origin.x / globalThis.innerWidth) * 100)),
      y: Math.min(96, Math.max(4, (origin.y / globalThis.innerHeight) * 100)),
    }
  } else {
    focusOrigin.value = { x: 50, y: 50 }
  }
  const id = typeof target === 'string'
    ? target
    : target?.rule || target?.provenance
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
  const activeFilters = filters.value
  const rangeLabel = activeFilters.range === 'all' ? '完整样本周期' : `${activeFilters.range} 天`

  for (const kpi of dashboard.value.kpis) {
    catalog.set(`kpi-${kpi.id}`, {
      eyebrow: 'KPI DRILLDOWN',
      title: kpi.label,
      subtitle: kpi.definition,
      metrics: [
        { label: '当前值', value: kpi.displayValue, note: '来自当前筛选周期的同源聚合结果' },
        { label: '指标属性', value: kpi.definition.split('｜')[0], note: '明确区分真实聚合与规则推导' },
        { label: '筛选口径', value: rangeLabel, note: activeFilters.direction === 'ALL' ? '当前样本全部来自广东用户赴港方向' : '仅展示当前漫游方向' },
      ],
      bullets: ['单击 KPI 联动高亮，双击进入居中聚焦详情。', '所有 KPI 来自同一份 31,410 条脱敏话单样本。', '没有对侧话单或生产资费支撑的指标不会包装成真实结论。'],
    })
  }

  catalog.set('traffic-trend', {
    eyebrow: 'CDR VOLUME & TRAFFIC',
    title: '话单与流量样本分布',
    subtitle: '按天展示样本话单量和 RG 使用量；连续日期恰好 1,000 条，不能外推为完整生产趋势。',
    metrics: [
      { label: '样本话单', value: summary.completedCount.toLocaleString('zh-CN'), note: '当前筛选范围内的真实话单记录数' },
      { label: '漫游流量', value: formatBytes(summary.totalBytes, 2), note: 'RG 使用量统一按 bytes 聚合后换算展示' },
      { label: '活跃用户', value: summary.activeUsers.toLocaleString('zh-CN'), note: '计费号码与 IMSI 一对一去重结果' },
    ],
    bullets: ['用于开场说明数据覆盖规模。', '30 个日期恰好 1,000 条，可能存在抽样上限或 ETL 截断。', '后续接 DataEase 时可直接替换这组时序聚合。'],
  })

  catalog.set('anomaly-distribution', {
    eyebrow: 'DATA QUALITY SIGNALS',
    title: '数据质量检查',
    subtitle: '按记录、重复冗余和用户三种独立口径列示检查结果，不再汇总成一个不可解释的总数。',
    metrics: dashboard.value.anomalyDistribution.slice(0, 3).map((item) => ({ label: item.name, value: `${item.value.toLocaleString('zh-CN')} ${item.unit}`, note: item.note })),
    bullets: ['各项检查的统计单位不同，不能直接相加。', '账期外记录由事件月份与文件标称月份比对得出。', '检查结果代表待关注线索，不直接等同于计费事故。'],
  })

  catalog.set('flow-topology', {
    eyebrow: 'ROAMING FLOW TOPOLOGY',
    title: '粤港漫游样本流向',
    subtitle: '按用户归属与访问网络展示样本覆盖方向，避免把单向样本误解为完整双向态势。',
    metrics: dashboard.value.flows.map((flow) => flow.coverage === 'missing'
      ? { label: '港 → 粤', value: '未覆盖', note: '对侧话单未提供，不表达为业务量 0' }
      : { label: '粤 → 港', value: `${flow.networkShare.toFixed(0)}%`, note: `${flow.completedCount.toLocaleString('zh-CN')} 条话单 · ${flow.userCount.toLocaleString('zh-CN')} 位用户 · ${formatBytes(flow.totalBytes, 2)}` }),
    bullets: ['当前真实样本只覆盖广东侧用户赴港方向。', '香港归属用户来粤标为“未覆盖”，不推断真实业务量。', '补齐对侧数据后才能开展双边结算稽核。'],
  })

  catalog.set('anomaly-rate', {
    eyebrow: 'OUT-OF-PERIOD RATE',
    title: '账期外记录分布',
    subtitle: '按日期展示事件月份不属于文件标称月份 2026-07 的记录数，避免将边界日期渲染成夸张的 100% 峰值。',
    metrics: [
      { label: '账期一致率', value: summary.hasSample ? `${(100 - summary.anomalyRate).toFixed(2)}%` : '未覆盖', note: '账期内记录数 ÷ 当前筛选话单数' },
      { label: '账期外记录', value: summary.hasSample ? summary.anomalyCount.toLocaleString('zh-CN') : '未覆盖', note: '事件月份不属于 2026-07 的记录' },
      { label: '检查状态', value: summary.hasSample ? (summary.anomalyCount > 0 ? '需要核对' : '范围内一致') : '无样本', note: '不把边界日期的记录率包装成业务异常峰值' },
    ],
    bullets: ['全量样本账期一致率为 98.69%。', '6 月 2 条、8 月 409 条共同构成 411 条账期外记录。', '该检查不推断费用损失，需结合对侧话单继续核查。'],
  })

  catalog.set('risk-ranking', {
    eyebrow: 'HIGH-VALUE USER RANKING',
    title: '高价值用户画像 TOP 10',
    subtitle: '按筛选周期内用户总流量排序，展示头部用户的脱敏聚合画像。',
    metrics: dashboard.value.highValueRecords.slice(0, 3).map((record) => ({ label: record.phone, value: `${record.riskScore} 分`, note: `${formatBytes(record.totalBytes, 2)} · ${record.activeDays} 个活跃日` })),
    bullets: ['单击打开聚合画像抽屉，双击进入居中聚焦详情。', '流量指数来自排序位置，不代表信用、收入或风险评分。', '号码仅以脱敏形式展示，页面不发布 IMSI、IP 或位置明细。'],
  })

  catalog.set('recent-queue', {
    eyebrow: 'RECENT HIGH-VALUE SAMPLES',
    title: '最近活跃高价值样本',
    subtitle: '在头部流量用户中按最后活跃日期排序，便于演示从总览下钻到用户聚合证据。',
    metrics: dashboard.value.recentAnomalies.slice(0, 3).map((record) => ({ label: record.lastActiveDay, value: record.phone, note: `${record.id} · ${formatBytes(record.totalBytes, 2)}` })),
    bullets: ['列表是静态真实样本聚合，不冒充实时告警队列。', '最近活跃仅表示样本中的最后记录日期。', '双击样本可进入聚合画像详情。'],
  })

  catalog.set('settlement-value', {
    eyebrow: 'SETTLEMENT SCENARIO',
    title: '结算情景估算',
    subtitle: '在缺少正式资费和对侧话单时，以统一假设单价演示结算计算方法。',
    metrics: [
      { label: '样本侧估算支出', value: Number.isFinite(summary.hkPayable) ? formatCompactCurrency(summary.hkPayable) : '未覆盖', note: '漫游流量 × 情景单价，不代表生产结算金额' },
      { label: '假设单价', value: `¥${Number(dashboard.value.settlement.rateCnyPerGB ?? 0).toFixed(2)} / GB`, note: '1 GB = 1,000,000,000 B；仅用于可视化演示' },
      { label: '估算流量', value: summary.hasSample ? formatBytes(summary.totalBytes, 2) : '未覆盖', note: '来自当前筛选范围的真实聚合流量' },
    ],
    bullets: ['金额区明确标注“情景估算”。', '对侧收入标为“未提供”，双向净额标为“暂不可计算”。', '正式资费与对侧 CDR 到位后可替换估算模块。'],
  })

  catalog.set('value-conversion', {
    eyebrow: 'VALUE CONVERSION',
    title: '从数据到经营',
    subtitle: '把真实聚合指标转成可解释的用户群体线索，同时保留规则边界。',
    metrics: [
      { label: '高价值用户', value: value.highValueUsers.toLocaleString('zh-CN'), note: '月度多标签规则中的高价值群体' },
      { label: '价值增长用户', value: value.valueGrowthUsers.toLocaleString('zh-CN'), note: '满足价值增长规则的脱敏用户数' },
      { label: 'B2B 机会用户', value: value.b2bOpportunityUsers.toLocaleString('zh-CN'), note: '规则推导的潜在线索，需结合业务数据验证' },
    ],
    bullets: ['多标签群体之间允许重叠，不能相加为总用户数。', '画像用于经营分析线索，不代表用户身份认定。', '后续可结合套餐、资费与授权数据形成闭环。'],
  })

  catalog.set('pipeline-health', {
    eyebrow: 'PIPELINE HEALTH',
    title: '数据链路健康',
    subtitle: '展示 GGSN、采集、分拣、稽核等链路状态，解释异常从哪里被发现。',
    metrics: dashboard.value.pipeline.slice(0, 3).map((item) => ({ label: item.label, value: item.latency, note: item.status === 'healthy' ? '链路健康' : '需要关注' })),
    bullets: ['链路状态用于解释数据如何被校验。', '月份一致性和 IMEI 完整性直接来自样本质量规则。', '后续重大事故模拟可优先扰动链路健康。'],
  })

  for (const record of combinedRecords.value) {
    catalog.set(record.id, { eyebrow: 'CDR EVIDENCE ROUTE', title: record.id, subtitle: `${record.homeRegion} → ${record.visitedRegion} · 最后活跃 ${record.lastActiveDay}`, record })
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
  <div class="dashboard-shell" :class="{ 'is-focus-open': activeDetail }" :aria-hidden="Boolean(activeDetail)">
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
      <span class="loading-ring"></span><strong>正在装载脱敏聚合数据</strong><small>StaticSampleDataAdapter · v2026.08.02</small>
    </div>
    <div v-else-if="error && !dashboard" class="error-state" role="alert">
      <strong>数据装载失败</strong><span>{{ error }}</span><button type="button" @click="reload">重新加载</button>
    </div>

    <main v-if="dashboard" class="dashboard-content" :class="{ 'is-refreshing': loading }">
      <section class="kpi-grid" :class="{ 'tour-highlight': activeStep === 'kpis' }" aria-label="核心洞察指标" data-testid="kpi-grid">
        <KpiCard v-for="(kpi, index) in dashboard.kpis" :key="kpi.id" :kpi="kpi" :index="index + 1" :active="activeStep === 'kpis'" @select="selectKpi" @open-detail="openDetail" />
      </section>

      <section class="analytics-grid">
        <div class="left-column">
          <PanelFrame title="话单与流量样本分布" eyebrow="CDR VOLUME & TRAFFIC" detail-id="traffic-trend" @open-detail="openDetail">
            <TrafficTrendChart :data="dashboard.trend" />
          </PanelFrame>
          <PanelFrame title="数据质量检查" eyebrow="DATA QUALITY CHECKS" :active="activeStep === 'anomaly'" detail-id="anomaly-distribution" @open-detail="openDetail">
            <AnomalyDistribution :data="dashboard.anomalyDistribution" />
          </PanelFrame>
        </div>

        <div class="center-column">
          <PanelFrame title="粤港漫游样本流向" eyebrow="ROAMING FLOW TOPOLOGY" :active="activeStep === 'flow'" detail-id="flow-topology" @open-detail="openDetail">
            <template #header><span class="panel-badge">DCC / GGSN</span></template>
            <RoamingFlowMap :flows="dashboard.flows" :selected="filters.direction" :active="activeStep === 'flow'" @select="changeDirection" />
          </PanelFrame>
          <PanelFrame title="账期外记录分布" eyebrow="OUT-OF-PERIOD RECORDS" :active="activeStep === 'anomaly'" detail-id="anomaly-rate" @open-detail="openDetail">
            <template #header><span class="threshold-note">样本外 {{ dashboard.summary.anomalyCount.toLocaleString('zh-CN') }} 条</span></template>
            <AnomalyTrendChart :data="dashboard.trend" />
          </PanelFrame>
        </div>

        <div class="right-column">
          <PanelFrame title="高价值用户画像 TOP 10" eyebrow="HIGH-VALUE USER RANKING" :active="activeStep === 'ranking'" detail-id="risk-ranking" @open-detail="openDetail">
            <template #header><span class="panel-badge danger">流量指数</span></template>
            <HighValueRanking :records="dashboard.highValueRecords" @select="selectRecord" @open-detail="openDetail" />
          </PanelFrame>
          <PanelFrame title="最近活跃高价值样本" eyebrow="RECENT HIGH-VALUE SAMPLES" compact detail-id="recent-queue" @open-detail="openDetail">
            <template #header><span class="queue-count">{{ dashboard.recentAnomalies.length }} 个脱敏样本</span></template>
            <RecentAnomalyList :records="dashboard.recentAnomalies" @select="selectRecord" @open-detail="openDetail" />
          </PanelFrame>
        </div>
      </section>

      <section class="bottom-grid">
        <PanelFrame title="结算情景估算" eyebrow="SETTLEMENT SCENARIO" :active="activeStep === 'settlement'" compact detail-id="settlement-value" @open-detail="openDetail">
          <template #header><span class="panel-badge">情景假设</span></template>
          <SettlementPanel :summary="dashboard.summary" :scenario="dashboard.settlement" />
        </PanelFrame>
        <PanelFrame title="从数据到经营" eyebrow="VALUE CONVERSION" compact detail-id="value-conversion" @open-detail="openDetail">
          <ValuePanel :value="dashboard.value" />
        </PanelFrame>
        <PanelFrame title="数据链路健康" eyebrow="PIPELINE HEALTH" :active="activeStep === 'pipeline'" compact detail-id="pipeline-health" @open-detail="openDetail">
          <PipelineStatus :items="dashboard.pipeline" />
        </PanelFrame>
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>指标口径：底层 bytes 聚合，展示按十进制 GB 换算 · 文件标称周期 2026-07</span>
      <span>真实样本的脱敏静态聚合 · 金额仅为情景估算</span>
    </footer>

    <div v-if="tour.state.value !== 'idle'" class="tour-status" aria-live="polite">
      <span class="tour-wave"></span>
      <div><small>演示导览</small><strong>{{ tour.stepIndex.value + 1 }} / {{ tour.totalSteps }} · {{ activeStep }}</strong></div>
    </div>

    <CdrDetailDrawer :record="selectedRecord" @close="selectedRecord = null" />
  </div>

  <Transition name="focus">
    <DetailRouteView v-if="activeDetail" :detail="activeDetail" :origin="focusOrigin" @home="goHome" />
  </Transition>
</template>
