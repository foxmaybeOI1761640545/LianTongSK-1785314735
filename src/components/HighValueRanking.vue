<script setup>
import { onBeforeUnmount } from 'vue'
import { formatBytes } from '../utils/traffic.js'
defineProps({records:{type:Array,default:()=>[]}})
const emit=defineEmits(['select','open-detail'])
let selectTimer=null
function queueSelect(record){globalThis.clearTimeout(selectTimer);selectTimer=globalThis.setTimeout(()=>emit('select',record),220)}
function openDetail(record,event){globalThis.clearTimeout(selectTimer);emit('open-detail',{target:record,origin:{x:event.clientX,y:event.clientY}})}
onBeforeUnmount(()=>globalThis.clearTimeout(selectTimer))
const directionLabel=direction=>direction==='GD_TO_HK'?'粤 → 港':'港 → 粤'
</script>
<template><div class="ranking-list" data-testid="high-value-ranking"><button v-for="(record,index) in records" :key="record.id" type="button" class="ranking-row" :aria-label="`查看 ${record.phone} 用户画像`" @click="queueSelect(record)" @dblclick.stop="openDetail(record,$event)"><span :class="['rank-number',{top:index<3}]">{{ String(index+1).padStart(2,'0') }}</span><span class="rank-main"><span><strong>{{ record.phone }}</strong><em>{{ directionLabel(record.direction) }}</em></span><small>{{ formatBytes(record.totalBytes,1) }} · {{ record.activeDays }} 个活跃日</small></span><span class="contribution-score"><b>{{ (record.trafficShare*100).toFixed(2) }}%</b><small>流量贡献</small><i><span :style="{width:`${Math.min(record.trafficShare*1000,100)}%`}"></span></i></span></button><div v-if="!records.length" class="empty-state">当前周期暂无可发布的重点用户明细</div></div></template>
