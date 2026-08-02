<script setup>
defineProps({value:{type:Object,default:()=>({})}})
const opportunities=[{id:'HIGH_USAGE',label:'高用量重点用户',key:'highUsageUsers',action:'用量提醒 · 大流量包 · 服务保障',tone:'indigo'},{id:'RECALL',label:'低活跃召回候选',key:'recallCandidates',action:'激活引导 · 回归权益 · 原因调研',tone:'amber'},{id:'GROWTH',label:'价值提升候选',key:'growthCandidates',action:'套餐匹配 · 阶梯权益 · 场景推荐',tone:'cyan'},{id:'ENTERPRISE',label:'企业场景候选',key:'enterpriseCandidates',action:'跨境月卡 · 企业共享 · 试点验证',tone:'green'}]
</script>
<template><div class="opportunity-grid" data-testid="opportunity-panel"><article v-for="item in opportunities" :key="item.id" :class="['opportunity-card',`opportunity-${item.tone}`,{selected:value.selectedSegment===item.id}]"><span>{{ item.label }}</span><strong>{{ Number(value[item.key]??0).toLocaleString('zh-CN') }}<small>人</small></strong><p>{{ item.action }}</p></article></div></template>
