<script setup>
defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  active: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <section class="panel-frame" :class="{ 'is-active': active, 'is-compact': compact }">
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
</template>
