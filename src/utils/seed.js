export function createSeededRandom(seed = 20260729) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function deterministicRange(random, min, max) {
  return Math.round(min + random() * (max - min))
}
