<script setup>
import { computed, onMounted, ref } from 'vue'
import { formatBytes } from '../utils/traffic.js'

const props = defineProps({
  detail: { type: Object, default: null },
  origin: { type: Object, default: () => ({ x: 50, y: 50 }) },
})

defineEmits(['home'])

const record = computed(() => props.detail?.record ?? null)
const weekdayShare = computed(() => `${((record.value?.weekdayShare ?? 0) * 100).toFixed(1)}%`)
const trafficShare = computed(() => `${((record.value?.trafficShare ?? 0) * 100).toFixed(2)}%`)
const dialogElement = ref(null)
const layerStyle = computed(() => ({
  '--focus-origin-x': `${props.origin.x}%`,
  '--focus-origin-y': `${props.origin.y}%`,
}))

onMounted(() => dialogElement.value?.focus())
</script>

<template>
  <div class="focus-layer" :style="layerStyle" data-testid="detail-focus">
    <button type="button" class="focus-backdrop" aria-label="关闭放大详情" @click="$emit('home')"></button>
    <main ref="dialogElement" class="detail-route" data-testid="detail-route" role="dialog" aria-modal="true" tabindex="-1" @dblclick="$emit('home')">
      <div class="detail-orbit"></div>
      <header class="detail-route-header">
        <div>
          <span>{{ detail?.eyebrow }}</span>
          <h1>{{ detail?.title }}</h1>
          <p>{{ detail?.subtitle }}</p>
        </div>
        <button type="button" class="detail-back" aria-label="返回驾驶舱" @click.stop="$emit('home')" @dblclick.stop>×</button>
      </header>

      <section v-if="record" class="detail-record-grid">
        <div class="risk-banner detail-risk">
          <div class="risk-gauge"><strong>{{ record.riskScore }}</strong><span>流量指数</span></div>
          <div><span class="risk-type">{{ record.anomalyType }}</span><h2>{{ record.rule }}</h2><p>{{ record.phone }} · {{ record.subscriberTier }} · {{ record.status }}</p></div>
        </div>

        <div class="section-heading detail-section-heading"><span>01</span><div><h3>真实聚合证据</h3><p>不包含号码明文、IMSI、IP 或位置明细</p></div></div>
        <div class="evidence-grid">
          <article class="evidence-card gd">
            <header><span>使用规模</span><em>源话单聚合</em></header>
            <dl>
              <div><dt>周期总流量</dt><dd>{{ formatBytes(record.totalBytes, 2) }}</dd></div>
              <div><dt>话单记录</dt><dd>{{ Number(record.recordCount).toLocaleString('zh-CN') }} 条</dd></div>
              <div><dt>活跃天数</dt><dd>{{ record.activeDays }} 天</dd></div>
              <div><dt>单条平均流量</dt><dd>{{ formatBytes(record.averageRecordBytes, 2) }}</dd></div>
            </dl>
          </article>
          <div class="evidence-compare"><span>TOP</span><strong>10%</strong><small>流量排序</small></div>
          <article class="evidence-card hk">
            <header><span>行为特征</span><em>规则推导</em></header>
            <dl>
              <div><dt>当前周期流量贡献</dt><dd>{{ trafficShare }}</dd></div>
              <div><dt>工作日流量占比</dt><dd>{{ weekdayShare }}</dd></div>
              <div><dt>用户归属 / 访问地</dt><dd>{{ record.homeRegion }} / {{ record.visitedRegion }}</dd></div>
              <div><dt>标签状态</dt><dd class="danger">{{ record.status }}</dd></div>
            </dl>
          </article>
        </div>

        <div class="section-heading detail-section-heading"><span>02</span><div><h3>画像规则说明</h3><p>从真实聚合指标到经营建议</p></div></div>
        <div class="reasoning-flow">
          <article><i>!</i><span>识别依据</span><p>{{ record.cause }}</p></article>
          <b>→</b>
          <article><i>¥</i><span>业务含义</span><p>{{ record.impact }}</p></article>
          <b>→</b>
          <article class="recommended"><i>✓</i><span>建议动作</span><p>{{ record.suggestion }}</p></article>
        </div>
      </section>

      <section v-else class="detail-analysis-grid">
        <article v-for="metric in detail?.metrics" :key="metric.label" class="detail-metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <p>{{ metric.note }}</p>
        </article>
        <article class="detail-story-card">
          <span>演示口径</span>
          <ul>
            <li v-for="item in detail?.bullets" :key="item">{{ item }}</li>
          </ul>
        </article>
      </section>
    </main>
  </div>
</template>
