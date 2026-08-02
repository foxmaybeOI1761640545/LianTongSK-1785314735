from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[2]


def write(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")


write(
    "src/components/KpiCard.vue",
    r'''
    <script setup>
    import { computed } from 'vue'

    const props = defineProps({
      kpi: { type: Object, required: true },
      active: { type: Boolean, default: false },
      index: { type: Number, default: 0 },
    })

    const emit = defineEmits(['select', 'open-detail'])

    const hasTrend = computed(() => Number.isFinite(props.kpi.trend))
    const trendLabel = computed(() => hasTrend.value
      ? `${props.kpi.trend >= 0 ? '较上期上升' : '较上期下降'} ${Math.abs(props.kpi.trend).toFixed(1)}%`
      : '当前筛选范围的样本快照')

    function openDetail(event) {
      emit('open-detail', { target: props.kpi, origin: { x: event.clientX, y: event.clientY } })
    }
    </script>

    <template>
      <button
        class="kpi-card"
        :class="[`tone-${kpi.tone}`, { 'is-active': active }]"
        type="button"
        :aria-label="`${kpi.label}：${kpi.displayValue}，${trendLabel}`"
        :data-kpi="kpi.id"
        @click="$emit('select', kpi)"
        @dblclick.stop="openDetail"
      >
        <span class="kpi-glow"></span>
        <span class="kpi-index">{{ String(index).padStart(2, '0') }}</span>
        <span class="kpi-label">{{ kpi.label }}</span>
        <strong class="kpi-value">{{ kpi.displayValue }}</strong>
        <span class="kpi-meta">
          <template v-if="hasTrend">
            <span :class="['trend', kpi.trendGood ? 'good' : 'bad']">{{ kpi.trend >= 0 ? '↗' : '↘' }} {{ Math.abs(kpi.trend).toFixed(1) }}%</span>
            <span>较上期</span>
          </template>
          <template v-else>
            <span class="trend good">●</span>
            <span>样本快照</span>
          </template>
        </span>
        <span class="kpi-definition">{{ kpi.definition }}</span>
      </button>
    </template>
    ''',
)

write(
    "src/components/PanelFrame.vue",
    r'''
    <script setup>
    const props = defineProps({
      title: { type: String, required: true },
      eyebrow: { type: String, default: '' },
      active: { type: Boolean, default: false },
      compact: { type: Boolean, default: false },
      detailId: { type: String, default: '' },
    })

    const emit = defineEmits(['open-detail'])

    function openDetail(event) {
      if (!props.detailId) return
      emit('open-detail', { target: props.detailId, origin: { x: event.clientX, y: event.clientY } })
    }
    </script>

    <template>
      <section
        class="panel-frame"
        :class="{ 'is-active': active, 'is-compact': compact, 'is-detail-enabled': detailId }"
        @dblclick.stop="openDetail"
      >
        <div class="panel-corner panel-corner--tl"></div>
        <div class="panel-corner panel-corner--br"></div>
        <header class="panel-header">
          <div>
            <span v-if="eyebrow" class="panel-eyebrow">{{ eyebrow }}</span>
            <h2>{{ title }}</h2>
          </div>
          <slot name="header"></slot>
        </header>
        <div class="panel-body">
          <slot></slot>
        </div>
      </section>
    </template>
    ''',
)

write(
    "src/components/HighValueRanking.vue",
    r'''
    <script setup>
    import { onBeforeUnmount } from 'vue'
    import { formatBytes } from '../utils/traffic.js'

    defineProps({ records: { type: Array, default: () => [] } })
    const emit = defineEmits(['select', 'open-detail'])

    let selectTimer = null

    function queueSelect(record) {
      globalThis.clearTimeout(selectTimer)
      selectTimer = globalThis.setTimeout(() => emit('select', record), 220)
    }

    function openDetail(record, event) {
      globalThis.clearTimeout(selectTimer)
      emit('open-detail', { target: record, origin: { x: event.clientX, y: event.clientY } })
    }

    onBeforeUnmount(() => globalThis.clearTimeout(selectTimer))

    const directionLabel = (direction) => direction === 'GD_TO_HK' ? '粤 → 港' : '港 → 粤'
    </script>

    <template>
      <div class="ranking-list" data-testid="high-value-ranking">
        <button
          v-for="(record, index) in records"
          :key="record.id"
          type="button"
          class="ranking-row"
          :aria-label="`查看 ${record.phone} 用户画像`"
          @click="queueSelect(record)"
          @dblclick.stop="openDetail(record, $event)"
        >
          <span :class="['rank-number', { top: index < 3 }]">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="rank-main">
            <span><strong>{{ record.phone }}</strong><em>{{ directionLabel(record.direction) }}</em></span>
            <small>{{ formatBytes(record.totalBytes, 1) }} · {{ record.activeDays }} 个活跃日</small>
          </span>
          <span class="contribution-score">
            <b>{{ (record.trafficShare * 100).toFixed(2) }}%</b>
            <small>流量贡献</small>
            <i><span :style="{ width: `${Math.min(record.trafficShare * 1000, 100)}%` }"></span></i>
          </span>
        </button>
        <div v-if="!records.length" class="empty-state">当前周期暂无可发布的重点用户明细</div>
      </div>
    </template>
    ''',
)

write(
    "src/components/RecentFocusList.vue",
    r'''
    <script setup>
    import { onBeforeUnmount } from 'vue'

    defineProps({ records: { type: Array, default: () => [] } })
    const emit = defineEmits(['select', 'open-detail'])

    let selectTimer = null

    function queueSelect(record) {
      globalThis.clearTimeout(selectTimer)
      selectTimer = globalThis.setTimeout(() => emit('select', record), 220)
    }

    function openDetail(record, event) {
      globalThis.clearTimeout(selectTimer)
      emit('open-detail', { target: record, origin: { x: event.clientX, y: event.clientY } })
    }

    onBeforeUnmount(() => globalThis.clearTimeout(selectTimer))
    </script>

    <template>
      <div class="recent-list" data-testid="recent-focus-users">
        <button
          v-for="record in records"
          :key="record.id"
          type="button"
          class="recent-row"
          @click="queueSelect(record)"
          @dblclick.stop="openDetail(record, $event)"
        >
          <span class="status-dot focus"></span>
          <span class="recent-date">{{ record.lastActiveDay.slice(5) }}</span>
          <span class="recent-content"><strong>{{ record.phone }}</strong><small>{{ record.activeDays }} 个活跃日 · {{ record.id }}</small></span>
          <span class="recent-status">{{ record.status }}</span>
        </button>
        <div v-if="!records.length" class="empty-state">当前周期暂无重点关怀样本</div>
      </div>
    </template>
    ''',
)

write(
    "src/components/DetailRouteView.vue",
    r'''
    <script setup>
    import { computed, onMounted, ref } from 'vue'
    import { formatBytes } from '../utils/traffic.js'

    const props = defineProps({
      detail: { type: Object, default: null },
      origin: { type: Object, default: () => ({ x: 50, y: 50 }) },
    })

    defineEmits(['home'])

    const record = computed(() => props.detail?.record ?? null)
    const weekdayShare = computed(() => `${((record.value?.weekdayShare ?? 0) * 100).toFixed(1)}%`)
    const trafficShare = computed(() => `${((record.value?.trafficShare ?? 0) * 100).toFixed(2)}%`)
    const dialogElement = ref(null)
    const layerStyle = computed(() => ({
      '--focus-origin-x': `${props.origin.x}%`,
      '--focus-origin-y': `${props.origin.y}%`,
    }))

    onMounted(() => dialogElement.value?.focus())
    </script>

    <template>
      <div class="focus-layer" :style="layerStyle" data-testid="detail-focus">
        <button type="button" class="focus-backdrop" aria-label="关闭放大详情" @click="$emit('home')"></button>
        <main
          ref="dialogElement"
          class="detail-route"
          data-testid="detail-route"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          @dblclick.stop="$emit('home')"
        >
          <div class="detail-orbit"></div>
          <header class="detail-route-header">
            <div>
              <span>{{ detail?.eyebrow }}</span>
              <h1>{{ detail?.title }}</h1>
              <p>{{ detail?.subtitle }}</p>
            </div>
            <button type="button" class="detail-back" aria-label="返回驾驶舱" @click.stop="$emit('home')" @dblclick.stop>×</button>
          </header>

          <section v-if="record" class="focus-record-grid">
            <article class="focus-profile-card">
              <span>脱敏重点用户</span>
              <strong>{{ record.phone }}</strong>
              <p>{{ record.focusType }} · {{ record.status }}</p>
            </article>
            <article class="focus-record-metric"><span>周期总流量</span><strong>{{ formatBytes(record.totalBytes, 2) }}</strong><p>{{ Number(record.recordCount).toLocaleString('zh-CN') }} 条聚合话单</p></article>
            <article class="focus-record-metric"><span>流量贡献</span><strong>{{ trafficShare }}</strong><p>{{ record.activeDays }} 个活跃日</p></article>
            <article class="focus-record-metric"><span>工作日使用</span><strong>{{ weekdayShare }}</strong><p>{{ record.homeRegion }} → {{ record.visitedRegion }}</p></article>
            <article class="focus-record-story">
              <span>识别依据</span><p>{{ record.cause }}</p>
              <span>体验与业务含义</span><p>{{ record.impact }}</p>
              <span>建议动作</span><p>{{ record.suggestion }}</p>
            </article>
          </section>

          <section v-else class="detail-analysis-grid">
            <article v-for="metric in detail?.metrics" :key="metric.label" class="detail-metric-card">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <p>{{ metric.note }}</p>
            </article>
            <article class="detail-story-card">
              <span>演示口径</span>
              <ul>
                <li v-for="item in detail?.bullets" :key="item">{{ item }}</li>
              </ul>
            </article>
          </section>
        </main>
      </div>
    </template>
    ''',
)

write(
    "src/App.vue",
    r'''
    <script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
    import DashboardHeader from './components/DashboardHeader.vue'
    import KpiCard from './components/KpiCard.vue'
    import PanelFrame from './components/PanelFrame.vue'
    import TrafficTrendChart from './components/TrafficTrendChart.vue'
    import ExperienceSignals from './components/ExperienceSignals.vue'
    import RoamingFlowMap from './components/RoamingFlowMap.vue'
    import OpportunityPanel from './components/OpportunityPanel.vue'
    import HighValueRanking from './components/HighValueRanking.vue'
    import RecentFocusList from './components/RecentFocusList.vue'
    import ExperiencePathPanel from './components/ExperiencePathPanel.vue'
    import PipelineStatus from './components/PipelineStatus.vue'
    import ValuePanel from './components/ValuePanel.vue'
    import CdrDetailDrawer from './components/CdrDetailDrawer.vue'
    import DetailRouteView from './components/DetailRouteView.vue'
    import { useDashboardData } from './composables/useDashboardData.js'
    import { useDemoTour } from './composables/useDemoTour.js'
    import { formatBytes } from './utils/traffic.js'

    const { filters, dashboard, loading, error, setRange, setSegment, reload } = useDashboardData()
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
      globalThis.clearTimeout(manualTimer)
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

    function changeSegment(value) {
      manualInteraction()
      setSegment(value)
    }

    function selectRecord(record) {
      manualInteraction()
      selectedRecord.value = record
      highlight('ranking')
    }

    function selectKpi(kpi) {
      manualInteraction()
      if (kpi.id === 'recall' || kpi.id === 'averageTraffic') highlight('experience')
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
        : target?.rule || target?.focusType
          ? `record-${target.id}`
          : `kpi-${target?.id}`
      if (!id) return
      routeDetailId.value = id
      globalThis.location.hash = `/detail/${encodeURIComponent(id)}`
    }

    function goHome() {
      routeDetailId.value = ''
      if (globalThis.location?.hash) {
        globalThis.history.replaceState('', globalThis.document?.title ?? '', `${globalThis.location.pathname}${globalThis.location.search}`)
      }
    }

    const combinedRecords = computed(() => {
      const records = [...(dashboard.value?.highValueRecords ?? []), ...(dashboard.value?.recentFocusUsers ?? [])]
      return [...new Map(records.map((record) => [record.id, record])).values()]
    })

    const formatNumber = (value) => Number(value ?? 0).toLocaleString('zh-CN')
    const formatPercent = (value, digits = 2) => `${(Number(value ?? 0) * 100).toFixed(digits)}%`

    const detailCatalog = computed(() => {
      if (!dashboard.value) return new Map()
      const catalog = new Map()
      const summary = dashboard.value.summary ?? {}
      const value = dashboard.value.value ?? {}
      const activeFilters = filters.value
      const rangeLabel = activeFilters.range === 'all' ? '完整样本周期' : `${activeFilters.range} 天`

      for (const kpi of dashboard.value.kpis ?? []) {
        catalog.set(`kpi-${kpi.id}`, {
          eyebrow: 'EXPERIENCE KPI DRILLDOWN',
          title: kpi.label,
          subtitle: kpi.definition,
          metrics: [
            { label: '当前值', value: kpi.displayValue, note: '来自当前筛选周期的同源聚合与规则结果' },
            { label: '筛选周期', value: rangeLabel, note: '切换周期后详情与驾驶舱保持同步' },
            { label: '客群筛选', value: activeFilters.segment ?? 'ALL', note: '多标签客群允许重叠，不用于身份认定' },
          ],
          bullets: ['单击 KPI 联动高亮，双击进入居中放大详情。', '真实聚合指标与规则推导候选在页面中明确区分。', '当前样本仅覆盖广东侧用户访问香港网络。'],
        })
      }

      catalog.set('traffic-trend', {
        eyebrow: 'ACTIVE USERS & ROAMING TRAFFIC',
        title: '活跃用户与漫游流量趋势',
        subtitle: '按日展示当前周期的活跃用户、话单记录和漫游流量。',
        metrics: [
          { label: '活跃用户', value: formatNumber(summary.activeUsers), note: '当前筛选范围内的去重样本用户' },
          { label: '样本话单', value: formatNumber(summary.recordCount), note: '当前筛选范围内的真实脱敏记录' },
          { label: '漫游流量', value: formatBytes(summary.totalBytes ?? 0, 2), note: 'RG 使用量统一按 bytes 聚合后换算' },
        ],
        bullets: ['趋势用于解释规模变化，不外推为完整生产业务量。', '连续日期的数据可能受样本抽取边界影响。', '后续可由 DataEase 或 API 适配器替换静态聚合。'],
      })

      catalog.set('experience-signals', {
        eyebrow: 'EXPERIENCE BEHAVIOR SIGNALS',
        title: '用户体验行为信号',
        subtitle: '基于月度行为规则形成可重叠的运营候选群体。',
        metrics: (dashboard.value.experienceSignals ?? []).slice(0, 3).map((item) => ({
          label: item.name,
          value: `${formatNumber(item.value)} 人`,
          note: '规则候选，不代表身份、收入或满意度认定',
        })),
        bullets: ['候选群体之间可以重叠，不能相加作为用户总数。', '体验信号用于形成服务动作，不直接代表用户主观感受。', '正式运营前应结合资费、套餐与合规授权数据。'],
      })

      catalog.set('flow-topology', {
        eyebrow: 'SAMPLE COVERAGE & USAGE SCENARIO',
        title: '样本覆盖与跨境使用场景',
        subtitle: '当前真实样本只覆盖广东侧用户访问香港网络。',
        metrics: (dashboard.value.flows ?? []).map((flow) => ({
          label: flow.direction === 'GD_TO_HK' ? '粤 → 港' : '港 → 粤',
          value: formatBytes(flow.totalBytes ?? 0, 2),
          note: `${formatNumber(flow.userCount)} 位用户 · ${formatNumber(flow.completedCount)} 条记录`,
        })),
        bullets: ['单侧样本不表达为双向业务量。', '未提供的对侧数据标记为覆盖边界，而不是零。', '本模块不用于双边结算稽核。'],
      })

      catalog.set('opportunities', {
        eyebrow: 'AUDIENCE OPPORTUNITIES',
        title: '重点客群与运营机会',
        subtitle: '将真实使用聚合转化为体验改善与经营候选。',
        metrics: [
          { label: '高用量重点用户', value: `${formatNumber(value.highUsageUsers)} 人`, note: '用量提醒、大流量包与服务保障候选' },
          { label: '低活跃召回候选', value: `${formatNumber(value.recallCandidates)} 人`, note: '激活引导、回归权益与原因调研候选' },
          { label: '价值提升候选', value: `${formatNumber(value.growthCandidates)} 人`, note: '套餐匹配、阶梯权益与场景推荐候选' },
        ],
        bullets: ['候选规模来自月度多标签行为规则。', '实际触达必须经过业务校验与合规授权。', '运营结果需要后续转化数据验证。'],
      })

      catalog.set('risk-ranking', {
        eyebrow: 'HIGH-USAGE CUSTOMER FOCUS',
        title: '高用量重点关怀用户 TOP 10',
        subtitle: '按当前周期用户总流量排序的脱敏聚合画像。',
        metrics: (dashboard.value.highValueRecords ?? []).slice(0, 3).map((record) => ({
          label: record.phone,
          value: formatBytes(record.totalBytes, 2),
          note: `${record.activeDays} 个活跃日 · 流量贡献 ${formatPercent(record.trafficShare)}`,
        })),
        bullets: ['单击打开侧边画像，双击进入居中放大画像。', '流量排序不代表收入、信用或社会身份。', '页面不发布号码明文、IMSI、IP 或位置明细。'],
      })

      catalog.set('recent-focus', {
        eyebrow: 'RECENT CUSTOMER FOCUS',
        title: '近期重点关怀用户',
        subtitle: '在高用量用户中按最后活跃日期排序，形成近期服务线索。',
        metrics: (dashboard.value.recentFocusUsers ?? []).slice(0, 3).map((record) => ({
          label: record.lastActiveDay,
          value: record.phone,
          note: `${record.activeDays} 个活跃日 · ${record.status}`,
        })),
        bullets: ['近期活跃只表示样本中的最后记录日期。', '列表是静态真实样本聚合，不冒充实时告警。', '双击样本可进入同一份脱敏聚合画像。'],
      })

      catalog.set('experience-path', {
        eyebrow: 'EXPERIENCE IMPROVEMENT',
        title: '用户体验改善路径',
        subtitle: '从激活体验、套餐适配到重点用户服务保障。',
        metrics: [
          { label: '激活体验', value: `${formatNumber(value.recallCandidates)} 人`, note: '低活跃候选的首次使用引导与召回权益' },
          { label: '套餐适配', value: `${formatNumber(value.growthCandidates)} 人`, note: '根据使用强度匹配日包、周包或阶梯权益' },
          { label: '服务保障', value: `${formatNumber(value.highUsageUsers)} 人`, note: '面向高用量用户提供预警、客服与网络保障' },
        ],
        bullets: ['改善路径是建议动作，不是已发生的运营效果。', '每一步均需要业务规则、触达权限和效果评估。', '后续可接入工单与转化数据形成闭环。'],
      })

      catalog.set('value-conversion', {
        eyebrow: 'COMPANY VALUE CONVERSION',
        title: '公司价值转化',
        subtitle: '从使用体验改善延伸到客户价值提升的候选路径。',
        metrics: [
          { label: '头部用户流量贡献', value: formatPercent(value.headTrafficShare), note: '当前样本 Top 10% 高用量用户的真实聚合贡献' },
          { label: '企业场景候选', value: `${formatNumber(value.enterpriseCandidates)} 人`, note: '需结合企业身份与授权数据验证' },
          { label: '高频商旅候选', value: `${formatNumber(value.frequentTravelCandidates)} 人`, note: '需结合出行与套餐数据验证' },
        ],
        bullets: ['价值路径包括召回留存、套餐升级、企业试点和重点服务。', '机会规模不等同于实际收入或转化。', '正式价值评估需补充套餐、收入与触达结果。'],
      })

      catalog.set('pipeline-health', {
        eyebrow: 'DATA TRUST & SCOPE',
        title: '数据可信度与适用边界',
        subtitle: '展示样本、字段、映射、时间质量和对侧覆盖状态。',
        metrics: (dashboard.value.pipeline ?? []).slice(0, 3).map((item) => ({
          label: item.label,
          value: item.latency,
          note: item.description,
        })),
        bullets: ['绿色状态表示当前检查通过，警示状态表示适用边界。', '对侧样本未提供，因此不开展双边结算推断。', '时间粒度问题需要结合原始采集链路进一步核查。'],
      })

      for (const record of combinedRecords.value) {
        catalog.set(`record-${record.id}`, {
          eyebrow: 'MASKED CUSTOMER PROFILE',
          title: record.id,
          subtitle: `${record.homeRegion} → ${record.visitedRegion} · 最后活跃 ${record.lastActiveDay}`,
          record,
        })
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
        bullets: ['返回驾驶舱后重新选择卡片。'],
      }
    })
    </script>

    <template>
      <div class="dashboard-shell" :class="{ 'is-focus-open': activeDetail }">
        <div class="ambient ambient-one"></div>
        <div class="ambient ambient-two"></div>

        <DashboardHeader
          :source="dashboard?.source"
          :filters="filters"
          :tour-state="tour.state.value"
          :tour-step="tour.stepIndex.value"
          :tour-total="tour.totalSteps"
          @range-change="changeRange"
          @segment-change="changeSegment"
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
            <KpiCard
              v-for="(kpi, index) in dashboard.kpis"
              :key="kpi.id"
              :kpi="kpi"
              :index="index + 1"
              :active="activeStep === 'kpis'"
              @select="selectKpi"
              @open-detail="openDetail"
            />
          </section>

          <section class="analytics-grid">
            <div class="left-column">
              <PanelFrame title="活跃用户与漫游流量趋势" eyebrow="ACTIVE USERS & ROAMING TRAFFIC" detail-id="traffic-trend" @open-detail="openDetail">
                <TrafficTrendChart :data="dashboard.trend" />
              </PanelFrame>
              <PanelFrame title="用户体验行为信号" eyebrow="EXPERIENCE BEHAVIOR SIGNALS" :active="activeStep === 'experience'" detail-id="experience-signals" @open-detail="openDetail">
                <template #header><span class="panel-badge">月度多标签</span></template>
                <ExperienceSignals :data="dashboard.experienceSignals" :selected="filters.segment" />
              </PanelFrame>
            </div>

            <div class="center-column">
              <PanelFrame title="样本覆盖与跨境使用场景" eyebrow="SAMPLE COVERAGE & USAGE SCENARIO" :active="activeStep === 'flow'" detail-id="flow-topology" @open-detail="openDetail">
                <template #header><span class="panel-badge">真实样本 / 单侧覆盖</span></template>
                <RoamingFlowMap :flows="dashboard.flows" :active="activeStep === 'flow'" />
              </PanelFrame>
              <PanelFrame title="重点客群与运营机会" eyebrow="AUDIENCE OPPORTUNITIES" :active="activeStep === 'value'" detail-id="opportunities" @open-detail="openDetail">
                <template #header><span class="threshold-note">候选群体可重叠</span></template>
                <OpportunityPanel :value="dashboard.value" />
              </PanelFrame>
            </div>

            <div class="right-column">
              <PanelFrame title="高用量重点关怀用户 TOP 10" eyebrow="HIGH-USAGE CUSTOMER FOCUS" :active="activeStep === 'ranking'" detail-id="risk-ranking" @open-detail="openDetail">
                <template #header><span class="panel-badge">流量贡献</span></template>
                <HighValueRanking :records="dashboard.highValueRecords" @select="selectRecord" @open-detail="openDetail" />
              </PanelFrame>
              <PanelFrame title="近期重点关怀用户" eyebrow="RECENT CUSTOMER FOCUS" compact detail-id="recent-focus" @open-detail="openDetail">
                <template #header><span class="queue-count">{{ dashboard.recentFocusUsers.length }} 个脱敏样本</span></template>
                <RecentFocusList :records="dashboard.recentFocusUsers" @select="selectRecord" @open-detail="openDetail" />
              </PanelFrame>
            </div>
          </section>

          <section class="bottom-grid">
            <PanelFrame title="用户体验改善路径" eyebrow="EXPERIENCE IMPROVEMENT" :active="activeStep === 'experience'" compact detail-id="experience-path" @open-detail="openDetail">
              <template #header><span class="panel-badge">从行为信号到服务动作</span></template>
              <ExperiencePathPanel :value="dashboard.value" />
            </PanelFrame>
            <PanelFrame title="公司价值转化" eyebrow="COMPANY VALUE CONVERSION" :active="activeStep === 'value'" compact detail-id="value-conversion" @open-detail="openDetail">
              <ValuePanel :value="dashboard.value" />
            </PanelFrame>
            <PanelFrame title="数据可信度与适用边界" eyebrow="DATA TRUST & SCOPE" :active="activeStep === 'pipeline'" compact detail-id="pipeline-health" @open-detail="openDetail">
              <PipelineStatus :items="dashboard.pipeline" />
            </PanelFrame>
          </section>
        </main>

        <footer class="dashboard-footer">
          <span>指标口径：流量统一为 bytes · 文件标称周期 2026-07 · 客群为可重叠行为标签</span>
          <span>真实静态样本 · 不进行双边结算稽核 · 运营效果需后续业务数据验证</span>
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
    ''',
)

write(
    "src/styles/focus-detail.css",
    r'''
    .dashboard-shell.is-focus-open {
      pointer-events: none;
      filter: blur(3px) saturate(.72) brightness(.62);
      transform: scale(.992);
    }

    .panel-frame.is-detail-enabled { cursor: zoom-in; }
    .panel-frame.is-detail-enabled:hover { border-color: rgba(69, 230, 255, .48); }
    .kpi-card { cursor: zoom-in; }

    .focus-layer {
      position: fixed;
      z-index: 220;
      inset: 0;
      display: grid;
      place-items: center;
      padding: clamp(12px, 2.4vw, 42px);
    }

    .focus-backdrop {
      position: absolute;
      inset: 0;
      width: 100%;
      border: 0;
      background: radial-gradient(circle at var(--focus-origin-x) var(--focus-origin-y), rgba(31, 111, 174, .28), rgba(0, 5, 14, .9) 48%);
      backdrop-filter: blur(10px) saturate(.72);
    }

    .detail-route {
      position: relative;
      width: min(1120px, 92vw);
      max-height: 90vh;
      overflow: auto;
      border: 1px solid rgba(69, 230, 255, .46);
      border-radius: 18px;
      padding: clamp(18px, 2vw, 32px);
      color: var(--text);
      background: linear-gradient(145deg, rgba(9, 29, 54, .98), rgba(3, 12, 27, .99));
      box-shadow: 0 35px 100px rgba(0, 0, 0, .62), 0 0 60px rgba(45, 182, 244, .18), inset 0 1px rgba(255, 255, 255, .04);
      transform-origin: var(--focus-origin-x) var(--focus-origin-y);
      outline: none;
    }

    .detail-orbit {
      position: absolute;
      top: -140px;
      right: -100px;
      width: 330px;
      height: 330px;
      border: 1px solid rgba(69, 230, 255, .12);
      border-radius: 50%;
      box-shadow: 0 0 80px rgba(69, 230, 255, .09) inset;
      pointer-events: none;
    }

    .detail-route-header { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid rgba(82, 174, 229, .2); }
    .detail-route-header span { color: var(--cyan); font-size: 10px; font-weight: 800; letter-spacing: .18em; }
    .detail-route-header h1 { margin: 8px 0 6px; font-size: clamp(26px, 2.5vw, 44px); font-weight: 650; letter-spacing: .02em; }
    .detail-route-header p { max-width: 800px; margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.7; }
    .detail-back { position: relative; z-index: 2; display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(69, 230, 255, .38); border-radius: 50%; color: var(--cyan); background: rgba(20, 75, 118, .24); font-size: 25px; }

    .detail-analysis-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .detail-metric-card, .detail-story-card, .focus-profile-card, .focus-record-metric, .focus-record-story { border: 1px solid rgba(88, 171, 224, .18); border-radius: 12px; background: rgba(10, 29, 52, .72); }
    .detail-metric-card { min-height: 150px; padding: 18px; }
    .detail-metric-card span, .detail-story-card > span, .focus-profile-card span, .focus-record-metric span, .focus-record-story span { color: var(--cyan); font-size: 9px; font-weight: 750; letter-spacing: .1em; }
    .detail-metric-card strong { display: block; margin: 14px 0 8px; font-size: clamp(22px, 2vw, 34px); font-weight: 620; }
    .detail-metric-card p, .focus-record-metric p { margin: 0; color: var(--text-muted); font-size: 11px; line-height: 1.65; }
    .detail-story-card { grid-column: 1 / -1; padding: 18px; }
    .detail-story-card ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 14px 0 0; padding: 0; list-style: none; }
    .detail-story-card li { border-left: 2px solid rgba(69, 230, 255, .42); padding: 10px 12px; color: #c8ddea; background: rgba(11, 29, 52, .45); font-size: 12px; line-height: 1.65; }

    .focus-record-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .focus-profile-card { grid-column: 1 / -1; padding: 20px; background: linear-gradient(115deg, rgba(32, 115, 170, .2), rgba(31, 44, 92, .14)); }
    .focus-profile-card strong { display: block; margin: 8px 0 5px; font-size: clamp(25px, 2.4vw, 42px); }
    .focus-profile-card p { margin: 0; color: var(--text-muted); }
    .focus-record-metric { padding: 18px; }
    .focus-record-metric strong { display: block; margin: 12px 0 7px; font-size: clamp(21px, 1.8vw, 32px); }
    .focus-record-story { grid-column: 1 / -1; display: grid; grid-template-columns: 150px 1fr; gap: 9px 20px; padding: 20px; }
    .focus-record-story p { margin: 0; color: #c7d9e6; font-size: 12px; line-height: 1.7; }

    .focus-enter-active, .focus-leave-active { transition: opacity 260ms ease; }
    .focus-enter-active .detail-route { animation: focus-zoom-in 430ms cubic-bezier(.16, 1, .3, 1); }
    .focus-leave-active .detail-route { transition: transform 220ms ease, opacity 220ms ease, filter 220ms ease; }
    .focus-enter-from, .focus-leave-to { opacity: 0; }
    .focus-leave-to .detail-route { opacity: 0; filter: blur(5px); transform: scale(.9); }

    @keyframes focus-zoom-in {
      from { opacity: 0; filter: blur(9px); transform: translateY(20px) scale(.62); }
      to { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
    }

    @media (max-width: 900px) {
      .focus-layer { padding: 10px; }
      .detail-route { width: calc(100vw - 20px); max-height: calc(100vh - 20px); }
      .detail-analysis-grid, .focus-record-grid { grid-template-columns: 1fr; }
      .detail-story-card, .focus-profile-card, .focus-record-story { grid-column: auto; }
      .detail-story-card ul { grid-template-columns: 1fr; }
      .focus-record-story { grid-template-columns: 1fr; }
    }
    ''',
)

main_path = ROOT / "src/main.js"
main_content = main_path.read_text(encoding="utf-8")
focus_import = "import './styles/focus-detail.css'"
if focus_import not in main_content:
    main_content = main_content.replace("import './styles/dashboard.css'", "import './styles/dashboard.css'\n" + focus_import)
main_path.write_text(main_content, encoding="utf-8")

write(
    "tests/unit/focus-detail.test.js",
    r'''
    import { mount } from '@vue/test-utils'
    import { describe, expect, it } from 'vitest'
    import KpiCard from '../../src/components/KpiCard.vue'
    import PanelFrame from '../../src/components/PanelFrame.vue'

    describe('dashboard focus interactions', () => {
      it('emits a detail payload when a KPI is double-clicked', async () => {
        const kpi = { id: 'users', label: '活跃用户', displayValue: '2,177', tone: 'cyan', definition: '真实聚合' }
        const wrapper = mount(KpiCard, { props: { kpi, index: 1 } })
        await wrapper.trigger('dblclick', { clientX: 120, clientY: 80 })
        expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({ target: kpi, origin: { x: 120, y: 80 } })
      })

      it('emits its configured detail route when a panel is double-clicked', async () => {
        const wrapper = mount(PanelFrame, {
          props: { title: '用户体验行为信号', detailId: 'experience-signals' },
          slots: { default: '<div>body</div>' },
        })
        await wrapper.trigger('dblclick', { clientX: 320, clientY: 180 })
        expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({
          target: 'experience-signals',
          origin: { x: 320, y: 180 },
        })
      })
    })
    ''',
)

e2e_path = ROOT / "tests/e2e/dashboard.spec.js"
e2e_content = e2e_path.read_text(encoding="utf-8")
focus_test = r'''

test('opens centered focus details on double click and closes with Escape', async ({ page }) => {
  await page.goto('')
  await page.locator('[data-kpi="users"]').dblclick()
  await expect(page.getByTestId('detail-focus')).toBeVisible()
  await expect(page.getByTestId('detail-route')).toContainText('活跃用户')
  await expect(page).toHaveURL(/#\/detail\/kpi-users$/)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('detail-focus')).toBeHidden()

  await page.getByTestId('high-value-ranking').locator('.ranking-row').first().dblclick()
  await expect(page.getByTestId('detail-focus')).toBeVisible()
  await expect(page.getByTestId('detail-route')).toContainText('脱敏重点用户')
})
'''
if "opens centered focus details on double click" not in e2e_content:
    e2e_path.write_text(e2e_content.rstrip() + focus_test + "\n", encoding="utf-8")

print("Applied UserExperienceValueDashboard modules and retained double-click focus details.")
