<script setup lang="ts">
import { ref } from 'vue'
import type { Trace } from './TraceDetails.vue'

const props = defineProps<{
  traces: readonly Trace[]
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
  const current = props.traces.findIndex((t) => t.id === props.selectedId)
  let next = current

  if (event.key === 'ArrowDown') {
    next = Math.min(current + 1, props.traces.length - 1)
  } else if (event.key === 'ArrowUp') {
    next = Math.max(current - 1, 0)
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = props.traces.length - 1
  } else {
    return
  }

  event.preventDefault()
  const trace = props.traces[next]
  if (!trace) return
  emit('select', trace.id)
  itemRefs.value[next]?.focus()
}

function select(trace: Trace): void {
  emit('select', trace.id)
}
</script>

<template>
  <nav
    class="trace-list"
    aria-label="Trace list"
    @keydown="onKeydown"
  >
    <h2 class="trace-list-title">
      Trace List
    </h2>
    <ul class="trace-list-items">
      <li
        v-for="(trace, index) in traces"
        :key="trace.id"
        class="trace-list-item"
      >
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="trace-row"
          :class="{ 'trace-row--active': trace.id === selectedId }"
          :aria-current="trace.id === selectedId ? 'true' : undefined"
          @click="select(trace)"
        >
          <span class="trace-row-strategy">
            {{ trace.strategy }}
          </span>
          <span class="trace-row-id">
            {{ trace.id }}
          </span>
          <span class="trace-row-time">
            {{ trace.timestamp }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.trace-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface, #111113);
  overflow-y: auto;
}

.trace-list-title {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border-bottom: 1px solid var(--obs-border, #232327);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.trace-list-items {
  list-style: none;
  margin: 0;
  padding: var(--obs-space-1, 4px);
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.trace-list-item {
  margin: 0;
  padding: 0;
}

.trace-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'strategy time'
    'id time';
  width: 100%;
  gap: var(--obs-space-1, 4px) var(--obs-space-3, 12px);
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

.trace-row:hover {
  background: var(--obs-surface-2, #161618);
  color: var(--obs-text, #f5f5f4);
}

.trace-row:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.trace-row--active,
.trace-row--active:hover {
  background: var(--obs-accent-soft, rgba(110, 123, 255, 0.14));
  border-color: rgba(110, 123, 255, 0.35);
  color: var(--obs-text, #f5f5f4);
}

.trace-row-strategy {
  grid-area: strategy;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.trace-row-id {
  grid-area: id;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}

.trace-row-time {
  grid-area: time;
  align-self: center;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}
</style>