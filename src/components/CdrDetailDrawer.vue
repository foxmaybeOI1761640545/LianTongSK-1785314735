<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { formatCurrency } from '../utils/currency.js'
import { formatBytes, trafficDifferencePercent } from '../utils/traffic.js'

const props = defineProps({ record: { type: Object, default: null } })
const emit = defineEmits(['close'])

const directionLabel = computed(() => props.record?.direction === 'GD_TO_HK' ? '广东 → 香港' : '香港 → 广东')
const trafficGap = computed(() => props.record ? trafficDifferencePercent(props.record.gdBytes, props.record.hkBytes) : 0)

function handleKeydown(event) {
  if (event.key === 'Escape' && props.record) emit('close')
}

onMounted(() => globalThis.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => globalThis.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="record" class="drawer-layer" data-testid="cdr-drawer">
        <button class="drawer-backdrop" type="button" aria-label="关闭异常话单详情" @click="$emit('close')"></button>
        <aside class="cdr-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <header class="drawer-header">
            <div>
              <span>异常话单证据链</span>
              <h2 id="drawer-title">{{ record.id }}</h2>
              <p>{{ directionLabel }} · {{ record.time }}</p>
            </div>
            <button type="button" class="drawer-close" aria-label="关闭详情" @click="$emit('close')">×</button>
          </header>

          <div class="drawer-scroll">
            <div class="risk-banner">
              <div class="risk-gauge"><strong>{{ record.riskScore }}</strong><span>风险分</span></div>
              <div><span class="risk-type">{{ record.anomalyType }}</span><h3>{{ record.rule }}</h3><p>{{ record.phone }} · {{ record.subscriberTier }} · {{ record.status }}</p></div>
            </div>

            <section class="evidence-section">
              <div class="section-heading"><span>01</span><div><h3>双方话单证据</h3><p>同一会话逐字段交叉比对</p></div></div>
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
            </section>

            <section class="reasoning-section">
              <div class="section-heading"><span>02</span><div><h3>智能稽核解释</h3><p>规则驱动的原因、影响与动作闭环</p></div></div>
              <div class="reasoning-flow">
                <article><i>!</i><span>可能原因</span><p>{{ record.cause }}</p></article>
                <b>→</b>
                <article><i>¥</i><span>业务影响</span><p>{{ record.impact }}</p></article>
                <b>→</b>
                <article class="recommended"><i>✓</i><span>建议动作</span><p>{{ record.suggestion }}</p></article>
              </div>
            </section>

            <div class="drawer-note">本页面使用确定性演示数据；结论由 Demo 规则引擎生成，不代表生产 AI 模型已上线。</div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
