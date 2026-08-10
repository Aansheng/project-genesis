<script lang="ts">
export type EventLevel = 'info' | 'warning' | 'error'

export interface StreamEvent {
  id: string
  timestamp: string
  level: EventLevel
  source: string
  message: string
}

export type EventFilter = EventLevel | 'all'
</script>

<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'

defineProps<{
  event: StreamEvent
}>()

const i18n = useI18n()

const LEVEL_LABEL_KEYS: Record<EventLevel, string> = {
  info: 'observatory.events.info',
  warning: 'observatory.events.warning',
  error: 'observatory.events.error',
}

function levelLabel(level: EventLevel): string {
  return i18n.t(LEVEL_LABEL_KEYS[level])
}
</script>

<template>
  <article
    class="event-stream-item"
    :class="`event-stream-item--${event.level}`"
  >
    <span class="event-item-timestamp">
      {{ event.timestamp }}
    </span>
    <span
      class="event-item-badge"
      :class="`event-badge--${event.level}`"
    >
      {{ levelLabel(event.level) }}
    </span>
    <span class="event-item-source">
      {{ event.source }}
    </span>
    <span class="event-item-message">
      {{ event.message }}
    </span>
  </article>
</template>

<style scoped>
.event-stream-item {
  display: grid;
  grid-template-columns: 72px 64px minmax(110px, 160px) minmax(0, 1fr);
  align-items: baseline;
  gap: var(--obs-space-3, 12px);
  padding: var(--obs-space-2, 8px) var(--obs-space-4, 16px);
  border: 1px solid transparent;
  border-bottom-color: var(--obs-border, #232327);
}

.event-stream-item--error {
  background: var(--obs-error-soft, rgba(248, 113, 113, 0.06));
}

.event-item-timestamp {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.event-item-badge {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px var(--obs-space-2, 8px);
  border-radius: 999px;
  justify-self: start;
}

.event-badge--info {
  color: var(--obs-accent, #6e7bff);
  background: var(--obs-accent-soft, rgba(110, 123, 255, 0.14));
}

.event-badge--warning {
  color: var(--obs-warning, #fbbf24);
  background: var(--obs-warning-soft, rgba(251, 191, 36, 0.12));
}

.event-badge--error {
  color: var(--obs-danger, #f87171);
  background: var(--obs-error-soft, rgba(248, 113, 113, 0.14));
}

.event-item-source {
  font-size: 12px;
  font-weight: 600;
  color: var(--obs-text-muted, #a1a1aa);
}

.event-item-message {
  font-size: 13px;
  color: var(--obs-text, #f5f5f4);
  overflow-wrap: break-word;
}
</style>