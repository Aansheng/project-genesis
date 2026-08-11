<script lang="ts">
import type { TraceViewModel } from '../../../adapters/observatory'

export type { TraceViewModel }
</script>

<script setup lang="ts">
import { computed } from 'vue'
import TraceStepCard from './TraceStepCard.vue'

const props = defineProps<{
  trace: TraceViewModel | null
}>()

const metadataJson = computed(() =>
  props.trace ? JSON.stringify(props.trace.metadata, null, 2) : '',
)
</script>

<template>
  <article
    class="trace-details"
    aria-label="Trace details"
  >
    <template v-if="trace">
      <header class="trace-details-header">
        <h2 class="trace-details-title">
          Trace Details
        </h2>
        <dl class="trace-meta-grid">
          <div class="trace-meta-item">
            <dt class="trace-meta-label">
              Trace ID
            </dt>
            <dd class="trace-meta-value">
              {{ trace.id }}
            </dd>
          </div>
          <div class="trace-meta-item">
            <dt class="trace-meta-label">
              Strategy
            </dt>
            <dd class="trace-meta-value">
              {{ trace.strategy }}
            </dd>
          </div>
        </dl>
      </header>

      <div class="trace-details-body">
        <TraceStepCard title="Plan">
          <pre
            class="trace-plan"
            tabindex="0"
          >{{ trace.plan }}</pre>
        </TraceStepCard>

        <TraceStepCard title="Snapshot">
          <dl class="trace-snapshot-grid">
            <div
              v-for="entry in trace.snapshot"
              :key="entry.key"
              class="trace-snapshot-item"
            >
              <dt class="trace-snapshot-key">
                {{ entry.key }}
              </dt>
              <dd class="trace-snapshot-value">
                {{ entry.value }}
              </dd>
            </div>
          </dl>
        </TraceStepCard>

        <TraceStepCard title="Metadata">
          <pre
            class="trace-metadata"
            tabindex="0"
          >{{ metadataJson }}</pre>
        </TraceStepCard>
      </div>
    </template>

    <p
      v-else
      class="trace-empty"
    >
      No trace selected
    </p>
  </article>
</template>

<style scoped>
.trace-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.trace-details-header {
  padding: var(--obs-space-5, 24px) var(--obs-space-5, 24px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.trace-details-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.trace-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--obs-space-3, 12px) var(--obs-space-6, 32px);
  margin: 0;
}

.trace-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.trace-meta-label {
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.trace-meta-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.trace-details-body {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-4, 16px);
  padding: var(--obs-space-5, 24px);
}

.trace-plan,
.trace-metadata {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-bg, #0a0a0b);
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--obs-text-muted, #a1a1aa);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.trace-plan:focus-visible,
.trace-metadata:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.trace-snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--obs-space-2, 8px);
  margin: 0;
}

.trace-snapshot-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-bg, #0a0a0b);
}

.trace-snapshot-key {
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}

.trace-snapshot-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 12px;
  color: var(--obs-text, #f5f5f4);
}

.trace-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>