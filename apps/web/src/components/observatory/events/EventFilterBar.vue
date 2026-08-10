<script setup lang="ts">
import { type EventFilter } from './EventStreamItem.vue'
import { useI18n } from '../../../stores/i18n'

defineProps<{
  active: EventFilter
}>()

const emit = defineEmits<{
  change: [filter: EventFilter]
}>()

const i18n = useI18n()

const FILTER_OPTIONS: readonly { value: EventFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'observatory.events.all' },
  { value: 'info', labelKey: 'observatory.events.info' },
  { value: 'warning', labelKey: 'observatory.events.warning' },
  { value: 'error', labelKey: 'observatory.events.error' },
]

function select(filter: EventFilter): void {
  emit('change', filter)
}
</script>

<template>
  <div
    class="event-filter-bar"
    role="group"
    aria-label="Event stream filters"
  >
    <button
      v-for="option in FILTER_OPTIONS"
      :key="option.value"
      type="button"
      class="event-filter-button"
      :class="{ 'event-filter-button--active': active === option.value }"
      :aria-pressed="active === option.value ? 'true' : 'false'"
      @click="select(option.value)"
    >
      {{ i18n.t(option.labelKey) }}
    </button>
  </div>
</template>

<style scoped>
.event-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--obs-space-2, 8px);
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface, #111113);
}

.event-filter-button {
  padding: 4px var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: 999px;
  background: transparent;
  color: var(--obs-text-muted, #a1a1aa);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.event-filter-button:hover {
  background: var(--obs-surface-2, #161618);
  color: var(--obs-text, #f5f5f4);
}

.event-filter-button:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.event-filter-button--active,
.event-filter-button--active:hover {
  background: var(--obs-accent-soft, rgba(110, 123, 255, 0.14));
  border-color: rgba(110, 123, 255, 0.35);
  color: var(--obs-text, #f5f5f4);
}
</style>