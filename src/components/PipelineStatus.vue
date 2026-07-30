<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>

<template>
  <div class="pipeline" data-testid="pipeline-status">
    <div v-for="(item, index) in items" :key="item.id" class="pipeline-node">
      <div :class="['node-icon', item.status]">
        <span v-if="item.status === 'healthy'">✓</span><span v-else>!</span>
      </div>
      <div class="node-copy"><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div>
      <div class="node-latency"><b>{{ item.latency }}</b><small>{{ item.status === 'healthy' ? '正常' : '关注' }}</small></div>
      <div v-if="index < items.length - 1" class="node-link"><i></i></div>
    </div>
  </div>
</template>
