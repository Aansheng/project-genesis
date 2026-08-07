<script setup lang="ts">
import { computed, ref } from 'vue'
import HistoryList from './HistoryList.vue'
import HistoryDetails, { type HistoryEntry } from './HistoryDetails.vue'

/**
 * Local mock history data — layout validation only (WO-S6-005).
 * Will be replaced by real observatory history data in a future work order.
 */
const MOCK_HISTORY: readonly HistoryEntry[] = [
  {
    id: 'history-001',
    prompt: 'Create Village',
    timestamp: '12:00:01',
    result: '11 entities',
    evolution: ['Tavern', 'Villager', 'Tree'],
  },
  {
    id: 'history-002',
    prompt: 'Add Farm',
    timestamp: '12:05:00',
    result: '5 farms added',
    evolution: ['Farm', 'Crop', 'Well'],
  },
  {
    id: 'history-003',
    prompt: 'Add Guards',
    timestamp: '12:08:00',
    result: '2 guards added',
    evolution: ['Guard', 'Barracks'],
  },
]

const selectedId = ref<string>(MOCK_HISTORY[0].id)
const selectedHistory = computed<HistoryEntry | null>(
  () => MOCK_HISTORY.find((h) => h.id === selectedId.value) ?? null,
)

function selectHistory(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-history-viewer">
    <HistoryList
      :entries="MOCK_HISTORY"
      :selected-id="selectedId"
      @select="selectHistory"
    />
    <HistoryDetails :entry="selectedHistory" />
  </div>
</template>

<style scoped>
.observatory-history-viewer {
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