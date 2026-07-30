import { expect, test } from '@playwright/test'

test('loads the complete audit dashboard without console errors', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  await page.goto('')
  await expect(page.getByRole('heading', { name: '粤港一卡双号漫游话单智能稽核驾驶舱' })).toBeVisible()
  await expect(page.getByText('演示数据', { exact: true })).toBeVisible()
  await expect(page.getByTestId('kpi-grid').locator('.kpi-card')).toHaveCount(6)
  await expect(page.locator('canvas')).toHaveCount(3)
  await expect(page.getByTestId('flow-map')).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('links direction filter, risk ranking and evidence drawer', async ({ page }) => {
  await page.goto('')
  await page.getByTestId('flow-gd-hk').click()
  await expect(page.getByTestId('direction-filter')).toHaveValue('GD_TO_HK')
  await page.getByTestId('high-value-ranking').locator('.ranking-row').first().click()
  await expect(page.getByTestId('cdr-drawer')).toBeVisible()
  await expect(page.getByText('双方话单证据')).toBeVisible()
  await expect(page.getByText('智能稽核解释')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('cdr-drawer')).toBeHidden()
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
