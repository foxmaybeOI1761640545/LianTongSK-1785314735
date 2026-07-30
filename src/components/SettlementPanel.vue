<script setup>
import { computed } from 'vue'
import { formatCompactCurrency } from '../utils/currency.js'

const props = defineProps({ summary: { type: Object, default: () => ({}) } })
const net = computed(() => Number(props.summary.gdReceivable ?? 0) - Number(props.summary.hkPayable ?? 0))
const maxValue = computed(() => Math.max(props.summary.gdReceivable ?? 1, props.summary.hkPayable ?? 1))
</script>

<template>
  <div class="settlement-panel" data-testid="settlement-panel">
    <div class="settlement-figure income">
      <span>漫游结算收入</span>
      <strong>{{ formatCompactCurrency(summary.gdReceivable) }}</strong>
      <small>香港用户在广东漫游</small>
      <i><b :style="{ width: `${(summary.gdReceivable / maxValue) * 100}%` }"></b></i>
    </div>
    <div class="settlement-net">
      <span>结算净额</span>
      <strong :class="net >= 0 ? 'positive' : 'negative'">{{ formatCompactCurrency(net) }}</strong>
      <small>双方逐条稽核后</small>
    </div>
    <div class="settlement-figure expense">
      <span>漫游结算支出</span>
      <strong>{{ formatCompactCurrency(summary.hkPayable) }}</strong>
      <small>广东用户在香港漫游</small>
      <i><b :style="{ width: `${(summary.hkPayable / maxValue) * 100}%` }"></b></i>
    </div>
  </div>
</template>
