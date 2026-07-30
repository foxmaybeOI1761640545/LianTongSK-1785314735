export class ApiDataAdapter {
  constructor({ endpoint, fetcher = globalThis.fetch } = {}) {
    this.endpoint = endpoint
    this.fetcher = fetcher
  }

  async loadDashboardData(filters) {
    if (!this.endpoint) throw new Error('API endpoint is not configured')
    const url = new URL(this.endpoint)
    url.searchParams.set('range', filters.range)
    url.searchParams.set('direction', filters.direction)
    const response = await this.fetcher(url)
    if (!response.ok) throw new Error(`Dashboard API request failed: ${response.status}`)
    return response.json()
  }
}
