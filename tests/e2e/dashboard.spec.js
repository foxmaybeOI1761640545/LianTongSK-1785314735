import { expect, test } from '@playwright/test'

test('loads the complete data insight dashboard without console errors', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('')
  await expect(page.getByRole('heading', {
    name: '粤港一卡双号用户体验与价值运营驾驶舱',
  })).toBeVisible()
  await expect(page.getByText('真实样本 · 静态脱敏聚合', { exact: true })).toBeVisible()
  await expect(page.locator('[data-kpi="users"]')).toContainText('2,177')
  await expect(page.locator('[data-kpi="recall"]')).toContainText('504')
  await expect(page.locator('[data-kpi="concentration"]')).toContainText('90.44%')
  await expect(page.getByTestId('experience-path-panel')).toContainText('激活体验')
  await expect(page.getByTestId('opportunity-panel')).toContainText('企业场景候选')
  await expect(page.getByTestId('kpi-grid').locator('.kpi-card')).toHaveCount(6)
  await expect(page.locator('canvas')).toHaveCount(2)
  await expect(page.getByTestId('flow-map')).toBeVisible()
  await expect(page.getByTestId('sample-boundary-card')).toContainText('未提供对侧样本')
  expect(consoleErrors).toEqual([])
})

test('links audience focus and evidence drawer', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('segment-filter').selectOption('RECALL')
  await expect(page.getByTestId('opportunity-panel').locator('.selected'))
    .toContainText('低活跃召回候选')

  await page.getByTestId('high-value-ranking').locator('.ranking-row').first().click()
  await expect(page.getByTestId('cdr-drawer')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('cdr-drawer')).toBeHidden()
})

test('scales the original panel proportionally without replacing its content', async ({ page }) => {
  await page.goto('')

  const panel = page.locator('[data-detail-id="flow-topology"]')
  const before = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
      text: element.textContent,
      canvasCount: element.querySelectorAll('canvas').length,
    }
  })

  await panel.dblclick()
  await expect(page.getByTestId('panel-focus-layer')).toBeVisible()
  await expect(page.getByTestId('focused-panel')).toHaveAttribute('data-detail-id', 'flow-topology')
  await expect(page).toHaveURL(/#\/detail\/flow-topology$/)

  const after = await page.getByTestId('focused-panel').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const host = element.closest('[data-testid="panel-focus-layer"]')
    return {
      width: rect.width,
      height: rect.height,
      text: element.textContent,
      canvasCount: element.querySelectorAll('canvas').length,
      scale: Number(host?.style.getPropertyValue('--panel-focus-scale')),
    }
  })

  expect(after.scale).toBeGreaterThan(1)
  expect(after.width).toBeCloseTo(before.width * after.scale, 0)
  expect(after.height).toBeCloseTo(before.height * after.scale, 0)
  expect(after.width / after.height).toBeCloseTo(before.width / before.height, 2)
  expect(after.text).toBe(before.text)
  expect(after.canvasCount).toBe(before.canvasCount)

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('panel-focus-layer')).toBeHidden()
  await expect(panel).toBeVisible()
})

test('keeps KPI and customer drilldowns on the structured detail route', async ({ page }) => {
  await page.goto('')

  await page.locator('[data-kpi="users"]').dblclick()
  await expect(page.getByTestId('detail-focus')).toBeVisible()
  await expect(page.getByTestId('detail-route')).toContainText('活跃用户')
  await page.keyboard.press('Escape')

  await page.getByTestId('high-value-ranking').locator('.ranking-row').first().dblclick()
  await expect(page.getByTestId('detail-focus')).toBeVisible()
  await expect(page.getByTestId('detail-route')).toContainText('脱敏重点用户')
})

test('starts pauses and resumes guided demo mode', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('tour-start').click()
  await expect(page.getByText('演示导览')).toBeVisible()
  await page.getByRole('button', { name: '暂停演示' }).click()
  await expect(page.getByRole('button', { name: '继续演示' })).toBeVisible()
  await page.getByRole('button', { name: '继续演示' }).click()
  await expect(page.getByRole('button', { name: '暂停演示' })).toBeVisible()
})
