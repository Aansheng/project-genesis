<script setup lang="ts">
import { ref } from 'vue'
import type { HistoryViewModel } from '../../../adapters/observatory'

const props = defineProps<{
  entries: readonly HistoryViewModel[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const itemRefs = ref<HTMLButtonElement[]>([])

function setItemRef(el: unknown, index: number): void {
  if (el) itemRefs.value[index] = el as HTMLButtonElement
}

function onKeydown(event: KeyboardEvent): void {
  const current = props.entries.findIndex((h) => h.id === props.selectedId)
  let next = current

  if (event.key === 'ArrowDown') {
    next = Math.min(current + 1, props.entries.length - 1)
  } else if (event.key === 'ArrowUp') {
    next = Math.max(current - 1, 0)
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = props.entries.length - 1
  } else {
    return
  }

  event.preventDefault()
  const entry = props.entries[next]
  if (!entry) return
  emit('select', entry.id)
  itemRefs.value[next]?.focus()
}

function select(entry: HistoryViewModel): void {
  emit('select', entry.id)
}
</script>

<template>
  <nav
    class="history-list"
    aria-label="History list"
    @keydown="onKeydown"
  >
    <h2 class="history-list-title">
      History List
    </h2>
    <ul class="history-list-items">
      <li
        v-for="(entry, index) in entries"
        :key="entry.id"
        class="history-list-item"
      >
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="history-row"
          :class="{ 'history-row--active': entry.id === selectedId }"
          :aria-current="entry.id === selectedId ? 'true' : undefined"
          @click="select(entry)"
        >
          <span class="history-row-id">
            {{ entry.id }}
          </span>
          <span class="history-row-timestamp">
            {{ entry.timestamp }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.history-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface, #111113);
  overflow-y: auto;
}

.history-list-title {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border-bottom: 1px solid var(--obs-border, #232327);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.history-list-items {
  list-style: none;
  margin: 0;
  padding: var(--obs-space-1, 4px);
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.history-list-item {
  margin: 0;
  padding: 0;
}

.history-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: var(--obs-space-1, 4px);
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
  border: 1px solid transparent;
  border-radius: var(--obs-radius-s, 6px);
  background: transparent;
  color: var(--obs-text-muted, #a1a1aa);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}

.history-row:hover {
  background: var(--obs-surface-2, #161618);
  color: var(--obs-text, #f5f5f4);
}

.history-row:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.history-row--active,
.history-row--active:hover {
  background: var(--obs-accent-soft, rgba(110, 123, 255, 0.14));
  border-color: rgba(110, 123, 255, 0.35);
  color: var(--obs-text, #f5f5f4);
}

.history-row-id {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
}

.history-row-timestamp {
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}
</style>