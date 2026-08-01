<script setup>
import { formatBytes } from '../utils/traffic.js'

defineProps({ records: { type: Array, default: () => [] } })
defineEmits(['select', 'open-detail'])

const directionLabel = (direction) => direction === 'GD_TO_HK' ? '粤 → 港' : '港 → 粤'
</script>

<template>
  <div class="ranking-list" data-testid="high-value-ranking">
    <button
      v-for="(record, index) in records"
      :key="record.id"
      type="button"
      class="ranking-row"
      :aria-label="`查看 ${record.id} 异常详情`"
      @click="$emit('select', record)"
      @dblclick.stop="$emit('open-detail', record)"
    >
      <span :class="['rank-number', { top: index < 3 }]">{{ String(index + 1).padStart(2, '0') }}</span>
      <span class="rank-main">
        <span><strong>{{ record.phone }}</strong><em>{{ directionLabel(record.direction) }}</em></span>
        <small>{{ formatBytes(record.totalBytes, 1) }} · {{ record.activeDays }} 个活跃日</small>
      </span>
      <span class="risk-score">
        <b>{{ record.riskScore }}</b>
        <i><span :style="{ width: `${record.riskScore}%` }"></span></i>
      </span>
    </button>
    <div v-if="!records.length" class="empty-state">当前筛选方向没有用户样本</div>
  </div>
</template>
