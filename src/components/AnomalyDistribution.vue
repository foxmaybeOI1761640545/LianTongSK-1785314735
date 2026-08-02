<script setup>
defineProps({ data: { type: Array, default: () => [] } })
</script>

<template>
  <ul class="quality-check-list" data-testid="quality-check-list" aria-label="数据质量横向检查列表">
    <li v-for="item in data" :key="item.id ?? item.name" :class="`level-${item.level ?? 'notice'}`">
      <span class="quality-status" aria-hidden="true"></span>
      <span class="quality-copy"><strong>{{ item.name }}</strong><small>{{ item.note }}</small></span>
      <span class="quality-value"><b>{{ Number(item.value).toLocaleString('zh-CN') }}</b><small>{{ item.unit }}</small></span>
    </li>
    <li v-if="!data.length" class="quality-empty">当前筛选方向未提供可检查样本</li>
  </ul>
</template>
