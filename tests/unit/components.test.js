import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import KpiCard from '../../src/components/KpiCard.vue'
import CdrDetailDrawer from '../../src/components/CdrDetailDrawer.vue'

describe('dashboard interactions', () => {
  it('exposes a complete accessible KPI label and emits selection', async () => {
    const wrapper = mount(KpiCard, {
      props: {
        kpi: { id: 'rate', label: '异常率', displayValue: '2.80%', trend: -1.2, definition: '异常/完成', tone: 'amber' },
      },
    })
    expect(wrapper.attributes('aria-label')).toContain('异常率：2.80%')
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('closes the evidence drawer with Escape', async () => {
    const wrapper = mount(CdrDetailDrawer, {
      props: {
        record: {
          id: 'CDR-1', direction: 'GD_TO_HK', time: '2026-07-29 10:00:00', riskScore: 90,
          anomalyType: '金额偏差', rule: 'R-1', phone: '139****0000', subscriberTier: '高价值个人', status: '待核查',
          homeRegion: '广东', visitedRegion: '香港', ggsn: 'HK-GGSN-02', gdBytes: 100, hkBytes: 80,
          gdAmount: 100, hkAmount: 140, differenceAmount: 40, cause: '原因', impact: '影响', suggestion: '建议',
        },
      },
      attachTo: document.body,
    })
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
