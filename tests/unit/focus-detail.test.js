import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import KpiCard from '../../src/components/KpiCard.vue'
import PanelFrame from '../../src/components/PanelFrame.vue'
import RoamingFlowMap from '../../src/components/RoamingFlowMap.vue'
import {
  resetSharedPanelFocusScale,
  sharedPanelFocusScale,
} from '../../src/composables/usePanelFocusScale.js'

beforeEach(() => {
  resetSharedPanelFocusScale()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  resetSharedPanelFocusScale()
})

function rect(width, height) {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }
}

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

  it('uses the flow topology panel scale for every proportional panel focus', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getRect() {
        if (this.dataset.detailId === 'flow-topology') return rect(800, 320)
        return rect(400, 250)
      })
    vi.stubGlobal('innerWidth', 1440)
    vi.stubGlobal('innerHeight', 900)

    const reference = mount(PanelFrame, {
      attachTo: document.body,
      props: {
        title: '样本覆盖与跨境使用场景',
        detailId: 'flow-topology',
      },
      slots: { default: '<div>reference body</div>' },
    })

    await nextTick()
    await nextTick()
    expect(sharedPanelFocusScale.value).toBe(1.6)

    const wrapper = mount(PanelFrame, {
      attachTo: document.body,
      props: {
        title: '活跃用户与漫游流量趋势',
        detailId: 'traffic-trend',
      },
      slots: { default: '<div data-testid="unchanged-panel-content">body</div>' },
    })

    await wrapper.find('.panel-frame').trigger('dblclick', {
      clientX: 320,
      clientY: 180,
    })

    expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({
      target: 'traffic-trend',
      mode: 'panel-scale',
      origin: { x: 320, y: 180 },
      panel: { width: 400, height: 250, scale: 1.6 },
    })

    await wrapper.setProps({ focused: true })

    const layer = document.querySelector('[data-testid="panel-focus-layer"]')
    const focusedPanel = document.querySelector('[data-testid="focused-panel"]')
    expect(layer?.style.getPropertyValue('--panel-focus-width')).toBe('400px')
    expect(layer?.style.getPropertyValue('--panel-focus-height')).toBe('250px')
    expect(layer?.style.getPropertyValue('--panel-focus-scale')).toBe('1.6')
    expect(
      focusedPanel
        ?.querySelector('[data-testid="unchanged-panel-content"]')
        ?.textContent,
    ).toBe('body')

    focusedPanel?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(wrapper.emitted('close-detail')).toHaveLength(1)

    wrapper.unmount()
    reference.unmount()
  })

  it('renders simplified Guangdong and multipart Hong Kong silhouettes', () => {
    const wrapper = mount(RoamingFlowMap, {
      props: {
        flows: [{
          direction: 'GD_TO_HK',
          completedCount: 31410,
          totalBytes: 23685836196,
          userCount: 2177,
        }],
      },
    })

    const guangdong = wrapper.find('[data-region-shape="guangdong"]')
    const hongKong = wrapper.find('[data-region-shape="hong-kong"]')

    expect(guangdong.exists()).toBe(true)
    expect(guangdong.findAll('path')).toHaveLength(3)
    expect(hongKong.exists()).toBe(true)
    expect(hongKong.findAll('path').length).toBeGreaterThanOrEqual(6)
    expect(wrapper.find('desc').text()).toContain('不作为行政边界或测绘依据')
  })
})
