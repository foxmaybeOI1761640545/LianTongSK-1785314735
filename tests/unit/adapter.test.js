import { describe,expect,it } from 'vitest'
import { StaticSampleDataAdapter } from '../../src/services/staticSampleDataAdapter.js'

describe('StaticSampleDataAdapter',()=>{
  const adapter=new StaticSampleDataAdapter()
  it('returns the reconciled full-sample totals with a visible source boundary',async()=>{const first=await adapter.loadDashboardData({range:'all',segment:'ALL'});const second=await adapter.loadDashboardData({range:'all',segment:'ALL'});expect(first).toEqual(second);expect(first.source.kind).toBe('static-sample');expect(first.summary.recordCount).toBe(31410);expect(first.summary.totalBytes).toBe(23685836196);expect(first.summary.activeUsers).toBe(2177);expect(first.source.scope).toContain('仅覆盖广东侧样本用户访问香港网络');expect(first.source.disclaimer).toContain('不代表身份、收入或满意度认定');expect(first.settlement).toBeUndefined();expect(first.highValueRecords[0].phone).toBe('131****6407');expect(first.highValueRecords.every(record=>/^1\d{2}\*{4}\d{4}$/.test(record.phone))).toBe(true);expect(first.kpis).toHaveLength(6)})
  it('keeps range metrics and provenance signals internally consistent',async()=>{const data=await adapter.loadDashboardData({range:'7',segment:'RECALL'});expect(data.summary.recordCount).toBe(6409);expect(data.trend).toHaveLength(7);expect(data.kpis.find(kpi=>kpi.id==='highUsage').value).toBe(62);expect(data.experienceSignals.find(item=>item.id==='RECALL').value).toBe(504);expect(data.value.selectedSegment).toBe('RECALL')})
  it('represents missing counterpart data as a scope boundary instead of zero traffic',async()=>{const data=await adapter.loadDashboardData({range:'all',segment:'ALL'});expect(data.flows).toHaveLength(1);expect(data.flows[0].direction).toBe('GD_TO_HK');expect(data.flows[0].coverageNote).toContain('不用于双边结算稽核')})
})
