import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const pageUrl = process.argv[2]
if (!pageUrl || !pageUrl.startsWith('https://')) {
  throw new Error('Usage: npm run smoke:remote -- <https://pages-url>')
}

await mkdir('remote-artifacts', { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
})
const consoleErrors = []
const failedRequests = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('requestfailed', (request) => {
  failedRequests.push(`${request.method()} ${request.url()}`)
})

try {
  await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 120000 })
  await page.getByRole('heading', {
    name: '粤港一卡双号用户体验与价值运营驾驶舱',
  }).waitFor()
  await page.getByText('真实样本 · 静态脱敏聚合', { exact: true }).waitFor()
  await page.getByText('仅覆盖广东侧样本用户访问香港网络', { exact: true }).waitFor()
  await page.locator('[data-kpi="users"]').getByText('2,177', { exact: true }).waitFor()
  await page.locator('[data-kpi="recall"]').getByText('504', { exact: true }).waitFor()
  await page.locator('[data-kpi="concentration"]').getByText('90.44%', { exact: true }).waitFor()

  const firstMaskedPhone = await page
    .locator('[data-testid="high-value-ranking"] .rank-main strong')
    .first()
    .textContent()
  if (!/^1\d{2}\*{4}\d{4}$/.test(firstMaskedPhone ?? '')) {
    throw new Error(`Expected a masked real phone, received ${firstMaskedPhone}`)
  }

  await page.getByTestId('sample-boundary-card')
    .getByText('未提供对侧样本', { exact: true })
    .waitFor()
  await page.getByTestId('experience-path-panel')
    .getByText('01 · 激活体验', { exact: true })
    .waitFor()

  if (await page.locator('[data-testid="kpi-grid"] .kpi-card').count() !== 6) {
    throw new Error('Expected 6 KPIs')
  }
  if (await page.locator('canvas').count() < 2) {
    throw new Error('Expected at least 2 ECharts canvases')
  }

  const panel = page.locator('[data-detail-id="flow-topology"]')
  const originalRect = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height, text: element.textContent }
  })

  await panel.dblclick()
  await page.getByTestId('panel-focus-layer').waitFor()
  const focused = page.getByTestId('focused-panel')
  const focusedRect = await focused.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const host = element.closest('[data-testid="panel-focus-layer"]')
    return {
      width: rect.width,
      height: rect.height,
      text: element.textContent,
      scale: Number(host?.style.getPropertyValue('--panel-focus-scale')),
    }
  })

  if (!(focusedRect.scale > 1)) throw new Error('Expected focused panel scale to be greater than 1')
  if (Math.abs(focusedRect.width - originalRect.width * focusedRect.scale) > 2) {
    throw new Error('Focused panel width does not match the calculated scale')
  }
  if (Math.abs(focusedRect.height - originalRect.height * focusedRect.scale) > 2) {
    throw new Error('Focused panel height does not match the calculated scale')
  }
  if (focusedRect.text !== originalRect.text) {
    throw new Error('Focused panel content changed during proportional scaling')
  }

  await page.keyboard.press('Escape')
  await page.getByTestId('panel-focus-layer').waitFor({ state: 'hidden' })

  await page.locator('[data-testid="high-value-ranking"] .ranking-row').first().dblclick()
  await page.locator('[data-testid="detail-focus"]').waitFor()
  await page.keyboard.press('Escape')
  await page.locator('[data-testid="detail-focus"]').waitFor({ state: 'hidden' })

  await page.screenshot({
    path: 'remote-artifacts/dashboard-1920x1080.png',
    fullPage: true,
  })

  if (consoleErrors.length) {
    throw new Error(`Console errors: ${consoleErrors.join(' | ')}`)
  }
  if (failedRequests.length) {
    throw new Error(`Failed requests: ${failedRequests.join(' | ')}`)
  }

  console.log(`Remote smoke passed: ${pageUrl}`)
} finally {
  await browser.close()
}
