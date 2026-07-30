<script setup>
import { computed } from 'vue'

const props = defineProps({
  kpi: { type: Object, required: true },
  active: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

defineEmits(['select'])

const trendLabel = computed(() => `${props.kpi.trend >= 0 ? '较上期上升' : '较上期下降'} ${Math.abs(props.kpi.trend).toFixed(1)}%`)
</script>

<template>
  <button
    class="kpi-card"
    :class="[`tone-${kpi.tone}`, { 'is-active': active }]"
    type="button"
    :aria-label="`${kpi.label}：${kpi.displayValue}，${trendLabel}`"
    :data-kpi="kpi.id"
    @click="$emit('select', kpi)"
  >
    <span class="kpi-glow"></span>
    <span class="kpi-index">{{ String(index).padStart(2, '0') }}</span>
    <span class="kpi-label">{{ kpi.label }}</span>
    <strong class="kpi-value">{{ kpi.displayValue }}</strong>
    <span class="kpi-meta">
      <span :class="['trend', kpi.trendGood ? 'good' : 'bad']">{{ kpi.trend >= 0 ? '↗' : '↘' }} {{ Math.abs(kpi.trend).toFixed(1) }}%</span>
      <span>较上期</span>
    </span>
    <span class="kpi-definition">{{ kpi.definition }}</span>
  </button>
</template>
