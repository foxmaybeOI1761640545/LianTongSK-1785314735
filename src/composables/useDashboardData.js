import { computed, onMounted, ref, watch } from 'vue'
import { dashboardDataAdapter } from '../services/dashboardDataAdapter.js'
import { DIRECTIONS } from '../utils/metrics.js'

export function useDashboardData() {
  const filters = ref({ range: 'all', direction: DIRECTIONS.ALL })
  const dashboard = ref(null)
  const loading = ref(true)
  const error = ref('')
  let requestId = 0

  async function load() {
    const activeRequest = ++requestId
    loading.value = true
    error.value = ''
    try {
      const result = await dashboardDataAdapter.loadDashboardData(filters.value)
      if (activeRequest === requestId) dashboard.value = result
    } catch (loadError) {
      if (activeRequest === requestId) error.value = loadError.message
    } finally {
      if (activeRequest === requestId) loading.value = false
    }
  }

  function setRange(range) {
    filters.value = { ...filters.value, range }
  }

  function setDirection(direction) {
    filters.value = { ...filters.value, direction }
  }

  watch(filters, load, { deep: true })
  onMounted(load)

  return {
    filters,
    dashboard,
    loading,
    error,
    hasData: computed(() => Boolean(dashboard.value)),
    setRange,
    setDirection,
    reload: load,
  }
}
