import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const pageUrl = process.argv[2]
if (!pageUrl || !pageUrl.startsWith('https://')) {
  throw new Error('Usage: npm run smoke:remote -- <https://pages-url>')
}

await mkdir('remote-artifacts', { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const consoleErrors = []
const failedRequests = []
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`))

try {
  await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 120000 })
  await page.getByRole('heading', { name: '粤港一卡双号漫游话单智能稽核驾驶舱' }).waitFor()
  await page.getByText('演示数据', { exact: true }).waitFor()
  const kpiCount = await page.locator('[data-testid="kpi-grid"] .kpi-card').count()
  if (kpiCount !== 6) throw new Error(`Expected 6 KPIs, received ${kpiCount}`)
  if ((await page.locator('canvas').count()) < 3) throw new Error('Expected at least 3 ECharts canvases')
  await page.locator('[data-testid="high-value-ranking"] .ranking-row').first().click()
  await page.locator('[data-testid="cdr-drawer"]').waitFor()
  await page.keyboard.press('Escape')
  await page.locator('[data-testid="cdr-drawer"]').waitFor({ state: 'hidden' })
  await page.screenshot({ path: 'remote-artifacts/dashboard-1920x1080.png', fullPage: true })
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`)
  if (failedRequests.length) throw new Error(`Failed requests: ${failedRequests.join(' | ')}`)
  console.log(`Remote smoke passed: ${pageUrl}`)
} finally {
  await browser.close()
}
