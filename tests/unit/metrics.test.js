import { describe,expect,it } from 'vitest'
import { createExperienceKpis,DIRECTIONS,SEGMENTS } from '../../src/utils/metrics.js'
import { formatBytes } from '../../src/utils/traffic.js'

describe('experience-and-value metric contract',()=>{
  it('keeps direction and supported segments explicit',()=>{expect(DIRECTIONS).toEqual({GD_TO_HK:'GD_TO_HK'});expect(Object.keys(SEGMENTS)).toEqual(['ALL','HIGH_USAGE','RECALL','GROWTH','ENTERPRISE'])})
  it('creates six evidence-backed KPIs without inventing a comparison period',()=>{const kpis=createExperienceKpis({records:31410,bytes:23685836196,users:2177,top10Count:218,top10TrafficShare:.9044392579485016},{recallCandidates:504});expect(kpis.map(item=>item.id)).toEqual(['users','traffic','averageTraffic','highUsage','recall','concentration']);expect(kpis.find(item=>item.id==='averageTraffic').displayValue).toBe('10.4 MB');expect(kpis.find(item=>item.id==='concentration').displayValue).toBe('90.44%');expect(kpis.every(item=>item.trend===null)).toBe(true)})
  it('formats traffic using binary units',()=>{expect(formatBytes(10*1024**3)).toBe('10.0 GB')})
})
