<script lang="ts">
export type DiffChangeKind = 'added' | 'removed' | 'changed'

import type { DiffViewModel as DiffEntry } from '../../../adapters/observatory'

export type { DiffViewModel as DiffEntry } from '../../../adapters/observatory'
</script>

<script setup lang="ts">
import DiffChangeCard from './DiffChangeCard.vue'

defineProps<{
  entry: DiffEntry | null
}>()
</script>

<template>
  <article
    class="diff-details"
    aria-label="Diff details"
  >
    <template v-if="entry">
      <header class="diff-details-header">
        <h2 class="diff-details-title">
          Diff Details
        </h2>
        <dl class="diff-meta-grid">
          <div class="diff-meta-item">
            <dt class="diff-meta-label">
              Diff ID
            </dt>
            <dd class="diff-meta-value">
              {{ entry.id }}
            </dd>
          </div>
          <div class="diff-meta-item">
            <dt class="diff-meta-label">
              Timestamp
            </dt>
            <dd class="diff-meta-value">
              {{ entry.timestamp }}
            </dd>
          </div>
        </dl>
      </header>

      <section
        class="diff-added-section"
        aria-labelledby="diff-added-title"
      >
        <h3
          id="diff-added-title"
          class="diff-added-title"
        >
          Added
        </h3>
        <ul
          v-if="entry.added.length > 0"
          class="diff-added-list"
        >
          <li
            v-for="item in entry.added"
            :key="item.name"
            class="diff-added-item"
          >
            <DiffChangeCard
              kind="added"
              :name="item.name"
            />
          </li>
        </ul>
        <p
          v-else
          class="diff-section-empty"
        >
          No additions
        </p>
      </section>

      <section
        class="diff-removed-section"
        aria-labelledby="diff-removed-title"
      >
        <h3
          id="diff-removed-title"
          class="diff-removed-title"
        >
          Removed
        </h3>
        <ul
          v-if="entry.removed.length > 0"
          class="diff-removed-list"
        >
          <li
            v-for="item in entry.removed"
            :key="item.name"
            class="diff-removed-item"
          >
            <DiffChangeCard
              kind="removed"
              :name="item.name"
            />
          </li>
        </ul>
        <p
          v-else
          class="diff-section-empty"
        >
          No removals
        </p>
      </section>

      <section
        class="diff-changed-section"
        aria-labelledby="diff-changed-title"
      >
        <h3
          id="diff-changed-title"
          class="diff-changed-title"
        >
          Changed
        </h3>
        <ul
          v-if="entry.changed.length > 0"
          class="diff-changed-list"
        >
          <li
            v-for="item in entry.changed"
            :key="item.name"
            class="diff-changed-item"
          >
            <DiffChangeCard
              kind="changed"
              :name="item.name"
            />
          </li>
        </ul>
        <p
          v-else
          class="diff-section-empty"
        >
          No changes
        </p>
      </section>
    </template>

    <p
      v-else
      class="diff-empty"
    >
      No diff selected. No semantic world delta recorded.
    </p>
  </article>
</template>

<style scoped>
.diff-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.diff-details-header {
  padding: var(--obs-space-5, 24px) var(--obs-space-5, 24px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.diff-details-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.diff-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--obs-space-3, 12px) var(--obs-space-6, 32px);
  margin: 0;
}

.diff-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.diff-meta-label {
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.diff-meta-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.diff-added-section,
.diff-removed-section,
.diff-changed-section {
  min-width: 0;
  padding: var(--obs-space-4, 16px) var(--obs-space-5, 24px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.diff-added-title,
.diff-removed-title,
.diff-changed-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.diff-added-list,
.diff-removed-list,
.diff-changed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
}

.diff-added-item,
.diff-removed-item,
.diff-changed-item {
  margin: 0;
  padding: 0;
}

.diff-section-empty {
  margin: 0;
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.diff-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>
