import { StaticSampleDataAdapter } from './staticSampleDataAdapter.js'
import { DataEaseAdapter } from './dataEaseAdapter.js'

const staticSampleAdapter = new StaticSampleDataAdapter()
const dataEaseAdapter = new DataEaseAdapter({
  publicEndpoint: import.meta.env.VITE_DATAEASE_PUBLIC_ENDPOINT,
})

export const dashboardDataAdapter = {
  async loadDashboardData(filters) {
    if (dataEaseAdapter.isConfigured) {
      try {
        return await dataEaseAdapter.loadDashboardData(filters)
      } catch (error) {
        if (import.meta.env.DEV) console.warn('DataEase adapter fallback:', error.message)
      }
    }
    return staticSampleAdapter.loadDashboardData(filters)
  },
}
