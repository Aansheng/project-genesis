<script setup lang="ts">
import { useObservatoryStore } from '../../stores/observatory'
import { useI18n } from '../../stores/i18n'

const store = useObservatoryStore()
const i18n = useI18n()

interface Artifact {
  key: 'trace' | 'timeline' | 'history'
  count: number
}

/**
 * Local mock artifact data — layout validation only (WO-S6-002).
 * Will be replaced by real observatory data in a future work order.
 */
const artifacts: readonly Artifact[] = [
  { key: 'trace', count: 12 },
  { key: 'timeline', count: 8 },
  { key: 'history', count: 4 },
]

interface SnapshotItem {
  key: string
  value: number | boolean
}

/** Local mock observatory snapshot — mirrors the Sprint 5 observatory shape. */
const snapshotItems: readonly SnapshotItem[] = [
  { key: 'artifactCount', value: 6 },
  { key: 'hasTrace', value: true },
  { key: 'hasTimeline', value: true },
  { key: 'hasHistory', value: true },
  { key: 'hasTraceSnapshot', value: true },
  { key: 'hasTimelineSnapshot', value: true },
  { key: 'hasHistorySnapshot', value: true },
]

function artifactLabel(key: string): string {
  return i18n.t(`observatory.panels.${key}`)
}

function artifactDescription(key: string): string {
  return i18n.t(`observatory.artifacts.${key}Desc`)
}

function snapshotLabel(key: string): string {
  return i18n.t(`observatory.snapshot.${key}`)
}

function formatSnapshotValue(value: number | boolean): string {
  if (typeof value === 'boolean')
    return value ? i18n.t('observatory.common.yes') : i18n.t('observatory.common.no')
  return String(value)
}
</script>

<template>
  <div class="observatory-overview">
    <!-- Section 1 — Artifact Summary -->
    <section
      class="overview-section"
      aria-labelledby="artifact-summary-title"
    >
      <h2
        id="artifact-summary-title"
        class="overview-section-title"
      >
        {{ i18n.t('observatory.sections.artifactSummary') }}
      </h2>
      <div class="artifact-grid">
        <article
          v-for="artifact in artifacts"
          :key="artifact.key"
          class="artifact-card"
          tabindex="0"
          :aria-label="`${artifactLabel(artifact.key)} artifact: ${artifact.count} records`"
        >
          <h3 class="artifact-card-title">
            {{ artifactLabel(artifact.key) }}
          </h3>
          <dl>
            <dt class="artifact-card-label">
              {{ i18n.t('observatory.labels.count') }}
            </dt>
            <dd class="artifact-card-count">
              {{ artifact.count }}
            </dd>
          </dl>
          <p class="artifact-card-description">
            {{ artifactDescription(artifact.key) }}
          </p>
        </article>
      </div>
    </section>

    <!-- Section 2 — Observatory Snapshot -->
    <section
      class="overview-section"
      aria-labelledby="snapshot-summary-title"
    >
      <h2
        id="snapshot-summary-title"
        class="overview-section-title"
      >
        {{ i18n.t('observatory.sections.observatorySnapshot') }}
      </h2>
      <dl class="snapshot-grid">
        <div
          v-for="item in snapshotItems"
          :key="item.key"
          class="snapshot-item"
        >
          <dt class="snapshot-label">
            {{ snapshotLabel(item.key) }}
          </dt>
          <dd
            class="snapshot-value"
            :class="{
              'snapshot-value--off':
                typeof item.value === 'boolean' && !item.value,
            }"
          >
            <span
              v-if="typeof item.value === 'boolean'"
              class="snapshot-dot"
              :class="{ 'snapshot-dot--off': !item.value }"
              aria-hidden="true"
            />
            {{ formatSnapshotValue(item.value) }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Section 3 — System Status -->
    <section
      class="overview-section"
      aria-labelledby="system-status-title"
    >
      <h2
        id="system-status-title"
        class="overview-section-title"
      >
        {{ i18n.t('observatory.sections.systemStatus') }}
      </h2>
      <dl class="system-status-list">
        <div class="system-status-item">
          <dt class="system-status-label">
            {{ i18n.t('observatory.labels.version') }}
          </dt>
          <dd class="system-status-value">
            {{ store.version }}
          </dd>
        </div>
        <div class="system-status-item">
          <dt class="system-status-label">
            {{ i18n.t('observatory.labels.sprint') }}
          </dt>
          <dd class="system-status-value">
            {{ i18n.t('observatory.labels.sprint') }} 6
          </dd>
        </div>
        <div class="system-status-item">
          <dt class="system-status-label">
            {{ i18n.t('observatory.labels.status') }}
          </dt>
          <dd class="system-status-value">
            {{ store.status }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.observatory-overview {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-5, 24px);
}

.overview-section {
  min-width: 0;
}

.overview-section-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--obs-space-4, 16px);
}

.artifact-card {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  padding: var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.artifact-card:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.artifact-card:hover {
  border-color: var(--obs-border-strong, #303036);
}

.artifact-card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--obs-text, #f5f5f4);
}

.artifact-card dl {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--obs-space-2, 8px);
}

.artifact-card-label {
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}

.artifact-card-count {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--obs-text, #f5f5f4);
}

.artifact-card-description {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--obs-text-muted, #a1a1aa);
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--obs-space-3, 12px);
  margin: 0;
}

.snapshot-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.snapshot-label {
  font-size: 12px;
  color: var(--obs-text-muted, #a1a1aa);
}

.snapshot-value {
  display: inline-flex;
  align-items: center;
  gap: var(--obs-space-1, 4px);
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-success, #4ade80);
}

.snapshot-value--off {
  color: var(--obs-text-dim, #63636d);
}

.snapshot-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--obs-success, #4ade80);
}

.snapshot-dot--off {
  background: var(--obs-text-dim, #63636d);
}

.system-status-list {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  margin: 0;
}

.system-status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--obs-space-4, 16px);
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.system-status-label {
  font-size: 13px;
  color: var(--obs-text-muted, #a1a1aa);
}

.system-status-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}
</style>