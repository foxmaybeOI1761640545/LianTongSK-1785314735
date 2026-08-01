<script setup>
import { computed, ref } from 'vue'
import { useEChart } from '../composables/useEChart.js'

const props = defineProps({ data: { type: Array, default: () => [] } })
const chartElement = ref(null)
const option = computed(() => ({
  animationDuration: 800,
  grid: { left: 42, right: 14, top: 18, bottom: 28 },
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value) => `${Number(value).toFixed(2)}%`,
    backgroundColor: 'rgba(4, 15, 30, .96)', borderColor: 'rgba(255, 191, 90, .4)', textStyle: { color: '#edf8ff' },
  },
  xAxis: {
    type: 'category', data: props.data.map((item) => item.date.slice(5)), boundaryGap: false,
    axisLine: { lineStyle: { color: 'rgba(105, 167, 205, .25)' } }, axisTick: { show: false },
    axisLabel: { color: '#6f91aa', fontSize: 10, interval: Math.max(0, Math.ceil(props.data.length / 6) - 1) },
  },
  yAxis: {
    type: 'value', min: (value) => Math.max(0, Math.floor(value.min - 0.5)), max: (value) => Math.ceil(value.max + 0.5),
    axisLabel: { color: '#6f91aa', fontSize: 10, formatter: '{value}%' },
    splitLine: { lineStyle: { color: 'rgba(80, 139, 177, .12)' } },
  },
  series: [{
    type: 'line', smooth: true, showSymbol: false, data: props.data.map((item) => Number(item.anomalyRate.toFixed(2))),
    lineStyle: { color: '#ffbf5a', width: 2.4, shadowBlur: 8, shadowColor: 'rgba(255, 191, 90, .45)' },
    areaStyle: {
      color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255, 173, 70, .30)' }, { offset: 1, color: 'rgba(255, 173, 70, 0)' }] },
    },
    markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0 }], lineStyle: { color: 'rgba(255, 95, 114, .6)', type: 'dashed' }, label: { color: '#ff8795', formatter: '理想值 0%' } },
  }],
}))
useEChart(chartElement, option)
</script>

<template><div ref="chartElement" class="chart-canvas" data-testid="anomaly-chart" aria-label="跨期记录率趋势图"></div></template>
