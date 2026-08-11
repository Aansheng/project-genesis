<script setup lang="ts">
import { ref } from 'vue'
import type { TimelineViewModel } from '../../../adapters/observatory'

const props = defineProps<{
  timelines: readonly TimelineViewModel[]
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
  const current = props.timelines.findIndex((t) => t.id === props.selectedId)
  let next = current

  if (event.key === 'ArrowDown') {
    next = Math.min(current + 1, props.timelines.length - 1)
  } else if (event.key === 'ArrowUp') {
    next = Math.max(current - 1, 0)
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = props.timelines.length - 1
  } else {
    return
  }

  event.preventDefault()
  const timeline = props.timelines[next]
  if (!timeline) return
  emit('select', timeline.id)
  itemRefs.value[next]?.focus()
}

function select(timeline: TimelineViewModel): void {
  emit('select', timeline.id)
}
</script>

<template>
  <nav
    class="timeline-list"
    aria-label="Timeline list"
    @keydown="onKeydown"
  >
    <h2 class="timeline-list-title">
      Timeline List
    </h2>
    <ul class="timeline-list-items">
      <li
        v-for="(timeline, index) in timelines"
        :key="timeline.id"
        class="timeline-list-item"
      >
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="timeline-row"
          :class="{ 'timeline-row--active': timeline.id === selectedId }"
          :aria-current="timeline.id === selectedId ? 'true' : undefined"
          @click="select(timeline)"
        >
          <span class="timeline-row-id">
            {{ timeline.id }}
          </span>
          <span class="timeline-row-count">
            {{ timeline.entryCount }} entries
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.timeline-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface, #111113);
  overflow-y: auto;
}

.timeline-list-title {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  border-bottom: 1px solid var(--obs-border, #232327);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.timeline-list-items {
  list-style: none;
  margin: 0;
  padding: var(--obs-space-1, 4px);
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.timeline-list-item {
  margin: 0;
  padding: 0;
}

.timeline-row {
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

.timeline-row:hover {
  background: var(--obs-surface-2, #161618);
  color: var(--obs-text, #f5f5f4);
}

.timeline-row:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.timeline-row--active,
.timeline-row--active:hover {
  background: var(--obs-accent-soft, rgba(110, 123, 255, 0.14));
  border-color: rgba(110, 123, 255, 0.35);
  color: var(--obs-text, #f5f5f4);
}

.timeline-row-id {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
}

.timeline-row-count {
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}
</style>