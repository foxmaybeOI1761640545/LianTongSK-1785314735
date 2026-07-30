import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 4180 } })
await server.listen()
await mkdir('test-results/visual', { recursive: true })
const browser = await chromium.launch({ headless: true })

try {
  for (const [width, height] of [[1920, 1080], [1600, 900], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto('http://127.0.0.1:4180/LianTongSK-1785314735/', { waitUntil: 'networkidle' })
    await page.screenshot({ path: `test-results/visual/dashboard-${width}x${height}.png`, fullPage: true })
    await page.close()
  }
  const detailPage = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await detailPage.goto('http://127.0.0.1:4180/LianTongSK-1785314735/', { waitUntil: 'networkidle' })
  await detailPage.locator('[data-testid="high-value-ranking"] .ranking-row').first().click()
  await detailPage.locator('[data-testid="cdr-drawer"]').waitFor()
  await detailPage.waitForTimeout(400)
  await detailPage.screenshot({ path: 'test-results/visual/dashboard-detail-1600x900.png', fullPage: true })
  await detailPage.close()
} finally {
  await browser.close()
  await server.close()
}
