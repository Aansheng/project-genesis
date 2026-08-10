<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'

export interface LegendTypeItem {
  key: 'world' | 'location' | 'npc' | 'quest'
}

export interface LegendStatusItem {
  key: 'active' | 'inactive'
}

defineProps<{
  types: readonly LegendTypeItem[]
  statuses: readonly LegendStatusItem[]
}>()

const i18n = useI18n()

function typeLabel(key: string): string {
  return i18n.t(`observatory.world.${key}`)
}

function statusLabel(key: string): string {
  return i18n.t(`observatory.world.${key}`)
}
</script>

<template>
  <section
    class="world-graph-legend"
    aria-label="World graph legend"
  >
    <header class="world-graph-legend-header">
      <h3 class="world-graph-legend-title">
        {{ i18n.t('observatory.world.legend') }}
      </h3>
    </header>
    <div class="world-graph-legend-sections">
      <div class="world-graph-legend-group">
        <h4 class="world-graph-legend-group-title">
          {{ i18n.t('observatory.labels.types') }}
        </h4>
        <ul class="world-graph-legend-list">
          <li
            v-for="item in types"
            :key="item.key"
            class="world-graph-legend-item"
          >
            <span
              class="world-graph-legend-badge"
              :class="`world-graph-legend-badge--${item.key}`"
            >{{ typeLabel(item.key) }}</span>
          </li>
        </ul>
      </div>
      <div class="world-graph-legend-group">
        <h4 class="world-graph-legend-group-title">
          {{ i18n.t('observatory.labels.status') }}
        </h4>
        <ul class="world-graph-legend-list">
          <li
            v-for="item in statuses"
            :key="item.key"
            class="world-graph-legend-item"
          >
            <span
              class="world-graph-legend-dot"
              :class="`world-graph-legend-dot--${item.key}`"
            />
            <span class="world-graph-legend-label">{{ statusLabel(item.key) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.world-graph-legend {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.world-graph-legend-header {
  display: flex;
  align-items: center;
}

.world-graph-legend-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.world-graph-legend-sections {
  display: flex;
  gap: var(--obs-space-5, 24px);
}

.world-graph-legend-group {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.world-graph-legend-group-title {
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-muted, #a1a1aa);
}

.world-graph-legend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--obs-space-3, 12px);
}

.world-graph-legend-item {
  display: flex;
  align-items: center;
  gap: var(--obs-space-2, 8px);
}

.world-graph-legend-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.4;
}

.world-graph-legend-badge--world {
  background: rgba(168, 85, 247, 0.18);
  color: #c084fc;
}

.world-graph-legend-badge--location {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
}

.world-graph-legend-badge--npc {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.world-graph-legend-badge--quest {
  background: rgba(251, 146, 60, 0.18);
  color: #fdba74;
}

.world-graph-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.world-graph-legend-dot--active {
  background: var(--obs-success, #4ade80);
}

.world-graph-legend-dot--inactive {
  background: var(--obs-text-dim, #63636d);
}

.world-graph-legend-label {
  font-size: 12px;
  color: var(--obs-text-muted, #a1a1aa);
}
</style>