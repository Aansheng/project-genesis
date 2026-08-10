<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '../../../stores/i18n'
import EventFilterBar from './EventFilterBar.vue'
import EventStreamList from './EventStreamList.vue'
import {
  type EventFilter,
  type EventLevel,
  type StreamEvent,
} from './EventStreamItem.vue'

/**
 * Local mock event stream — UI-only simulation (WO-S6-008).
 * A new event is appended every APPEND_INTERVAL_MS via setInterval;
 * the stream keeps at most MAX_EVENTS entries (oldest dropped).
 * Will be replaced by real observatory event consumption in a future work order.
 */
const MAX_EVENTS = 100
const APPEND_INTERVAL_MS = 2000

interface StreamEventSeed {
  level: EventLevel
  source: string
  message: string
}

const SEEDS: readonly StreamEventSeed[] = [
  { level: 'info', source: 'Runtime', message: 'World created' },
  { level: 'info', source: 'Planner', message: 'CreateFarm strategy selected' },
  { level: 'warning', source: 'Runtime', message: 'NPC path recalculated' },
  { level: 'error', source: 'Provider', message: 'Provider timeout' },
  { level: 'info', source: 'AI', message: 'Plan assembly started' },
  { level: 'info', source: 'Planner', message: 'QueryWorld strategy selected' },
  { level: 'info', source: 'Runtime', message: 'Villager arrived at Tavern' },
  { level: 'warning', source: 'AI', message: 'Context compression threshold reached' },
  { level: 'info', source: 'Provider', message: 'Stream chunk received' },
  { level: 'info', source: 'Runtime', message: 'Guard patrol route updated' },
  { level: 'error', source: 'Planner', message: 'Plan validation failed — retrying' },
  { level: 'info', source: 'AI', message: 'Prompt rendered (Phase 0.959977)' },
  { level: 'warning', source: 'Runtime', message: 'Merchant stock low' },
  { level: 'info', source: 'Provider', message: 'Response completed' },
  { level: 'info', source: 'Runtime', message: 'Farm harvested' },
  { level: 'info', source: 'Planner', message: 'ModifyStrategy applied' },
  { level: 'warning', source: 'AI', message: 'Memory ranking threshold low' },
  { level: 'info', source: 'Runtime', message: 'Tree planted at (5,9)' },
  { level: 'error', source: 'Runtime', message: 'Entity spawn failed — retry scheduled' },
  { level: 'info', source: 'Planner', message: 'DeleteStrategy applied' },
]

const i18n = useI18n()

let clockTick = 0
function formatTimestamp(): string {
  clockTick++
  const total = 12 * 3600 + clockTick
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const INITIAL_EVENTS: readonly StreamEvent[] = SEEDS.map((seed, index) => ({
  id: `evt-${String(index + 1).padStart(3, '0')}`,
  timestamp: formatTimestamp(),
  level: seed.level,
  source: seed.source,
  message: seed.message,
}))

const events = ref<StreamEvent[]>([...INITIAL_EVENTS])
const filter = ref<EventFilter>('all')
let nextNumber = INITIAL_EVENTS.length + 1
let streamTimer: ReturnType<typeof setInterval> | null = null

const filteredEvents = computed<StreamEvent[]>(() => {
  const current = filter.value
  if (current === 'all') return events.value
  return events.value.filter((event) => event.level === current)
})

function appendEvent(): void {
  const seed = SEEDS[(nextNumber - 1) % SEEDS.length]
  events.value.push({
    id: `evt-${String(nextNumber).padStart(3, '0')}`,
    timestamp: formatTimestamp(),
    level: seed.level,
    source: seed.source,
    message: seed.message,
  })
  nextNumber++
  if (events.value.length > MAX_EVENTS) {
    events.value.splice(0, events.value.length - MAX_EVENTS)
  }
}

onMounted(() => {
  streamTimer = setInterval(appendEvent, APPEND_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (streamTimer !== null) {
    clearInterval(streamTimer)
    streamTimer = null
  }
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