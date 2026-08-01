<script setup>
import { computed } from 'vue'

const props = defineProps({
  kpi: { type: Object, required: true },
  active: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

defineEmits(['select', 'open-detail'])

const hasTrend = computed(() => Number.isFinite(props.kpi.trend))
const trendLabel = computed(() => hasTrend.value
  ? `${props.kpi.trend >= 0 ? '较上期上升' : '较上期下降'} ${Math.abs(props.kpi.trend).toFixed(1)}%`
  : '当前筛选范围的样本快照')
</script>

<template>
  <button
    class="kpi-card"
    :class="[`tone-${kpi.tone}`, { 'is-active': active }]"
    type="button"
    :aria-label="`${kpi.label}：${kpi.displayValue}，${trendLabel}`"
    :data-kpi="kpi.id"
    @click="$emit('select', kpi)"
    @dblclick.stop="$emit('open-detail', kpi)"
  >
    <span class="kpi-glow"></span>
    <span class="kpi-index">{{ String(index).padStart(2, '0') }}</span>
    <span class="kpi-label">{{ kpi.label }}</span>
    <strong class="kpi-value">{{ kpi.displayValue }}</strong>
    <span class="kpi-meta">
      <template v-if="hasTrend">
        <span :class="['trend', kpi.trendGood ? 'good' : 'bad']">{{ kpi.trend >= 0 ? '↗' : '↘' }} {{ Math.abs(kpi.trend).toFixed(1) }}%</span>
        <span>较上期</span>
      </template>
      <template v-else>
        <span class="trend good">●</span>
        <span>样本快照</span>
      </template>
    </span>
    <span class="kpi-definition">{{ kpi.definition }}</span>
  </button>
</template>
