<script setup>
import { computed, ref } from 'vue'
import { useEChart } from '../composables/useEChart.js'

const props = defineProps({ data: { type: Array, default: () => [] } })
const chartElement = ref(null)
const colors = ['#45e6ff', '#4c8dff', '#786cff', '#ffbf5a', '#ff7184', '#48e1a8']
const option = computed(() => ({
  color: colors,
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 条 · {d}%', backgroundColor: 'rgba(4, 15, 30, .96)', borderColor: 'rgba(69, 230, 255, .35)', textStyle: { color: '#edf8ff' } },
  legend: { type: 'plain', orient: 'vertical', right: 2, top: 'center', itemWidth: 8, itemHeight: 8, itemGap: 8, textStyle: { color: '#8eaac2', fontSize: 10 } },
  series: [{
    type: 'pie', radius: ['48%', '72%'], center: ['31%', '52%'], avoidLabelOverlap: true,
    data: props.data, label: { show: false }, itemStyle: { borderColor: '#09162b', borderWidth: 2, borderRadius: 3 },
    emphasis: { scaleSize: 6 },
  }],
  graphic: [{ type: 'text', left: '26%', top: '44%', style: { text: `${props.data.reduce((sum, item) => sum + item.value, 0).toLocaleString('zh-CN')}\n异常`, textAlign: 'center', fill: '#edf8ff', font: '600 12px sans-serif', lineHeight: 18 } }],
}))
useEChart(chartElement, option)
</script>

<template><div ref="chartElement" class="chart-canvas" data-testid="distribution-chart" aria-label="异常类型分布图"></div></template>
