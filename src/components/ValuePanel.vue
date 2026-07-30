<script setup>
import { formatCompactCurrency } from '../utils/currency.js'

defineProps({ value: { type: Object, default: () => ({}) } })
</script>

<template>
  <div class="value-panel" data-testid="value-panel">
    <div class="value-primary">
      <span class="value-icon">¥</span>
      <div><small>预计可追回金额</small><strong>{{ formatCompactCurrency(value.recoveredAmount) }}</strong></div>
      <em>演示测算</em>
    </div>
    <div class="value-metrics">
      <div><span>节省人工复核</span><strong>{{ Number(value.manualHoursSaved ?? 0).toLocaleString('zh-CN') }}h</strong></div>
      <div><span>待处置工单</span><strong>{{ value.pendingCases ?? 0 }}</strong></div>
    </div>
    <div class="value-action">
      <span>策略建议</span>
      <p>优先阻断单位换算与高价值差异话单，完成重算后再进入结算批次。</p>
      <small>规则引擎生成 · 非生产 AI 模型</small>
    </div>
  </div>
</template>
