<script setup>
import { computed, ref } from 'vue'
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
import { useDashboardData } from './composables/useDashboardData.js'
import { useDemoTour } from './composables/useDemoTour.js'

const { filters, dashboard, loading, error, setRange, setDirection, reload } = useDashboardData()
const selectedRecord = ref(null)
const manualActive = ref('')
let manualTimer = null

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
</script>

<template>
  <div class="dashboard-shell">
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
        <KpiCard v-for="(kpi, index) in dashboard.kpis" :key="kpi.id" :kpi="kpi" :index="index + 1" :active="activeStep === 'kpis'" @select="selectKpi" />
      </section>

      <section class="analytics-grid">
        <div class="left-column">
          <PanelFrame title="话单总量趋势" eyebrow="CDR VOLUME & TRAFFIC">
            <TrafficTrendChart :data="dashboard.trend" />
          </PanelFrame>
          <PanelFrame title="异常类型分布" eyebrow="ANOMALY TAXONOMY" :active="activeStep === 'anomaly'">
            <AnomalyDistribution :data="dashboard.anomalyDistribution" />
          </PanelFrame>
        </div>

        <div class="center-column">
          <PanelFrame title="粤港漫游稽核态势" eyebrow="ROAMING FLOW TOPOLOGY" :active="activeStep === 'flow'">
            <template #header><span class="panel-badge">DCC / GGSN</span></template>
            <RoamingFlowMap :flows="dashboard.flows" :selected="filters.direction" :active="activeStep === 'flow'" @select="changeDirection" />
          </PanelFrame>
          <PanelFrame title="异常率趋势" eyebrow="AUDIT EXCEPTION RATE" :active="activeStep === 'anomaly'">
            <template #header><span class="threshold-note">关注阈值 3.0%</span></template>
            <AnomalyTrendChart :data="dashboard.trend" />
          </PanelFrame>
        </div>

        <div class="right-column">
          <PanelFrame title="高价值风险话单 TOP 10" eyebrow="HIGH-VALUE RISK RANKING" :active="activeStep === 'ranking'">
            <template #header><span class="panel-badge danger">风险评分</span></template>
            <HighValueRanking :records="dashboard.highValueRecords" @select="selectRecord" />
          </PanelFrame>
          <PanelFrame title="最新异常话单" eyebrow="LIVE EXCEPTION QUEUE" compact>
            <template #header><span class="queue-count">{{ dashboard.recentAnomalies.length }} 条待关注</span></template>
            <RecentAnomalyList :records="dashboard.recentAnomalies" @select="selectRecord" />
          </PanelFrame>
        </div>
      </section>

      <section class="bottom-grid">
        <PanelFrame title="结算价值洞察" eyebrow="SETTLEMENT VALUE" :active="activeStep === 'settlement'" compact>
          <SettlementPanel :summary="dashboard.summary" />
        </PanelFrame>
        <PanelFrame title="从稽核到经营" eyebrow="VALUE CONVERSION" compact>
          <ValuePanel :value="dashboard.value" />
        </PanelFrame>
        <PanelFrame title="数据链路健康" eyebrow="PIPELINE HEALTH" :active="activeStep === 'pipeline'" compact>
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
