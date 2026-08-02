<script setup>
import { onBeforeUnmount } from 'vue'
defineProps({records:{type:Array,default:()=>[]}})
const emit=defineEmits(['select','open-detail'])
let selectTimer=null
function queueSelect(record){globalThis.clearTimeout(selectTimer);selectTimer=globalThis.setTimeout(()=>emit('select',record),220)}
function openDetail(record,event){globalThis.clearTimeout(selectTimer);emit('open-detail',{target:record,origin:{x:event.clientX,y:event.clientY}})}
onBeforeUnmount(()=>globalThis.clearTimeout(selectTimer))
</script>
<template><div class="recent-list" data-testid="recent-focus-users"><button v-for="record in records" :key="record.id" type="button" class="recent-row" @click="queueSelect(record)" @dblclick.stop="openDetail(record,$event)"><span class="status-dot focus"></span><span class="recent-date">{{ record.lastActiveDay.slice(5) }}</span><span class="recent-content"><strong>{{ record.phone }}</strong><small>{{ record.activeDays }} 个活跃日 · {{ record.id }}</small></span><span class="recent-status">{{ record.status }}</span></button><div v-if="!records.length" class="empty-state">当前周期暂无重点关怀样本</div></div></template>
