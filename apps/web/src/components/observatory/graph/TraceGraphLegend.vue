<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'

export interface LegendItem {
  status: 'completed' | 'pending' | 'failed'
}

defineProps<{
  items: readonly LegendItem[]
}>()

const i18n = useI18n()

function legendLabel(status: string): string {
  return i18n.t(`observatory.graph.${status}`)
}
</script>

<template>
  <section
    class="graph-legend"
    aria-label="Graph legend"
  >
    <header class="graph-legend-header">
      <h3 class="graph-legend-title">
        {{ i18n.t('observatory.graph.legend') }}
      </h3>
    </header>
    <ul class="graph-legend-list">
      <li
        v-for="item in items"
        :key="item.status"
        class="graph-legend-item"
      >
        <span
          class="graph-legend-dot"
          :class="`graph-legend-dot--${item.status}`"
        />
        <span class="graph-legend-label">{{ legendLabel(item.status) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.graph-legend {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.graph-legend-header {
  display: flex;
  align-items: center;
}

.graph-legend-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.graph-legend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--obs-space-4, 16px);
}

.graph-legend-item {
  display: flex;
  align-items: center;
  gap: var(--obs-space-2, 8px);
}

.graph-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.graph-legend-dot--completed {
  background: var(--obs-success, #22c55e);
}

.graph-legend-dot--pending {
  background: var(--obs-warning, #eab308);
}

.graph-legend-dot--failed {
  background: var(--obs-error, #ef4444);
}

.graph-legend-label {
  font-size: 12px;
  color: var(--obs-text-muted, #a1a1aa);
}
</style>