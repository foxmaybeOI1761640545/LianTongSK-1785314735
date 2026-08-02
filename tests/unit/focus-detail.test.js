import { mount } from '@vue/test-utils'
import { describe,expect,it } from 'vitest'
import KpiCard from '../../src/components/KpiCard.vue'
import PanelFrame from '../../src/components/PanelFrame.vue'

describe('dashboard focus interactions',()=>{
  it('emits a detail payload when a KPI is double-clicked',async()=>{const kpi={id:'users',label:'活跃用户',displayValue:'2,177',tone:'cyan',definition:'真实聚合'};const wrapper=mount(KpiCard,{props:{kpi,index:1}});await wrapper.trigger('dblclick',{clientX:120,clientY:80});expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({target:kpi,origin:{x:120,y:80}})})
  it('emits its configured detail route when a panel is double-clicked',async()=>{const wrapper=mount(PanelFrame,{props:{title:'用户体验行为信号',detailId:'experience-signals'},slots:{default:'<div>body</div>'}});await wrapper.trigger('dblclick',{clientX:320,clientY:180});expect(wrapper.emitted('open-detail')?.[0]?.[0]).toEqual({target:'experience-signals',origin:{x:320,y:180}})})
})
