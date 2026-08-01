<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { formatBytes } from '../utils/traffic.js'

const props = defineProps({ record: { type: Object, default: null } })
const emit = defineEmits(['close'])

const directionLabel = computed(() => props.record?.direction === 'GD_TO_HK' ? '广东侧用户 → 香港网络' : '香港用户 → 广东网络')
const weekdayShare = computed(() => `${((props.record?.weekdayShare ?? 0) * 100).toFixed(1)}%`)
const trafficShare = computed(() => `${((props.record?.trafficShare ?? 0) * 100).toFixed(2)}%`)

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
        <button class="drawer-backdrop" type="button" aria-label="关闭用户聚合画像" @click="$emit('close')"></button>
        <aside class="cdr-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <header class="drawer-header">
            <div>
              <span>脱敏用户聚合画像</span>
              <h2 id="drawer-title">{{ record.id }}</h2>
              <p>{{ directionLabel }} · 最后活跃 {{ record.lastActiveDay }}</p>
            </div>
            <button type="button" class="drawer-close" aria-label="关闭详情" @click="$emit('close')">×</button>
          </header>

          <div class="drawer-scroll">
            <div class="risk-banner">
              <div class="risk-gauge"><strong>{{ record.riskScore }}</strong><span>流量指数</span></div>
              <div><span class="risk-type">{{ record.anomalyType }}</span><h3>{{ record.rule }}</h3><p>{{ record.phone }} · {{ record.subscriberTier }} · {{ record.status }}</p></div>
            </div>

            <section class="evidence-section">
              <div class="section-heading"><span>01</span><div><h3>真实聚合证据</h3><p>不包含号码、IMSI、IP 或位置明细</p></div></div>
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
            </section>

            <section class="reasoning-section">
              <div class="section-heading"><span>02</span><div><h3>画像规则说明</h3><p>从真实聚合指标到经营建议</p></div></div>
              <div class="reasoning-flow">
                <article><i>!</i><span>识别依据</span><p>{{ record.cause }}</p></article>
                <b>→</b>
                <article><i>¥</i><span>业务含义</span><p>{{ record.impact }}</p></article>
                <b>→</b>
                <article class="recommended"><i>✓</i><span>建议动作</span><p>{{ record.suggestion }}</p></article>
              </div>
            </section>

            <div class="drawer-note">本抽屉展示真实样本的脱敏用户聚合；价值分和经营建议属于规则推导，不代表生产模型或用户身份认定。</div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
