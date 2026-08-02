<script setup>
import { computed } from 'vue'
import { formatCompactCurrency } from '../utils/currency.js'

const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  scenario: { type: Object, default: () => ({}) },
})
const estimatedExpense = computed(() => Number.isFinite(props.summary.hkPayable) ? props.summary.hkPayable : null)
</script>

<template>
  <div class="settlement-panel" data-testid="settlement-panel">
    <div class="settlement-figure expense">
      <span>样本侧估算支出</span>
      <strong>{{ estimatedExpense === null ? '未覆盖' : formatCompactCurrency(estimatedExpense) }}</strong>
      <small>{{ estimatedExpense === null ? '当前方向没有样本' : `十进制流量 × ¥${scenario.rateCnyPerGB ?? 0} / GB` }}</small>
      <i v-if="estimatedExpense !== null"><b style="width: 100%"></b></i>
    </div>
    <div class="settlement-net unavailable">
      <span>对侧收入</span>
      <strong>未提供</strong>
      <small>缺少香港归属用户反向话单</small>
    </div>
    <div class="settlement-net unavailable">
      <span>双向结算净额</span>
      <strong>暂不可计算</strong>
      <small>对侧数据到齐后再进行轧差</small>
    </div>
  </div>
</template>
