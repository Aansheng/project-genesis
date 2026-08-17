<script setup lang="ts">
import { computed } from 'vue'
import { useObservatoryStore } from '../../stores/observatory'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { useI18n } from '../../stores/i18n'

const store = useObservatoryStore()
const dataStore = useObservatoryDataStore()
const i18n = useI18n()

// Mock data is intentionally test/demo-only; production starts empty/real.
if (import.meta.env.MODE === 'test') dataStore.loadMockObservatory()

interface Artifact {
  key: 'trace' | 'timeline' | 'history'
  count: number
}

/**
 * Artifact counts derived from ObservatoryViewModel via DefaultObservatoryAdapter.
 */
const artifacts = computed<readonly Artifact[]>(() => {
  const vm = dataStore.viewModel
  return [
    { key: 'trace', count: vm.overview.traceCount },
    { key: 'timeline', count: vm.overview.timelineCount },
    { key: 'history', count: vm.overview.historyCount },
  ]
})

interface SnapshotItem {
  key: string
  value: number | boolean
}

/**
 * Snapshot items derived from the current ObservatoryViewModel.
 */
const snapshotItems = computed<readonly SnapshotItem[]>(() => {
  const vm = dataStore.viewModel
  const totalArtifactCount =
    vm.overview.traceCount + vm.overview.timelineCount + vm.overview.historyCount
  return [
    { key: 'artifactCount', value: totalArtifactCount },
    { key: 'hasTrace', value: vm.overview.traceCount > 0 },
    { key: 'hasTimeline', value: vm.overview.timelineCount > 0 },
    { key: 'hasHistory', value: vm.overview.historyCount > 0 },
    { key: 'hasTraceSnapshot', value: vm.trace.length > 0 },
    { key: 'hasTimelineSnapshot', value: vm.timeline.length > 0 },
    { key: 'hasHistorySnapshot', value: vm.history.length > 0 },
  ]
})

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
