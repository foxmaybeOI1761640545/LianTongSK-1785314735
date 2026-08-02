<script setup>
defineProps({value:{type:Object,default:()=>({})}})
</script>
<template><div class="value-panel" data-testid="value-panel"><div class="value-primary"><span class="value-icon">↑</span><div><small>重点用户服务价值</small><strong>{{ ((value.headTrafficShare??0)*100).toFixed(2) }}%</strong></div><em>真实聚合</em></div><div class="value-metrics"><div><span>企业场景候选</span><strong>{{ Number(value.enterpriseCandidates??0).toLocaleString('zh-CN') }}人</strong></div><div><span>高频商旅候选</span><strong>{{ Number(value.frequentTravelCandidates??0).toLocaleString('zh-CN') }}人</strong></div></div><div class="value-action"><span>公司价值路径</span><p>以“召回留存、套餐升级、企业试点、重点服务”形成从使用体验改善到客户价值提升的闭环。</p><small>机会规模为行为规则候选 · 实际转化需结合套餐、收入与身份数据验证</small></div></div></template>
