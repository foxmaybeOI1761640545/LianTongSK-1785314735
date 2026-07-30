<script setup>
defineProps({ records: { type: Array, default: () => [] } })
defineEmits(['select'])
</script>

<template>
  <div class="recent-list" data-testid="recent-anomalies">
    <button v-for="record in records" :key="record.id" type="button" class="recent-row" @click="$emit('select', record)">
      <span :class="['status-dot', record.status === '处理中' ? 'processing' : 'pending']"></span>
      <span class="recent-time">{{ record.time.slice(11, 16) }}</span>
      <span class="recent-content"><strong>{{ record.anomalyType }}</strong><small>{{ record.id }}</small></span>
      <span class="recent-status">{{ record.status }}</span>
    </button>
    <div v-if="!records.length" class="empty-state">暂无最新异常话单</div>
  </div>
</template>
