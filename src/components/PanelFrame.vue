<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import {
  PANEL_FOCUS_REFERENCE_ID,
  resetSharedPanelFocusScale,
  setSharedPanelFocusScale,
  sharedPanelFocusScale,
} from '../composables/usePanelFocusScale.js'

const props = defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  active: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  detailId: { type: String, default: '' },
  focused: { type: Boolean, default: false },
  focusMaxWidth: { type: Number, default: 1280 },
  focusMaxHeight: { type: Number, default: 760 },
  focusScaleReferenceId: { type: String, default: PANEL_FOCUS_REFERENCE_ID },
})

const emit = defineEmits(['open-detail', 'close-detail'])
const panelElement = ref(null)
const originalSize = ref({ width: 0, height: 0 })
const viewportSize = ref({ width: 0, height: 0 })
let remeasureAfterClose = false

const isScaleReference = computed(
  () => props.detailId === props.focusScaleReferenceId,
)

function updateViewportSize() {
  viewportSize.value = {
    width: Number(globalThis.innerWidth) || 1440,
    height: Number(globalThis.innerHeight) || 900,
  }
}

function calculateScale(size) {
  const safeWidth = Math.max(Number(size?.width) || 0, 1)
  const safeHeight = Math.max(Number(size?.height) || 0, 1)
  const availableWidth = Math.max(
    280,
    Math.min(props.focusMaxWidth, viewportSize.value.width - 96),
  )
  const availableHeight = Math.max(
    220,
    Math.min(props.focusMaxHeight, viewportSize.value.height - 96),
  )

  return Math.max(
    1,
    Math.min(availableWidth / safeWidth, availableHeight / safeHeight),
  )
}

function readReferenceScale() {
  if (sharedPanelFocusScale.value >= 1) return sharedPanelFocusScale.value

  const referenceElement = globalThis.document?.querySelector(
    `[data-detail-id="${props.focusScaleReferenceId}"]`,
  )
  const rect = referenceElement?.getBoundingClientRect()
  if (!rect?.width || !rect?.height) return 0

  const scale = calculateScale(rect)
  setSharedPanelFocusScale(scale)
  return scale
}

function resolvedScale(size = originalSize.value) {
  return readReferenceScale() || calculateScale(size)
}

async function measureReferenceScale({ force = false } = {}) {
  if (!isScaleReference.value || props.focused) return
  if (!force && sharedPanelFocusScale.value >= 1) return

  updateViewportSize()
  await nextTick()

  const rect = panelElement.value?.getBoundingClientRect()
  if (!rect?.width || !rect?.height) return

  setSharedPanelFocusScale(calculateScale(rect))
}

const focusStyle = computed(() => ({
  '--panel-focus-width': `${originalSize.value.width}px`,
  '--panel-focus-height': `${originalSize.value.height}px`,
  '--panel-focus-scale': String(resolvedScale()),
}))

const placeholderStyle = computed(() => ({
  width: '100%',
  height: `${originalSize.value.height}px`,
}))

function openDetail(event) {
  if (!props.detailId) return
  if (props.focused) {
    emit('close-detail')
    return
  }

  const rect = panelElement.value?.getBoundingClientRect()
  if (!rect?.width || !rect?.height) return

  updateViewportSize()
  const size = { width: rect.width, height: rect.height }
  originalSize.value = size
  const scale = resolvedScale(size)

  emit('open-detail', {
    target: props.detailId,
    mode: 'panel-scale',
    origin: { x: event.clientX, y: event.clientY },
    panel: { ...size, scale },
  })
}

function closeDetail(event) {
  event?.stopPropagation()
  emit('close-detail')
}

async function handleResize() {
  updateViewportSize()
  if (!isScaleReference.value) return

  if (props.focused) {
    remeasureAfterClose = true
    return
  }

  resetSharedPanelFocusScale()
  await measureReferenceScale({ force: true })
}

watch(
  () => props.focused,
  async (focused) => {
    if (focused) {
      updateViewportSize()
      await nextTick()
      panelElement.value?.focus({ preventScroll: true })
      return
    }

    if (isScaleReference.value && remeasureAfterClose) {
      remeasureAfterClose = false
      resetSharedPanelFocusScale()
      await measureReferenceScale({ force: true })
    }
  },
)

onMounted(async () => {
  updateViewportSize()
  await measureReferenceScale()
  globalThis.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div
    v-if="focused"
    class="panel-focus-placeholder"
    :style="placeholderStyle"
    aria-hidden="true"
  ></div>

  <Teleport to="body" :disabled="!focused">
    <div
      class="panel-focus-host"
      :class="{ 'is-open': focused }"
      :style="focused ? focusStyle : undefined"
      :data-testid="focused ? 'panel-focus-layer' : undefined"
    >
      <button
        v-if="focused"
        type="button"
        class="panel-focus-backdrop"
        aria-label="关闭等比放大面板"
        @click="closeDetail"
      ></button>

      <div class="panel-focus-stage" :class="{ 'is-open': focused }">
        <section
          ref="panelElement"
          class="panel-frame"
          :class="{
            'is-active': active,
            'is-compact': compact,
            'is-detail-enabled': detailId,
            'is-panel-focused': focused,
          }"
          :data-detail-id="detailId || undefined"
          :data-focus-scale-reference="isScaleReference || undefined"
          :data-testid="focused ? 'focused-panel' : undefined"
          :tabindex="focused ? -1 : undefined"
          @dblclick.stop="openDetail"
        >
          <div class="panel-corner panel-corner--tl"></div>
          <div class="panel-corner panel-corner--br"></div>
          <header class="panel-header">
            <div>
              <span v-if="eyebrow" class="panel-eyebrow">{{ eyebrow }}</span>
              <h2>{{ title }}</h2>
            </div>
            <slot name="header"></slot>
          </header>
          <div class="panel-body">
            <slot></slot>
          </div>
        </section>
      </div>

      <button
        v-if="focused"
        type="button"
        class="panel-focus-close"
        aria-label="关闭等比放大面板"
        @click="closeDetail"
      >
        ×
      </button>
    </div>
  </Teleport>
</template>
