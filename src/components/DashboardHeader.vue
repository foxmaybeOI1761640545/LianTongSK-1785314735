<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  source: { type: Object, default: null },
  filters: { type: Object, required: true },
  tourState: { type: String, default: 'idle' },
  tourStep: { type: Number, default: -1 },
  tourTotal: { type: Number, default: 7 },
})

const emit = defineEmits(['range-change', 'direction-change', 'tour-start', 'tour-pause', 'tour-resume', 'tour-restart'])
const now = ref(new Date())
let clockTimer = null

onMounted(() => {
  clockTimer = globalThis.setInterval(() => { now.value = new Date() }, 1000)
})

onBeforeUnmount(() => globalThis.clearInterval(clockTimer))

const dateText = computed(() => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
}).format(now.value))

const timeText = computed(() => new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(now.value))
</script>

<template>
  <header class="dashboard-header">
    <div class="brand-block">
      <div class="brand-mark" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div>
        <div class="brand-kicker">LIANTONG · ROAMING DATA INSIGHT COMMAND CENTER</div>
        <h1>粤港一卡双号漫游数据洞察驾驶舱</h1>
        <div class="brand-subline">
          <p>从真实数据到价值经营</p>
          <span class="inline-source"><i></i>真实样本聚合</span>
        </div>
      </div>
    </div>

    <div class="header-controls">
      <label class="control-field">
        <span>观察周期</span>
        <select :value="filters.range" aria-label="观察周期" data-testid="range-filter" @change="emit('range-change', $event.target.value)">
          <option value="all">全量样本</option>
          <option value="7">近 7 天</option>
          <option value="14">近 14 天</option>
          <option value="30">近 30 天</option>
        </select>
      </label>
      <label class="control-field">
        <span>漫游方向</span>
        <select :value="filters.direction" aria-label="漫游方向" data-testid="direction-filter" @change="emit('direction-change', $event.target.value)">
          <option value="ALL">全部方向</option>
          <option value="GD_TO_HK">广东 → 香港</option>
          <option value="HK_TO_GD">香港 → 广东</option>
        </select>
      </label>

      <div class="tour-controls" aria-label="演示模式控制">
        <button v-if="tourState === 'idle'" class="tour-button" type="button" data-testid="tour-start" @click="emit('tour-start')">
          <span class="play-icon">▶</span> 演示模式
        </button>
        <template v-else>
          <button v-if="tourState === 'playing'" class="icon-button" type="button" aria-label="暂停演示" @click="emit('tour-pause')">Ⅱ</button>
          <button v-else class="icon-button" type="button" aria-label="继续演示" @click="emit('tour-resume')">▶</button>
          <button class="icon-button" type="button" aria-label="重新开始演示" @click="emit('tour-restart')">↻</button>
          <span class="tour-progress">{{ tourStep + 1 }}/{{ tourTotal }}</span>
        </template>
      </div>

      <div class="clock-block">
        <strong>{{ timeText }}</strong>
        <span>{{ dateText }}</span>
      </div>
    </div>

    <div class="source-strip">
      <span class="source-pill"><i></i>数据源：{{ source?.label ?? '数据加载中' }}</span>
      <span>{{ source?.message ?? '正在初始化稽核数据契约' }}</span>
      <span class="source-divider"></span>
      <span>口径版本：{{ source?.version ?? '—' }}</span>
      <span class="source-divider"></span>
      <span>业务快照：{{ source?.snapshotAt ?? '—' }}</span>
    </div>
  </header>
</template>
