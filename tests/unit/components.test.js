import { mount } from '@vue/test-utils'
import { describe,expect,it } from 'vitest'
import KpiCard from '../../src/components/KpiCard.vue'
import CdrDetailDrawer from '../../src/components/CdrDetailDrawer.vue'

describe('dashboard interactions',()=>{
  it('exposes a complete accessible KPI label and emits selection',async()=>{const wrapper=mount(KpiCard,{props:{kpi:{id:'recall',label:'低活跃召回候选',displayValue:'504',trend:null,definition:'月度规则',tone:'amber'}}});expect(wrapper.attributes('aria-label')).toContain('低活跃召回候选：504');expect(wrapper.text()).toContain('样本快照');await wrapper.trigger('click');expect(wrapper.emitted('select')).toHaveLength(1)})
  it('closes the evidence drawer with Escape',async()=>{const wrapper=mount(CdrDetailDrawer,{props:{record:{id:'HV-ALL-001',direction:'GD_TO_HK',focusType:'高用量服务保障',rule:'Top 10%',phone:'131****6407',subscriberTier:'Top 10% 高用量重点用户',status:'建议关怀',homeRegion:'广东侧用户',visitedRegion:'香港网络',totalBytes:931157886,recordCount:1138,activeDays:13,lastActiveDay:'2026-07-31',averageRecordBytes:818240,trafficShare:.0393,weekdayShare:.9102,cause:'依据',impact:'影响',suggestion:'建议'}},attachTo:document.body});globalThis.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));expect(wrapper.emitted('close')).toHaveLength(1);wrapper.unmount()})
})
