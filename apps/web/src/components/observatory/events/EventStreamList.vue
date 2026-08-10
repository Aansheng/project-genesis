<script setup lang="ts">
import EventStreamItem, { type StreamEvent } from './EventStreamItem.vue'

defineProps<{
  events: readonly StreamEvent[]
}>()
</script>

<template>
  <ul
    v-if="events.length > 0"
    class="event-stream-list"
    role="log"
    aria-label="Event stream"
  >
    <li
      v-for="event in events"
      :key="event.id"
      class="event-stream-list-item"
    >
      <EventStreamItem :event="event" />
    </li>
  </ul>
  <p
    v-else
    class="event-stream-empty"
  >
    No events
  </p>
</template>

<style scoped>
.event-stream-list {
  list-style: none;
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: var(--obs-space-1, 4px) 0;
  overflow-y: auto;
}

.event-stream-list-item {
  margin: 0;
  padding: 0;
}

.event-stream-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>