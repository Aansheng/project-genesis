<script setup lang="ts">
import { useObservatoryStore } from '../../stores/observatory'
import ObservatoryOverview from './ObservatoryOverview.vue'

const store = useObservatoryStore()

const cards = [
  'Overview',
  'Trace',
  'Timeline',
  'History',
  'Diff',
  'Runtime',
] as const

function isActive(panel: string): boolean {
  return store.selectedPanel === panel
}

function isOverview(): boolean {
  return store.selectedPanel === 'Overview'
}
</script>

<template>
  <main
    class="observatory-content"
    aria-label="Observatory content"
  >
    <ObservatoryOverview v-if="isOverview()" />
    <div
      v-else
      class="content-grid"
    >
      <section
        v-for="card in cards"
        :key="card"
        class="content-card"
        :class="{ 'content-card--active': isActive(card) }"
        :aria-label="`${card} panel`"
      >
        <header class="card-header">
          <h2 class="card-title">
            {{ card }}
          </h2>
          <span
            v-if="isActive(card)"
            class="card-active-tag"
          >Active</span>
        </header>
        <p class="card-body">
          Coming Soon
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.observatory-content {
  min-width: 0;
  overflow-y: auto;
  padding: var(--obs-space-5);
  background: var(--obs-bg);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--obs-space-4);
}

.content-card {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-3);
  padding: var(--obs-space-4);
  border: 1px solid var(--obs-border);
  border-radius: var(--obs-radius-m);
  background: var(--obs-surface);
  min-height: 132px;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.content-card:hover {
  border-color: var(--obs-border-strong);
}

.content-card--active {
  border-color: rgba(110, 123, 255, 0.5);
  background: var(--obs-accent-soft);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--obs-text);
}

.card-active-tag {
  font-family: var(--obs-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--obs-accent);
}

.card-body {
  margin: 0;
  font-size: 12px;
  color: var(--obs-text-dim);
}
</style>