import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import KpiCard from '../../src/components/KpiCard.vue'
import PanelFrame from '../../src/components/PanelFrame.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('dashboard focus interactions', () => {
  it('emits a detail payload when a KPI is double-clicked', async () => {
    const kpi = {
      id: 'users',
      label: '活跃用户',
      displayValue: '2,177',
      tone: 'cyan',
      definition: '真实聚合',
    }
    const wrapper = mount(KpiCard, { props: { kpi, index: 1 } })

    await wrapper.trigger('dblclick', { clientX: 120, clientY: 80 })

    expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({
      target: kpi,
      origin: { x: 120, y: 80 },
    })
  })

  it('calculates one scale from the original panel size and preserves the panel DOM', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 250,
      top: 0,
      left: 0,
      right: 400,
      bottom: 250,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.stubGlobal('innerWidth', 1440)
    vi.stubGlobal('innerHeight', 900)

    const wrapper = mount(PanelFrame, {
      attachTo: document.body,
      props: {
        title: '用户体验行为信号',
        detailId: 'experience-signals',
      },
      slots: { default: '<div data-testid="unchanged-panel-content">body</div>' },
    })

    await wrapper.find('.panel-frame').trigger('dblclick', { clientX: 320, clientY: 180 })

    expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({
      target: 'experience-signals',
      mode: 'panel-scale',
      origin: { x: 320, y: 180 },
      panel: { width: 400, height: 250, scale: 3.04 },
    })

    await wrapper.setProps({ focused: true })

    const layer = document.querySelector('[data-testid="panel-focus-layer"]')
    const focusedPanel = document.querySelector('[data-testid="focused-panel"]')
    expect(layer?.style.getPropertyValue('--panel-focus-width')).toBe('400px')
    expect(layer?.style.getPropertyValue('--panel-focus-height')).toBe('250px')
    expect(layer?.style.getPropertyValue('--panel-focus-scale')).toBe('3.04')
    expect(focusedPanel?.querySelector('[data-testid="unchanged-panel-content"]')?.textContent).toBe('body')

    focusedPanel?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(wrapper.emitted('close-detail')).toHaveLength(1)

    wrapper.unmount()
  })
})
