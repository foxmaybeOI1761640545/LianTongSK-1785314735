import { computed, onBeforeUnmount, ref } from 'vue'

const STEPS = ['kpis', 'flow', 'anomaly', 'ranking', 'detail', 'settlement', 'pipeline']

export function useDemoTour({ onStep, interval = 3600 } = {}) {
  const state = ref('idle')
  const stepIndex = ref(-1)
  let timer = null

  const activeStep = computed(() => (stepIndex.value >= 0 ? STEPS[stepIndex.value] : ''))

  function clearTimer() {
    if (timer) globalThis.clearInterval(timer)
    timer = null
  }

  function emitStep() {
    onStep?.(activeStep.value, stepIndex.value)
  }

  function next() {
    stepIndex.value = (stepIndex.value + 1) % STEPS.length
    emitStep()
  }

  function start() {
    clearTimer()
    state.value = 'playing'
    if (stepIndex.value < 0 || stepIndex.value === STEPS.length - 1) stepIndex.value = -1
    next()
    timer = globalThis.setInterval(next, interval)
  }

  function pause() {
    clearTimer()
    state.value = 'paused'
  }

  function resume() {
    if (state.value !== 'paused') return
    state.value = 'playing'
    timer = globalThis.setInterval(next, interval)
  }

  function stop() {
    clearTimer()
    state.value = 'idle'
    stepIndex.value = -1
  }

  function restart() {
    stepIndex.value = -1
    start()
  }

  onBeforeUnmount(clearTimer)

  return { state, activeStep, stepIndex, totalSteps: STEPS.length, start, pause, resume, stop, restart }
}
