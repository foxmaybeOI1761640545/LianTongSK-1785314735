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
  await page.locator('[data-kpi="concentration"]')
    .getByText('90.44%', { exact: true })
    .waitFor()

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
  if (await page.locator('[data-region-shape="guangdong"] path').count() < 3) {
    throw new Error('Expected the simplified Guangdong silhouette')
  }
  if (await page.locator('[data-region-shape="hong-kong"] path').count() < 6) {
    throw new Error('Expected the multipart Hong Kong silhouette')
  }

  const referencePanel = page.locator('[data-detail-id="flow-topology"]')
  const referenceBefore = await referencePanel.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
      title: element.querySelector('h2')?.textContent,
    }
  })

  await referencePanel.dblclick()
  await page.getByTestId('panel-focus-layer').waitFor()
  const referenceAfter = await page.getByTestId('focused-panel').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const host = element.closest('[data-testid="panel-focus-layer"]')
    return {
      width: rect.width,
      height: rect.height,
      title: element.querySelector('h2')?.textContent,
      scale: Number(host?.style.getPropertyValue('--panel-focus-scale')),
    }
  })

  if (!(referenceAfter.scale > 1)) {
    throw new Error('Expected the flow topology focus scale to be greater than 1')
  }
  if (Math.abs(referenceAfter.width - referenceBefore.width * referenceAfter.scale) > 2) {
    throw new Error('Reference panel width does not match its calculated scale')
  }
  if (Math.abs(referenceAfter.height - referenceBefore.height * referenceAfter.scale) > 2) {
    throw new Error('Reference panel height does not match its calculated scale')
  }
  if (referenceAfter.title !== referenceBefore.title) {
    throw new Error('Reference panel title changed during proportional scaling')
  }

  await page.keyboard.press('Escape')
  await page.getByTestId('panel-focus-layer').waitFor({ state: 'hidden' })

  const trendPanel = page.locator('[data-detail-id="traffic-trend"]')
  const trendBefore = await trendPanel.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
      title: element.querySelector('h2')?.textContent,
      canvasCount: element.querySelectorAll('canvas').length,
    }
  })

  await trendPanel.dblclick()
  await page.getByTestId('panel-focus-layer').waitFor()
  const trendAfter = await page.getByTestId('focused-panel').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const host = element.closest('[data-testid="panel-focus-layer"]')
    return {
      width: rect.width,
      height: rect.height,
      title: element.querySelector('h2')?.textContent,
      canvasCount: element.querySelectorAll('canvas').length,
      scale: Number(host?.style.getPropertyValue('--panel-focus-scale')),
    }
  })

  if (Math.abs(trendAfter.scale - referenceAfter.scale) > 0.00001) {
    throw new Error('Focused panels do not share the flow topology scale')
  }
  if (Math.abs(trendAfter.width - trendBefore.width * referenceAfter.scale) > 2) {
    throw new Error('Trend panel width does not use the shared scale')
  }
  if (Math.abs(trendAfter.height - trendBefore.height * referenceAfter.scale) > 2) {
    throw new Error('Trend panel height does not use the shared scale')
  }
  if (trendAfter.title !== trendBefore.title) {
    throw new Error('Focused panel title changed during proportional scaling')
  }
  if (trendAfter.canvasCount !== trendBefore.canvasCount) {
    throw new Error('Focused panel chart content changed during proportional scaling')
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
