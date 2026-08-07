<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  index: number
  strategy: string
}>()

const headingId = computed(() => `timeline-entry-${props.index}`)
</script>

<template>
  <article
    class="timeline-entry-card"
    :aria-labelledby="headingId"
  >
    <header class="timeline-entry-card-header">
      <h3
        :id="headingId"
        class="timeline-entry-card-title"
      >
        #{{ index }}
      </h3>
      <span class="timeline-entry-card-strategy">
        {{ strategy }}
      </span>
    </header>
  </article>
</template>

<style scoped>
.timeline-entry-card {
  min-width: 0;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.timeline-entry-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--obs-space-3, 12px);
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
}

.timeline-entry-card-title {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 12px;
  font-weight: 500;
  color: var(--obs-accent, #6e7bff);
}

.timeline-entry-card-strategy {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--obs-text, #f5f5f4);
}
</style>