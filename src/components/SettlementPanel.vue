<script setup>
import { computed } from 'vue'
import { formatCompactCurrency } from '../utils/currency.js'

const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  scenario: { type: Object, default: () => ({}) },
})
const net = computed(() => Number(props.summary.gdReceivable ?? 0) - Number(props.summary.hkPayable ?? 0))
const maxValue = computed(() => Math.max(props.summary.gdReceivable ?? 0, props.summary.hkPayable ?? 0, 1))
</script>

<template>
  <div class="settlement-panel" data-testid="settlement-panel">
    <div class="settlement-figure income">
      <span>情景结算收入</span>
      <strong>{{ formatCompactCurrency(summary.gdReceivable) }}</strong>
      <small>样本无反向记录，按 ¥0 计</small>
      <i><b :style="{ width: `${(summary.gdReceivable / maxValue) * 100}%` }"></b></i>
    </div>
    <div class="settlement-net">
      <span>情景结算净额</span>
      <strong :class="net >= 0 ? 'positive' : 'negative'">{{ formatCompactCurrency(net) }}</strong>
      <small>假设 1 GB = ¥{{ scenario.rateCnyPerGiB ?? 0 }}</small>
    </div>
    <div class="settlement-figure expense">
      <span>情景结算支出</span>
      <strong>{{ formatCompactCurrency(summary.hkPayable) }}</strong>
      <small>真实流量 × ¥{{ scenario.rateCnyPerGiB ?? 0 }} / GB</small>
      <i><b :style="{ width: `${(summary.hkPayable / maxValue) * 100}%` }"></b></i>
    </div>
  </div>
</template>
