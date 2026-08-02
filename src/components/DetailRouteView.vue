<script setup>
import { computed,onMounted,ref } from 'vue'
import { formatBytes } from '../utils/traffic.js'
const props=defineProps({detail:{type:Object,default:null},origin:{type:Object,default:()=>({x:50,y:50})}})
defineEmits(['home'])
const record=computed(()=>props.detail?.record??null)
const weekdayShare=computed(()=>`${((record.value?.weekdayShare??0)*100).toFixed(1)}%`)
const trafficShare=computed(()=>`${((record.value?.trafficShare??0)*100).toFixed(2)}%`)
const dialogElement=ref(null)
const layerStyle=computed(()=>({'--focus-origin-x':`${props.origin.x}%`,'--focus-origin-y':`${props.origin.y}%`}))
onMounted(()=>dialogElement.value?.focus())
</script>
<template><div class="focus-layer" :style="layerStyle" data-testid="detail-focus"><button type="button" class="focus-backdrop" aria-label="关闭放大详情" @click="$emit('home')"></button><main ref="dialogElement" class="detail-route" data-testid="detail-route" role="dialog" aria-modal="true" tabindex="-1" @dblclick.stop="$emit('home')"><div class="detail-orbit"></div><header class="detail-route-header"><div><span>{{ detail?.eyebrow }}</span><h1>{{ detail?.title }}</h1><p>{{ detail?.subtitle }}</p></div><button type="button" class="detail-back" aria-label="返回驾驶舱" @click.stop="$emit('home')" @dblclick.stop>×</button></header><section v-if="record" class="focus-record-grid"><article class="focus-profile-card"><span>脱敏重点用户</span><strong>{{ record.phone }}</strong><p>{{ record.focusType }} · {{ record.status }}</p></article><article class="focus-record-metric"><span>周期总流量</span><strong>{{ formatBytes(record.totalBytes,2) }}</strong><p>{{ Number(record.recordCount).toLocaleString('zh-CN') }} 条聚合话单</p></article><article class="focus-record-metric"><span>流量贡献</span><strong>{{ trafficShare }}</strong><p>{{ record.activeDays }} 个活跃日</p></article><article class="focus-record-metric"><span>工作日使用</span><strong>{{ weekdayShare }}</strong><p>{{ record.homeRegion }} → {{ record.visitedRegion }}</p></article><article class="focus-record-story"><span>识别依据</span><p>{{ record.cause }}</p><span>体验与业务含义</span><p>{{ record.impact }}</p><span>建议动作</span><p>{{ record.suggestion }}</p></article></section><section v-else class="detail-analysis-grid"><article v-for="metric in detail?.metrics" :key="metric.label" class="detail-metric-card"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><p>{{ metric.note }}</p></article><article class="detail-story-card"><span>演示口径</span><ul><li v-for="item in detail?.bullets" :key="item">{{ item }}</li></ul></article></section></main></div></template>
