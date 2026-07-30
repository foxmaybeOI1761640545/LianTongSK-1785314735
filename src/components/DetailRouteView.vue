<script setup>
import { computed } from 'vue'
import { formatCurrency } from '../utils/currency.js'
import { formatBytes, trafficDifferencePercent } from '../utils/traffic.js'

const props = defineProps({
  detail: { type: Object, default: null },
})

defineEmits(['home'])

const record = computed(() => props.detail?.record ?? null)
const trafficGap = computed(() => record.value ? trafficDifferencePercent(record.value.gdBytes, record.value.hkBytes) : 0)
</script>

<template>
  <main class="detail-route" data-testid="detail-route" @dblclick="$emit('home')">
    <div class="detail-orbit"></div>
    <header class="detail-route-header">
      <div>
        <span>{{ detail?.eyebrow }}</span>
        <h1>{{ detail?.title }}</h1>
        <p>{{ detail?.subtitle }}</p>
      </div>
      <button type="button" class="detail-back" aria-label="返回根路由" @click="$emit('home')">×</button>
    </header>

    <section v-if="record" class="detail-record-grid">
      <div class="risk-banner detail-risk">
        <div class="risk-gauge"><strong>{{ record.riskScore }}</strong><span>风险分</span></div>
        <div><span class="risk-type">{{ record.anomalyType }}</span><h2>{{ record.rule }}</h2><p>{{ record.phone }} · {{ record.subscriberTier }} · {{ record.status }}</p></div>
      </div>

      <div class="evidence-grid">
        <article class="evidence-card gd">
          <header><span>广东侧 CDR</span><em>{{ record.homeRegion === '广东' ? '用户归属侧' : '用户访问侧' }}</em></header>
          <dl>
            <div><dt>报文来源</dt><dd>广东 GGSN</dd></div>
            <div><dt>流量</dt><dd>{{ formatBytes(record.gdBytes, 2) }}</dd></div>
            <div><dt>计费金额</dt><dd>{{ formatCurrency(record.gdAmount) }}</dd></div>
            <div><dt>用户归属 / 上网地</dt><dd>{{ record.homeRegion }} / {{ record.visitedRegion }}</dd></div>
          </dl>
        </article>
        <div class="evidence-compare"><span>VS</span><strong>{{ trafficGap.toFixed(1) }}%</strong><small>流量差异率</small></div>
        <article class="evidence-card hk">
          <header><span>香港侧 CDR</span><em>{{ record.homeRegion === '香港' ? '用户归属侧' : '用户访问侧' }}</em></header>
          <dl>
            <div><dt>报文来源</dt><dd>{{ record.ggsn }}</dd></div>
            <div><dt>流量</dt><dd>{{ formatBytes(record.hkBytes, 2) }}</dd></div>
            <div><dt>计费金额</dt><dd>{{ formatCurrency(record.hkAmount) }}</dd></div>
            <div><dt>金额差异</dt><dd class="danger">{{ formatCurrency(record.differenceAmount) }}</dd></div>
          </dl>
        </article>
      </div>

      <div class="reasoning-flow">
        <article><i>!</i><span>可能原因</span><p>{{ record.cause }}</p></article>
        <b>→</b>
        <article><i>¥</i><span>业务影响</span><p>{{ record.impact }}</p></article>
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
</template>
