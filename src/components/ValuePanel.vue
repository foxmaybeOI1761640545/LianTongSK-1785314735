<script setup>
defineProps({ value: { type: Object, default: () => ({}) } })
</script>

<template>
  <div class="value-panel" data-testid="value-panel">
    <div class="value-primary">
      <span class="value-icon">↑</span>
      <div><small>Top 10% 用户流量贡献</small><strong>{{ ((value.highValueTrafficShare ?? 0) * 100).toFixed(2) }}%</strong></div>
      <em>真实聚合</em>
    </div>
    <div class="value-metrics">
      <div><span>潜在流失预警</span><strong>{{ Number(value.churnWarningUsers ?? 0).toLocaleString('zh-CN') }}人</strong></div>
      <div><span>价值提升候选</span><strong>{{ Number(value.valueGrowthUsers ?? 0).toLocaleString('zh-CN') }}人</strong></div>
    </div>
    <div class="value-action">
      <span>策略建议</span>
      <p>以 {{ Number(value.b2bOpportunityUsers ?? 0).toLocaleString('zh-CN') }} 名 B 端机会用户验证企业版与跨境月卡；各画像为可重叠多标签。</p>
      <small>报告规则推导 · 需结合套餐与身份数据复核</small>
    </div>
  </div>
</template>
