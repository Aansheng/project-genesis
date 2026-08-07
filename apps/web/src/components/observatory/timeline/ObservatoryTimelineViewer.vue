<script setup lang="ts">
import { computed, ref } from 'vue'
import TimelineList from './TimelineList.vue'
import TimelineDetails, { type Timeline } from './TimelineDetails.vue'

/**
 * Local mock timeline data — layout validation only (WO-S6-004).
 * Will be replaced by real observatory timeline data in a future work order.
 */
const MOCK_TIMELINES: readonly Timeline[] = [
  {
    id: 'timeline-001',
    entryCount: 12,
    entries: [
      { index: 0, strategy: 'CreateEntity' },
      { index: 1, strategy: 'MoveEntity' },
      { index: 2, strategy: 'QueryWorld' },
      { index: 3, strategy: 'UpdateEntity' },
      { index: 4, strategy: 'DestroyEntity' },
      { index: 5, strategy: 'CreateEntity' },
      { index: 6, strategy: 'MoveEntity' },
      { index: 7, strategy: 'QueryWorld' },
      { index: 8, strategy: 'UpdateEntity' },
      { index: 9, strategy: 'MoveEntity' },
      { index: 10, strategy: 'DestroyEntity' },
      { index: 11, strategy: 'QueryWorld' },
    ],
  },
  {
    id: 'timeline-002',
    entryCount: 8,
    entries: [
      { index: 0, strategy: 'CreateEntity' },
      { index: 1, strategy: 'QueryWorld' },
      { index: 2, strategy: 'UpdateEntity' },
      { index: 3, strategy: 'MoveEntity' },
      { index: 4, strategy: 'CreateEntity' },
      { index: 5, strategy: 'QueryWorld' },
      { index: 6, strategy: 'DestroyEntity' },
      { index: 7, strategy: 'UpdateEntity' },
    ],
  },
  {
    id: 'timeline-003',
    entryCount: 4,
    entries: [
      { index: 0, strategy: 'QueryWorld' },
      { index: 1, strategy: 'CreateEntity' },
      { index: 2, strategy: 'MoveEntity' },
      { index: 3, strategy: 'UpdateEntity' },
    ],
  },
]

const selectedId = ref<string>(MOCK_TIMELINES[0].id)
const selectedTimeline = computed<Timeline | null>(
  () => MOCK_TIMELINES.find((t) => t.id === selectedId.value) ?? null,
)

function selectTimeline(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-timeline-viewer">
    <TimelineList
      :timelines="MOCK_TIMELINES"
      :selected-id="selectedId"
      @select="selectTimeline"
    />
    <TimelineDetails :timeline="selectedTimeline" />
  </div>
</template>

<style scoped>
.observatory-timeline-viewer {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-width: 0;
  height: 100%;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}
</style>