import { expect, test } from '@playwright/test'

test('loads the complete data insight dashboard without console errors', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  await page.goto('')
  await expect(page.getByRole('heading', { name: '粤港一卡双号漫游数据洞察驾驶舱' })).toBeVisible()
  await expect(page.getByText('真实样本聚合', { exact: true })).toBeVisible()
  await expect(page.locator('[data-kpi="completed"]')).toContainText('31,410')
  await expect(page.locator('[data-kpi="users"]')).toContainText('2,177')
  await expect(page.locator('[data-kpi="concentration"]')).toContainText('90.44%')
  await expect(page.getByTestId('kpi-grid').locator('.kpi-card')).toHaveCount(6)
  await expect(page.locator('canvas')).toHaveCount(3)
  await expect(page.getByTestId('flow-map')).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('links direction filter, high-value ranking and evidence drawer', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('flow-gd-hk').click()
  await expect(page.getByTestId('direction-filter')).toHaveValue('GD_TO_HK')
  await page.getByTestId('high-value-ranking').locator('.ranking-row').first().click()
  await expect(page.getByTestId('cdr-drawer')).toBeVisible()
  await expect(page.getByText('真实聚合证据')).toBeVisible()
  await expect(page.getByText('画像规则说明')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('cdr-drawer')).toBeHidden()
})

test('opens and closes route-style detail pages with double click', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('kpi-grid').locator('.kpi-card').first().dblclick()
  await expect(page).toHaveURL(/#\/detail\/kpi-/)
  await expect(page.getByTestId('detail-route')).toBeVisible()
  await expect(page.getByText('KPI DRILLDOWN')).toBeVisible()
  await page.getByTestId('detail-route').dblclick()
  await expect(page).not.toHaveURL(/#\/detail\//)
  await expect(page.getByTestId('kpi-grid')).toBeVisible()
})

test('starts, pauses and resumes guided demo mode', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('tour-start').click()
  await expect(page.getByText('演示导览')).toBeVisible()
  await page.getByRole('button', { name: '暂停演示' }).click()
  await expect(page.getByRole('button', { name: '继续演示' })).toBeVisible()
  await page.getByRole('button', { name: '继续演示' }).click()
  await expect(page.getByRole('button', { name: '暂停演示' })).toBeVisible()
})
