<script setup>
import { computed } from 'vue'
import { formatBytes } from '../utils/traffic.js'

const props = defineProps({
  flows: { type: Array, default: () => [] },
  active: { type: Boolean, default: false },
})

const gdToHk = computed(
  () => props.flows.find((flow) => flow.direction === 'GD_TO_HK') ?? {},
)
</script>

<template>
  <div class="flow-map" :class="{ 'is-active': active }" data-testid="flow-map">
    <div class="flow-map-grid" aria-hidden="true"></div>
    <div class="map-caption">
      <span class="live-dot"></span>
      <span>样本覆盖 · 广东侧样本用户访问香港网络</span>
    </div>

    <svg
      class="flow-svg"
      viewBox="0 0 760 330"
      role="img"
      aria-label="广东侧样本用户访问香港网络的使用场景示意"
    >
      <title>广东至香港跨境使用行为示意</title>
      <desc>
        广东和香港轮廓经过视觉化简化，仅用于界面展示，不作为行政边界或测绘依据。
      </desc>

      <defs>
        <linearGradient id="regionGd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1d5d97" stop-opacity=".86" />
          <stop offset="1" stop-color="#18335c" stop-opacity=".46" />
        </linearGradient>
        <linearGradient id="regionHk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#344fc0" stop-opacity=".9" />
          <stop offset="1" stop-color="#2d245f" stop-opacity=".54" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="coastGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="coastBlur" />
          <feMerge>
            <feMergeNode in="coastBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <path id="pathGdHk" d="M350 154 C424 90 505 96 575 150" />
      </defs>

      <!--
        Stylised silhouettes redrawn and simplified for dashboard use.
        Public vector references: Geography of Guangdong.svg and Map of Hong Kong.svg.
      -->
      <g
        class="region-silhouette region-silhouette--gd"
        data-region-shape="guangdong"
      >
        <path
          class="region-shape region-shape--gd"
          d="M73 102 L103 82 L137 82 L159 62 L195 68 L218 57 L243 78
             L278 81 L301 97 L333 103 L361 122 L355 143 L337 155
             L345 172 L321 181 L299 198 L270 197 L251 211 L225 206
             L206 221 L185 213 L169 226 L153 216 L144 237 L127 257
             L114 243 L117 217 L102 204 L78 206 L68 186 L48 174
             L42 149 L55 129 L47 111 Z"
          fill="url(#regionGd)"
          stroke="#45e6ff"
        />
        <path
          class="region-shape region-shape--gd region-shape--secondary"
          d="M105 211 L119 217 L117 243 L127 257 L114 269
             L99 252 L95 232 Z"
          fill="url(#regionGd)"
          stroke="#45e6ff"
        />
        <path
          class="region-shape region-shape--gd region-shape--island"
          d="M317 181 L329 185 L336 195 L327 202 L315 196 Z"
          fill="url(#regionGd)"
          stroke="#45e6ff"
        />
        <circle
          class="region-islet region-islet--gd"
          cx="343"
          cy="198"
          r="3.2"
        />

        <circle
          class="region-marker region-marker--gd"
          cx="214"
          cy="158"
          r="5"
          filter="url(#glow)"
        />
        <text x="214" y="150" text-anchor="middle" class="region-name">
          广东
        </text>
        <text x="214" y="181" text-anchor="middle" class="region-sub">
          GUANGDONG
        </text>
      </g>

      <g
        class="region-silhouette region-silhouette--hk"
        data-region-shape="hong-kong"
      >
        <path
          class="region-shape region-shape--hk"
          d="M566 120 L584 103 L605 106 L619 98 L641 106 L654 122
             L647 137 L660 151 L647 165 L630 161 L619 173 L602 167
             L586 171 L574 156 L560 146 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <path
          class="region-shape region-shape--hk region-shape--secondary"
          d="M603 168 L620 168 L624 182 L615 194 L604 185 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <path
          class="region-shape region-shape--hk region-shape--secondary"
          d="M590 202 C604 194 627 194 643 201 L652 211
             L639 220 L616 219 L598 225 L584 216 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <path
          class="region-shape region-shape--hk region-shape--secondary"
          d="M548 196 L562 187 L578 194 L583 209 L572 224
             L553 227 L540 214 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <path
          class="region-shape region-shape--hk region-shape--island"
          d="M666 177 L674 174 L681 180 L677 188 L668 187 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <path
          class="region-shape region-shape--hk region-shape--island"
          d="M568 234 L575 230 L582 234 L579 241 L570 242 Z"
          fill="url(#regionHk)"
          stroke="#8a80ff"
        />
        <circle
          class="region-islet region-islet--hk"
          cx="532"
          cy="218"
          r="4.5"
        />
        <circle
          class="region-islet region-islet--hk"
          cx="687"
          cy="201"
          r="3.2"
        />

        <circle
          class="region-marker region-marker--hk"
          cx="613"
          cy="176"
          r="5"
          filter="url(#glow)"
        />
        <text x="613" y="151" text-anchor="middle" class="region-name">
          香港
        </text>
        <text x="613" y="186" text-anchor="middle" class="region-sub">
          HONG KONG
        </text>
      </g>

      <use href="#pathGdHk" class="flow-line flow-line--cyan" />
      <circle r="5" fill="#69efff" filter="url(#glow)">
        <animateMotion dur="2.5s" repeatCount="indefinite">
          <mpath href="#pathGdHk" />
        </animateMotion>
      </circle>

      <g transform="translate(454 126)">
        <rect
          x="-67"
          y="-20"
          width="134"
          height="39"
          rx="19"
          class="route-label-bg"
        />
        <text text-anchor="middle" y="5" class="route-label">
          跨境使用行为聚合
        </text>
      </g>
    </svg>

    <div class="flow-direction-cards">
      <article class="direction-card cyan coverage-card" data-testid="flow-gd-hk">
        <span class="direction-title">
          广东侧样本用户 <b>→</b> 香港网络
        </span>
        <strong>{{ formatBytes(gdToHk.totalBytes) }}</strong>
        <span>
          {{ Number(gdToHk.completedCount ?? 0).toLocaleString('zh-CN') }} 条 ·
          {{ Number(gdToHk.userCount ?? 0).toLocaleString('zh-CN') }} 用户
        </span>
      </article>

      <article class="direction-card boundary-card" data-testid="sample-boundary-card">
        <span class="direction-title">样本适用边界</span>
        <strong>未提供对侧样本</strong>
        <span>
          {{ gdToHk.coverageNote ?? '不将缺失数据表达为业务量为零' }}
        </span>
      </article>
    </div>

    <div class="map-legend">
      <span><i class="legend-cyan"></i>广东侧样本用户</span>
      <span><i class="legend-violet"></i>香港访问网络</span>
      <span><i class="legend-amber"></i>单侧静态样本</span>
    </div>
  </div>
</template>

<style scoped>
.region-silhouette {
  filter: drop-shadow(0 0 11px rgba(69, 230, 255, 0.08));
}

.region-silhouette--hk {
  filter: drop-shadow(0 0 11px rgba(138, 128, 255, 0.12));
}

.region-shape {
  stroke-width: 1.5;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.region-shape--gd {
  filter: url(#coastGlow);
}

.region-shape--secondary {
  opacity: 0.84;
}

.region-shape--island {
  opacity: 0.72;
}

.region-islet {
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}

.region-islet--gd {
  fill: rgba(29, 93, 151, 0.72);
  stroke: rgba(69, 230, 255, 0.72);
}

.region-islet--hk {
  fill: rgba(52, 79, 192, 0.7);
  stroke: rgba(138, 128, 255, 0.76);
}

.region-marker--gd {
  fill: #45e6ff;
}

.region-marker--hk {
  fill: #8a80ff;
}
</style>
