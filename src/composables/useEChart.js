import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

use([
  BarChart,
  LineChart,
  PieChart,
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export function useEChart(elementRef, optionRef) {
  const chart = shallowRef(null)
  let observer = null

  function render() {
    if (!chart.value || !optionRef.value) return
    chart.value.setOption(optionRef.value, true)
  }

  onMounted(async () => {
    await nextTick()
    if (!elementRef.value) return
    chart.value = init(elementRef.value, null, { renderer: 'canvas' })
    render()
    observer = new ResizeObserver(() => chart.value?.resize())
    observer.observe(elementRef.value)
  })

  watch(optionRef, render, { deep: true })

  onBeforeUnmount(() => {
    observer?.disconnect()
    chart.value?.dispose()
    chart.value = null
  })

  return { chart }
}
