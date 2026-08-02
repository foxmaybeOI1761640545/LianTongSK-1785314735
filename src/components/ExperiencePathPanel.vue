<script setup>
defineProps({value:{type:Object,default:()=>({})}})
</script>
<template><div class="experience-path" data-testid="experience-path-panel"><article><span>01 · 激活体验</span><strong>{{ Number(value.recallCandidates??0).toLocaleString('zh-CN') }}人</strong><p>识别低活跃候选，提供首次使用引导与轻量召回权益</p></article><b>→</b><article><span>02 · 套餐适配</span><strong>{{ Number(value.growthCandidates??0).toLocaleString('zh-CN') }}人</strong><p>根据使用强度推荐日包、周包或阶梯流量权益</p></article><b>→</b><article><span>03 · 服务保障</span><strong>{{ Number(value.highUsageUsers??0).toLocaleString('zh-CN') }}人</strong><p>面向高用量用户提供预警、客服与跨境网络保障</p></article></div></template>
