<script lang="ts">
export interface HistoryEntry {
  id: string
  prompt: string
  timestamp: string
  result: string
  evolution: readonly string[]
}
</script>

<script setup lang="ts">
import HistoryEntryCard from './HistoryEntryCard.vue'

defineProps<{
  entry: HistoryEntry | null
}>()
</script>

<template>
  <article
    class="history-details"
    aria-label="History details"
  >
    <template v-if="entry">
      <header class="history-details-header">
        <h2 class="history-details-title">
          History Details
        </h2>
        <dl class="history-meta-grid">
          <div class="history-meta-item">
            <dt class="history-meta-label">
              History ID
            </dt>
            <dd class="history-meta-value">
              {{ entry.id }}
            </dd>
          </div>
          <div class="history-meta-item">
            <dt class="history-meta-label">
              Timestamp
            </dt>
            <dd class="history-meta-value">
              {{ entry.timestamp }}
            </dd>
          </div>
        </dl>
      </header>

      <section
        class="history-prompt-section"
        aria-labelledby="history-prompt-title"
      >
        <h3
          id="history-prompt-title"
          class="history-prompt-title"
        >
          Prompt
        </h3>
        <pre
          class="history-prompt-block"
          tabindex="0"
        >{{ entry.prompt }}</pre>
      </section>

      <section
        class="history-result-section"
        aria-labelledby="history-result-title"
      >
        <h3
          id="history-result-title"
          class="history-result-title"
        >
          Result
        </h3>
        <p class="history-result-text">
          {{ entry.result }}
        </p>
      </section>

      <section
        class="history-evolution-section"
        aria-labelledby="history-evolution-title"
      >
        <h3
          id="history-evolution-title"
          class="history-evolution-title"
        >
          Evolution
        </h3>
        <ul class="history-evolution-list">
          <li
            v-for="name in entry.evolution"
            :key="name"
            class="history-evolution-item"
          >
            <HistoryEntryCard :name="name" />
          </li>
        </ul>
      </section>
    </template>

    <p
      v-else
      class="history-empty"
    >
      No history entry selected
    </p>
  </article>
</template>

<style scoped>
.history-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.history-details-header {
  padding: var(--obs-space-5, 24px) var(--obs-space-5, 24px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.history-details-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.history-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--obs-space-3, 12px) var(--obs-space-6, 32px);
  margin: 0;
}

.history-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.history-meta-label {
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.history-meta-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.history-prompt-section,
.history-result-section,
.history-evolution-section {
  min-width: 0;
  padding: var(--obs-space-4, 16px) var(--obs-space-5, 24px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.history-prompt-title,
.history-result-title,
.history-evolution-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.history-prompt-block {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  line-height: 1.6;
  color: var(--obs-text, #f5f5f4);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.history-prompt-block:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.history-result-text {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  color: var(--obs-text, #f5f5f4);
}

.history-evolution-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
}

.history-evolution-item {
  margin: 0;
  padding: 0;
}

.history-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>