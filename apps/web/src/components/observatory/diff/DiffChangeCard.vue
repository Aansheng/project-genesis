<script setup lang="ts">
import { computed } from 'vue'
import type { DiffChangeKind } from './DiffDetails.vue'

const props = defineProps<{
  kind: DiffChangeKind
  name: string
}>()

const marker = computed<string>(() => {
  if (props.kind === 'added') return '+'
  if (props.kind === 'removed') return '-'
  return '•'
})

const headingId = computed(() =>
  `diff-change-${props.kind}-${props.name.toLowerCase().replace(/\s+/g, '-')}`,
)
</script>

<template>
  <article
    class="diff-change-card"
    :class="`diff-change-card--${kind}`"
    :aria-labelledby="headingId"
  >
    <header class="diff-change-card-header">
      <span class="diff-change-card-marker">{{ marker }}</span>
      <h3
        :id="headingId"
        class="diff-change-card-name"
      >
        {{ name }}
      </h3>
    </header>
  </article>
</template>

<style scoped>
.diff-change-card {
  min-width: 0;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.diff-change-card-header {
  display: flex;
  align-items: center;
  gap: var(--obs-space-3, 12px);
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
}

.diff-change-card-marker {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
}

.diff-change-card--added .diff-change-card-marker {
  color: var(--obs-success, #4ade80);
}

.diff-change-card--removed .diff-change-card-marker {
  color: var(--obs-danger, #f87171);
}

.diff-change-card--changed .diff-change-card-marker {
  color: var(--obs-accent, #6e7bff);
}

.diff-change-card-name {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}
</style>