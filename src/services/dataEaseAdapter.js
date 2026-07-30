export class DataEaseAdapter {
  constructor(config = {}) {
    this.config = config
  }

  get isConfigured() {
    return Boolean(this.config.publicEndpoint)
  }

  async loadDashboardData() {
    if (!this.isConfigured) {
      const error = new Error('DataEase adapter is not configured')
      error.code = 'DATAEASE_NOT_CONFIGURED'
      throw error
    }
    throw new Error('正式 DataEase 字段映射将在数据源下发后实现')
  }
}
