<script setup>
import { computed } from 'vue'
import { formatBytes } from '../utils/traffic.js'

const props = defineProps({
  flows: { type: Array, default: () => [] },
  selected: { type: String, default: 'ALL' },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const gdToHk = computed(() => props.flows.find((flow) => flow.direction === 'GD_TO_HK') ?? {})
const hkToGd = computed(() => props.flows.find((flow) => flow.direction === 'HK_TO_GD') ?? {})

function toggleDirection(direction) {
  emit('select', props.selected === direction ? 'ALL' : direction)
}
</script>

<template>
  <div class="flow-map" :class="{ 'is-active': active }" data-testid="flow-map">
    <div class="flow-map-grid" aria-hidden="true"></div>
    <div class="map-caption">
      <span class="live-dot"></span>
      <span>粤港双向漫游流向 · 稽核链路实时态势</span>
    </div>

    <svg class="flow-svg" viewBox="0 0 760 330" role="img" aria-label="广东与香港双向漫游流量示意">
      <defs>
        <linearGradient id="regionGd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1d5d97" stop-opacity=".72" />
          <stop offset="1" stop-color="#18335c" stop-opacity=".35" />
        </linearGradient>
        <linearGradient id="regionHk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#274bb1" stop-opacity=".78" />
          <stop offset="1" stop-color="#2d245f" stop-opacity=".4" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <path id="pathGdHk" d="M310 155 C420 80 495 82 580 150" />
        <path id="pathHkGd" d="M580 196 C475 270 405 265 310 198" />
      </defs>

      <g class="region region-gd">
        <path d="M92 74l48-26 65 10 34 38 54 15 26 45-16 50-46 17-23 46-67-4-28-31-55-18-18-55 21-42z" fill="url(#regionGd)" stroke="#45e6ff" stroke-opacity=".62" />
        <circle cx="196" cy="166" r="54" fill="none" stroke="#45e6ff" stroke-opacity=".08" />
        <circle cx="196" cy="166" r="34" fill="none" stroke="#45e6ff" stroke-opacity=".12" />
        <circle cx="196" cy="166" r="5" fill="#45e6ff" filter="url(#glow)" />
        <text x="196" y="151" text-anchor="middle" class="region-name">广东</text>
        <text x="196" y="184" text-anchor="middle" class="region-sub">GUANGDONG</text>
      </g>

      <g class="region region-hk">
        <path d="M592 136l32-21 42 7 29 30-8 36 18 23-29 34-40 5-30-19-33-6-16-35 14-31z" fill="url(#regionHk)" stroke="#8a80ff" stroke-opacity=".72" />
        <circle cx="635" cy="184" r="48" fill="none" stroke="#8a80ff" stroke-opacity=".08" />
        <circle cx="635" cy="184" r="29" fill="none" stroke="#8a80ff" stroke-opacity=".12" />
        <circle cx="635" cy="184" r="5" fill="#8a80ff" filter="url(#glow)" />
        <text x="635" y="173" text-anchor="middle" class="region-name">香港</text>
        <text x="635" y="205" text-anchor="middle" class="region-sub">HONG KONG</text>
      </g>

      <use href="#pathGdHk" class="flow-line flow-line--cyan" />
      <use href="#pathHkGd" class="flow-line flow-line--violet" />
      <circle r="5" fill="#69efff" filter="url(#glow)"><animateMotion dur="2.5s" repeatCount="indefinite"><mpath href="#pathGdHk" /></animateMotion></circle>
      <circle r="4" fill="#9b91ff" filter="url(#glow)"><animateMotion dur="2.9s" repeatCount="indefinite"><mpath href="#pathHkGd" /></animateMotion></circle>

      <g transform="translate(410 142)">
        <rect x="-67" y="-20" width="134" height="39" rx="19" class="route-label-bg" />
        <text text-anchor="middle" y="5" class="route-label">跨域 CDR 交叉稽核</text>
      </g>
    </svg>

    <div class="flow-direction-cards">
      <button
        type="button"
        :class="['direction-card', 'cyan', { selected: selected === 'GD_TO_HK' }]"
        data-testid="flow-gd-hk"
        @click="toggleDirection('GD_TO_HK')"
      >
        <span class="direction-title">广东 <b>→</b> 香港</span>
        <strong>{{ formatBytes(gdToHk.totalBytes) }}</strong>
        <span>{{ Number(gdToHk.completedCount ?? 0).toLocaleString('zh-CN') }} 条 · 异常率 {{ Number(gdToHk.anomalyRate ?? 0).toFixed(2) }}%</span>
      </button>
      <button
        type="button"
        :class="['direction-card', 'violet', { selected: selected === 'HK_TO_GD' }]"
        data-testid="flow-hk-gd"
        @click="toggleDirection('HK_TO_GD')"
      >
        <span class="direction-title">香港 <b>→</b> 广东</span>
        <strong>{{ formatBytes(hkToGd.totalBytes) }}</strong>
        <span>{{ Number(hkToGd.completedCount ?? 0).toLocaleString('zh-CN') }} 条 · 异常率 {{ Number(hkToGd.anomalyRate ?? 0).toFixed(2) }}%</span>
      </button>
    </div>

    <div class="map-legend">
      <span><i class="legend-cyan"></i>语音 / SACP</span>
      <span><i class="legend-violet"></i>流量 / DCC · GGSN</span>
      <span><i class="legend-amber"></i>稽核结算</span>
    </div>
  </div>
</template>
