<script lang="ts">
import type { TimelineViewModel, TimelineEntryViewModel } from '../../../adapters/observatory'

export type TimelineEntry = TimelineEntryViewModel
export type Timeline = TimelineViewModel
</script>

<script setup lang="ts">
import TimelineEntryCard from './TimelineEntryCard.vue'

defineProps<{
  timeline: Timeline | null
}>()
</script>

<template>
  <article
    class="timeline-details"
    aria-label="Timeline details"
  >
    <template v-if="timeline">
      <header class="timeline-details-header">
        <h2 class="timeline-details-title">
          Timeline Details
        </h2>
        <dl class="timeline-meta-grid">
          <div class="timeline-meta-item">
            <dt class="timeline-meta-label">
              Timeline ID
            </dt>
            <dd class="timeline-meta-value">
              {{ timeline.id }}
            </dd>
          </div>
          <div class="timeline-meta-item">
            <dt class="timeline-meta-label">
              Entry Count
            </dt>
            <dd class="timeline-meta-value">
              {{ timeline.entryCount }}
            </dd>
          </div>
        </dl>
      </header>

      <section
        class="timeline-entries-section"
        aria-labelledby="timeline-entries-title"
      >
        <h3
          id="timeline-entries-title"
          class="timeline-entries-title"
        >
          Timeline Entries
        </h3>
        <ul class="timeline-entries-list">
          <li
            v-for="entry in timeline.entries"
            :key="entry.index"
            class="timeline-entries-item"
          >
            <TimelineEntryCard
              :index="entry.index"
              :strategy="entry.strategy"
              :timestamp="entry.timestamp"
            />
          </li>
        </ul>
      </section>
    </template>

    <p
      v-else
      class="timeline-empty"
    >
      No timeline selected. No timeline events recorded for this session.
    </p>
  </article>
</template>

<style scoped>
.timeline-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.timeline-details-header {
  padding: var(--obs-space-5, 24px) var(--obs-space-5, 24px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.timeline-details-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.timeline-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--obs-space-3, 12px) var(--obs-space-6, 32px);
  margin: 0;
}

.timeline-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.timeline-meta-label {
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.timeline-meta-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.timeline-entries-section {
  min-width: 0;
  padding: var(--obs-space-5, 24px);
}

.timeline-entries-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.timeline-entries-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
}

.timeline-entries-item {
  margin: 0;
  padding: 0;
}

.timeline-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>
