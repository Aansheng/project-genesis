<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ title: string }>()

const headingId = computed(() =>
  `trace-step-${props.title.toLowerCase().replace(/\s+/g, '-')}`,
)
</script>

<template>
  <section
    class="trace-step-card"
    :aria-labelledby="headingId"
  >
    <h3
      :id="headingId"
      class="trace-step-card-title"
    >
      {{ title }}
    </h3>
    <div class="trace-step-card-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.trace-step-card {
  min-width: 0;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.trace-step-card-title {
  margin: 0;
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
  border-bottom: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface-2, #161618);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.trace-step-card-body {
  min-width: 0;
  padding: var(--obs-space-3, 12px);
}
</style>