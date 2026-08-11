<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../../../stores/i18n'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import EventFilterBar from './EventFilterBar.vue'
import EventStreamList from './EventStreamList.vue'
import type {
  EventFilter,
  EventLevel,
  StreamEvent,
} from './EventStreamItem.vue'
import type { EventViewModel } from '../../../adapters/observatory'

/**
 * Event Stream — reads event data from the store's viewModel.
 *
 * Event data originates from observatoryDataStore and is mapped through
 * DefaultObservatoryAdapter into EventStreamViewModel. The component
 * owns only filtering and presentation — no mock data, no timer.
 *
 * WO-S6-019 — Observatory Event Stream Real Data Integration
 */

const i18n = useI18n()
const observatoryDataStore = useObservatoryDataStore()

const filter = ref<EventFilter>('all')

/** Map store EventViewModel[] to the StreamEvent[] format expected by child components. */
const storeEvents = computed<readonly StreamEvent[]>(() => {
  return observatoryDataStore.viewModel.eventStreamView.events.map(
    (evt: EventViewModel): StreamEvent => ({
      id: evt.id,
      timestamp: evt.timestamp,
      level: evt.level as EventLevel,
      source: evt.source,
      message: evt.message,
    }),
  )
})

const filteredEvents = computed<readonly StreamEvent[]>(() => {
  const current = filter.value
  if (current === 'all') return storeEvents.value
  return storeEvents.value.filter((event) => event.level === current)
})

function setFilter(next: EventFilter): void {
  filter.value = next
}
</script>

<template>
  <div class="observatory-event-stream">
    <header class="event-stream-header">
      <h2 class="event-stream-title">
        {{ i18n.t('observatory.events.title') }}
      </h2>
    </header>
    <EventFilterBar
      :active="filter"
      @change="setFilter"
    />
    <EventStreamList :events="filteredEvents" />
  </div>
</template>

<style scoped>
.observatory-event-stream {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.event-stream-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
  background: var(--obs-bg, #0a0a0b);
}

.event-stream-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}
</style>