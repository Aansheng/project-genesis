<script setup lang="ts">
import { computed, ref } from 'vue'
import DiffList from './DiffList.vue'
import DiffDetails, { type DiffEntry } from './DiffDetails.vue'

/**
 * Local mock diff data — layout validation only (WO-S6-006).
 * Will be replaced by real observatory diff data in a future work order.
 */
const MOCK_DIFFS: readonly DiffEntry[] = [
  {
    id: 'diff-001',
    timestamp: '12:00:01',
    added: ['Tavern', 'Villager-1', 'Villager-2'],
    removed: [],
    changed: ['VillageCenter'],
  },
  {
    id: 'diff-002',
    timestamp: '12:05:00',
    added: ['Farm-1', 'Farm-2'],
    removed: [],
    changed: [],
  },
  {
    id: 'diff-003',
    timestamp: '12:08:00',
    added: ['Guard-1', 'Guard-2'],
    removed: ['OldRoad'],
    changed: ['VillageGate'],
  },
]

const selectedId = ref<string>(MOCK_DIFFS[0].id)
const selectedDiff = computed<DiffEntry | null>(
  () => MOCK_DIFFS.find((d) => d.id === selectedId.value) ?? null,
)

function selectDiff(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-diff-viewer">
    <DiffList
      :entries="MOCK_DIFFS"
      :selected-id="selectedId"
      @select="selectDiff"
    />
    <DiffDetails :entry="selectedDiff" />
  </div>
</template>

<style scoped>
.observatory-diff-viewer {
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