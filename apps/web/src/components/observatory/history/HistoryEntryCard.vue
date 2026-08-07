<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
}>()

const headingId = computed(() =>
  `history-entry-${props.name.toLowerCase().replace(/\s+/g, '-')}`,
)
</script>

<template>
  <article
    class="history-entry-card"
    :aria-labelledby="headingId"
  >
    <header class="history-entry-card-header">
      <span class="history-entry-card-marker">+</span>
      <h3
        :id="headingId"
        class="history-entry-card-name"
      >
        {{ name }}
      </h3>
    </header>
  </article>
</template>

<style scoped>
.history-entry-card {
  min-width: 0;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.history-entry-card-header {
  display: flex;
  align-items: center;
  gap: var(--obs-space-3, 12px);
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
}

.history-entry-card-marker {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 600;
  color: var(--obs-success, #4ade80);
}

.history-entry-card-name {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}
</style>