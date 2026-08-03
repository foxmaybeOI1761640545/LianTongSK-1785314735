import { ref } from 'vue'

export const PANEL_FOCUS_REFERENCE_ID = 'flow-topology'
export const sharedPanelFocusScale = ref(0)

export function setSharedPanelFocusScale(value) {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue) || nextValue < 1) return
  sharedPanelFocusScale.value = nextValue
}

export function resetSharedPanelFocusScale() {
  sharedPanelFocusScale.value = 0
}
