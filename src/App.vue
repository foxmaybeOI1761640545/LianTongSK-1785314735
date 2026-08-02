<script setup>
import { computed,onBeforeUnmount,onMounted,ref } from 'vue'
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

const {filters,dashboard,loading,error,setRange,setSegment,reload}=useDashboardData()
const selectedRecord=ref(null)
const manualActive=ref('')
const focusOrigin=ref({x:50,y:50})
let manualTimer=null

function readDetailId(){const match=(globalThis.location?.hash??'').match(/^#\/detail\/(.+)$/);return match?decodeURIComponent(match[1]):''}
const routeDetailId=ref(readDetailId())
function syncRoute(){routeDetailId.value=readDetailId()}
function goHome(){routeDetailId.value='';if(globalThis.location?.hash)globalThis.history.replaceState('',globalThis.document?.title??'',`${globalThis.location.pathname}${globalThis.location.search}`)}
function handleKeydown(event){if(event.key==='Escape'&&routeDetailId.value)goHome()}
onMounted(()=>{globalThis.addEventListener('hashchange',syncRoute);globalThis.addEventListener('keydown',handleKeydown)})
onBeforeUnmount(()=>{globalThis.removeEventListener('hashchange',syncRoute);globalThis.removeEventListener('keydown',handleKeydown);globalThis.clearTimeout(manualTimer)})

function highlight(section){manualActive.value=section;globalThis.clearTimeout(manualTimer);manualTimer=globalThis.setTimeout(()=>{manualActive.value=''},1800)}
const tour=useDemoTour({onStep(step){if(step==='detail')selectedRecord.value=dashboard.value?.highValueRecords?.[0]??null;else if(selectedRecord.value)selectedRecord.value=null}})
const activeStep=computed(()=>tour.activeStep.value||manualActive.value)
function manualInteraction(){if(tour.state.value!=='idle')tour.stop()}
function changeRange(value){manualInteraction();setRange(value)}
function changeSegment(value){manualInteraction();setSegment(value)}
function selectRecord(record){manualInteraction();selectedRecord.value=record;highlight('ranking')}
function selectKpi(kpi){manualInteraction();if(kpi.id==='recall'||kpi.id==='averageTraffic')highlight('experience');else if(kpi.id==='concentration')highlight('ranking');else if(kpi.id==='traffic')highlight('flow');else highlight('kpis')}

function openDetail(payload){
  manualInteraction();selectedRecord.value=null
  const target=payload?.target??payload
  const origin=payload?.origin
  if(origin&&globalThis.innerWidth&&globalThis.innerHeight)focusOrigin.value={x:Math.min(96,Math.max(4,origin.x/globalThis.innerWidth*100)),y:Math.min(96,Math.max(4,origin.y/globalThis.innerHeight*100))}
  else focusOrigin.value={x:50,y:50}
  const id=typeof target==='string'?target:target?.focusType?`record-${target.id}`:`kpi-${target?.id}`
  if(!id)return
  routeDetailId.value=id
  globalThis.location.hash=`/detail/${encodeURIComponent(id)}`
}

const combinedRecords=computed(()=>{const records=[...(dashboard.value?.highValueRecords??[]),...(dashboard.value?.recentFocusUsers??[])];return [...new Map(records.map(record=>[record.id,record])).values()]})
const number=value=>Number(value??0).toLocaleString('zh-CN')
const percent=value=>`${(Number(value??0)*100).toFixed(2)}%`
const metric=(label,value,note)=>({label,value,note})
const story=(eyebrow,title,subtitle,metrics,bullets)=>({eyebrow,title,subtitle,metrics,bullets})

const detailCatalog=computed(()=>{
  if(!dashboard.value)return new Map()
  const catalog=new Map()
  const summary=dashboard.value.summary??{}
  const value=dashboard.value.value??{}
  const rangeLabel=filters.value.range==='all'?'完整样本周期':`${filters.value.range} 天`
  for(const kpi of dashboard.value.kpis??[])catalog.set(`kpi-${kpi.id}`,story('EXPERIENCE KPI DRILLDOWN',kpi.label,kpi.definition,[metric('当前值',kpi.displayValue,'当前筛选周期的同源聚合或规则结果'),metric('筛选周期',rangeLabel,'详情与驾驶舱筛选保持同步'),metric('客群聚焦',filters.value.segment,'多标签客群允许重叠')],['单击 KPI 联动高亮，双击进入居中放大详情。','真实聚合指标与规则推导候选明确区分。','当前样本仅覆盖广东侧用户访问香港网络。']))
  catalog.set('traffic-trend',story('ACTIVE USERS & ROAMING TRAFFIC','活跃用户与漫游流量趋势','按日展示当前周期的活跃用户、话单记录和漫游流量。',[metric('活跃用户',number(summary.activeUsers),'当前筛选范围内的去重样本用户'),metric('样本话单',number(summary.recordCount),'当前筛选范围内的真实脱敏记录'),metric('漫游流量',formatBytes(summary.totalBytes??0,2),'RG 使用量统一按 bytes 聚合')],['趋势用于解释样本规模变化。','样本抽取边界不外推为完整生产业务量。','后续可由 DataEase 或 API 适配器替换。']))
  catalog.set('experience-signals',story('EXPERIENCE BEHAVIOR SIGNALS','用户体验行为信号','基于月度行为规则形成可重叠的运营候选群体。',(dashboard.value.experienceSignals??[]).slice(0,3).map(item=>metric(item.name,`${number(item.value)} 人`,'规则候选，不代表身份或满意度认定')),['候选群体之间可以重叠。','体验信号不直接代表用户主观感受。','正式运营前需结合套餐与合规授权数据。']))
  catalog.set('flow-topology',story('SAMPLE COVERAGE & USAGE SCENARIO','样本覆盖与跨境使用场景','当前真实样本只覆盖广东侧用户访问香港网络。',(dashboard.value.flows??[]).map(flow=>metric('粤 → 港',formatBytes(flow.totalBytes??0,2),`${number(flow.userCount)} 位用户 · ${number(flow.completedCount)} 条记录`)),['单侧样本不表达为双向业务量。','未提供的对侧数据标记为覆盖边界。','本模块不用于双边结算稽核。']))
  catalog.set('opportunities',story('AUDIENCE OPPORTUNITIES','重点客群与运营机会','将真实使用聚合转化为体验改善与经营候选。',[metric('高用量重点用户',`${number(value.highUsageUsers)} 人`,'用量提醒、大流量包与服务保障候选'),metric('低活跃召回候选',`${number(value.recallCandidates)} 人`,'激活引导与回归权益候选'),metric('价值提升候选',`${number(value.growthCandidates)} 人`,'套餐匹配与阶梯权益候选')],['候选规模来自月度多标签行为规则。','实际触达必须经过业务校验。','运营效果需要后续转化数据验证。']))
  catalog.set('risk-ranking',story('HIGH-USAGE CUSTOMER FOCUS','高用量重点关怀用户 TOP 10','按当前周期用户总流量排序的脱敏聚合画像。',(dashboard.value.highValueRecords??[]).slice(0,3).map(record=>metric(record.phone,formatBytes(record.totalBytes,2),`${record.activeDays} 个活跃日 · 流量贡献 ${percent(record.trafficShare)}`)),['单击打开侧边画像，双击进入居中放大画像。','流量排序不代表收入、信用或社会身份。','页面不发布号码明文、IMSI、IP 或位置明细。']))
  catalog.set('recent-focus',story('RECENT CUSTOMER FOCUS','近期重点关怀用户','在高用量用户中按最后活跃日期排序。',(dashboard.value.recentFocusUsers??[]).slice(0,3).map(record=>metric(record.lastActiveDay,record.phone,`${record.activeDays} 个活跃日 · ${record.status}`)),['近期活跃只表示样本中的最后记录日期。','列表不冒充实时告警。','双击样本进入同一份脱敏画像。']))
  catalog.set('experience-path',story('EXPERIENCE IMPROVEMENT','用户体验改善路径','从激活体验、套餐适配到重点用户服务保障。',[metric('激活体验',`${number(value.recallCandidates)} 人`,'低活跃候选的首次使用引导'),metric('套餐适配',`${number(value.growthCandidates)} 人`,'匹配日包、周包或阶梯权益'),metric('服务保障',`${number(value.highUsageUsers)} 人`,'高用量用户预警、客服与网络保障')],['改善路径是建议动作，不是已发生效果。','每一步需要触达权限和效果评估。','后续可接入工单与转化数据。']))
  catalog.set('value-conversion',story('COMPANY VALUE CONVERSION','公司价值转化','从体验改善延伸到客户价值提升的候选路径。',[metric('头部流量贡献',percent(value.headTrafficShare),'Top 10% 高用量用户的真实聚合贡献'),metric('企业场景候选',`${number(value.enterpriseCandidates)} 人`,'需结合企业身份与授权数据验证'),metric('高频商旅候选',`${number(value.frequentTravelCandidates)} 人`,'需结合出行与套餐数据验证')],['价值路径包括召回、套餐升级、企业试点和重点服务。','机会规模不等同于实际收入。','正式评估需补充触达与转化结果。']))
  catalog.set('pipeline-health',story('DATA TRUST & SCOPE','数据可信度与适用边界','展示样本、字段、映射、时间质量和对侧覆盖状态。',(dashboard.value.pipeline??[]).slice(0,3).map(item=>metric(item.label,item.latency,item.description)),['绿色状态表示当前检查通过。','警示状态表示数据适用边界。','对侧样本未提供，不开展双边结算推断。']))
  for(const record of combinedRecords.value)catalog.set(`record-${record.id}`,{eyebrow:'MASKED CUSTOMER PROFILE',title:record.id,subtitle:`${record.homeRegion} → ${record.visitedRegion} · 最后活跃 ${record.lastActiveDay}`,record})
  return catalog
})
const activeDetail=computed(()=>routeDetailId.value?(detailCatalog.value.get(routeDetailId.value)??story('DETAIL ROUTE','未找到详情','当前筛选条件下没有这条详情数据。',[],['返回驾驶舱后重新选择卡片。'])):null)
</script>

<template><div class="dashboard-shell" :class="{'is-focus-open':activeDetail}"><div class="ambient ambient-one"></div><div class="ambient ambient-two"></div><DashboardHeader :source="dashboard?.source" :filters="filters" :tour-state="tour.state.value" :tour-step="tour.stepIndex.value" :tour-total="tour.totalSteps" @range-change="changeRange" @segment-change="changeSegment" @tour-start="tour.start" @tour-pause="tour.pause" @tour-resume="tour.resume" @tour-restart="tour.restart"/><div v-if="loading&&!dashboard" class="loading-state" aria-live="polite"><span class="loading-ring"></span><strong>正在装载脱敏聚合数据</strong><small>StaticSampleDataAdapter · v2026.08.02</small></div><div v-else-if="error&&!dashboard" class="error-state" role="alert"><strong>数据装载失败</strong><span>{{ error }}</span><button type="button" @click="reload">重新加载</button></div><main v-if="dashboard" class="dashboard-content" :class="{'is-refreshing':loading}"><section class="kpi-grid" :class="{'tour-highlight':activeStep==='kpis'}" aria-label="核心洞察指标" data-testid="kpi-grid"><KpiCard v-for="(kpi,index) in dashboard.kpis" :key="kpi.id" :kpi="kpi" :index="index+1" :active="activeStep==='kpis'" @select="selectKpi" @open-detail="openDetail"/></section><section class="analytics-grid"><div class="left-column"><PanelFrame title="活跃用户与漫游流量趋势" eyebrow="ACTIVE USERS & ROAMING TRAFFIC" detail-id="traffic-trend" @open-detail="openDetail"><TrafficTrendChart :data="dashboard.trend"/></PanelFrame><PanelFrame title="用户体验行为信号" eyebrow="EXPERIENCE BEHAVIOR SIGNALS" :active="activeStep==='experience'" detail-id="experience-signals" @open-detail="openDetail"><template #header><span class="panel-badge">月度多标签</span></template><ExperienceSignals :data="dashboard.experienceSignals" :selected="filters.segment"/></PanelFrame></div><div class="center-column"><PanelFrame title="样本覆盖与跨境使用场景" eyebrow="SAMPLE COVERAGE & USAGE SCENARIO" :active="activeStep==='flow'" detail-id="flow-topology" @open-detail="openDetail"><template #header><span class="panel-badge">真实样本 / 单侧覆盖</span></template><RoamingFlowMap :flows="dashboard.flows" :active="activeStep==='flow'"/></PanelFrame><PanelFrame title="重点客群与运营机会" eyebrow="AUDIENCE OPPORTUNITIES" :active="activeStep==='value'" detail-id="opportunities" @open-detail="openDetail"><template #header><span class="threshold-note">候选群体可重叠</span></template><OpportunityPanel :value="dashboard.value"/></PanelFrame></div><div class="right-column"><PanelFrame title="高用量重点关怀用户 TOP 10" eyebrow="HIGH-USAGE CUSTOMER FOCUS" :active="activeStep==='ranking'" detail-id="risk-ranking" @open-detail="openDetail"><template #header><span class="panel-badge">流量贡献</span></template><HighValueRanking :records="dashboard.highValueRecords" @select="selectRecord" @open-detail="openDetail"/></PanelFrame><PanelFrame title="近期重点关怀用户" eyebrow="RECENT CUSTOMER FOCUS" compact detail-id="recent-focus" @open-detail="openDetail"><template #header><span class="queue-count">{{ dashboard.recentFocusUsers.length }} 个脱敏样本</span></template><RecentFocusList :records="dashboard.recentFocusUsers" @select="selectRecord" @open-detail="openDetail"/></PanelFrame></div></section><section class="bottom-grid"><PanelFrame title="用户体验改善路径" eyebrow="EXPERIENCE IMPROVEMENT" :active="activeStep==='experience'" compact detail-id="experience-path" @open-detail="openDetail"><template #header><span class="panel-badge">从行为信号到服务动作</span></template><ExperiencePathPanel :value="dashboard.value"/></PanelFrame><PanelFrame title="公司价值转化" eyebrow="COMPANY VALUE CONVERSION" :active="activeStep==='value'" compact detail-id="value-conversion" @open-detail="openDetail"><ValuePanel :value="dashboard.value"/></PanelFrame><PanelFrame title="数据可信度与适用边界" eyebrow="DATA TRUST & SCOPE" :active="activeStep==='pipeline'" compact detail-id="pipeline-health" @open-detail="openDetail"><PipelineStatus :items="dashboard.pipeline"/></PanelFrame></section></main><footer class="dashboard-footer"><span>指标口径：流量统一为 bytes · 文件标称周期 2026-07 · 客群为可重叠行为标签</span><span>真实静态样本 · 不进行双边结算稽核 · 运营效果需后续业务数据验证</span></footer><div v-if="tour.state.value!=='idle'" class="tour-status" aria-live="polite"><span class="tour-wave"></span><div><small>演示导览</small><strong>{{ tour.stepIndex.value+1 }} / {{ tour.totalSteps }} · {{ activeStep }}</strong></div></div><CdrDetailDrawer :record="selectedRecord" @close="selectedRecord=null"/></div><Transition name="focus"><DetailRouteView v-if="activeDetail" :detail="activeDetail" :origin="focusOrigin" @home="goHome"/></Transition></template>
