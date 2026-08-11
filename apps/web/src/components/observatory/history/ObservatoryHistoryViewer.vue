<script setup lang="ts">
import { computed, ref } from 'vue'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import type { HistoryViewModel } from '../../../adapters/observatory'
import HistoryList from './HistoryList.vue'
import HistoryDetails, { type HistoryEntry } from './HistoryDetails.vue'

/**
 * History Viewer — reads history data from the observatoryData store
 * via ObservatoryViewModel.historyView.
 *
 * WO-S6-016 — Observatory History Real Data Integration
 * Replaced MOCK_HISTORY with store-driven data through
 * DefaultObservatoryAdapter.
 */
const dataStore = useObservatoryDataStore()

const historyView = computed<readonly HistoryViewModel[]>(
  () => dataStore.viewModel.historyView,
)

const selectedId = ref<string>('')
const selectedHistory = computed<HistoryEntry | null>(() => {
  const found = historyView.value.find((h) => h.id === selectedId.value)
  if (!found) return null
  return {
    id: found.id,
    timestamp: found.timestamp,
    prompt: found.prompt,
    result: found.result,
    evolution: found.evolution,
  }
})

function selectHistory(id: string): void {
  selectedId.value = id
}

// Initialize selectedId from first history entry when data changes
function ensureSelected(): void {
  if (historyView.value.length > 0 && !selectedId.value) {
    selectedId.value = historyView.value[0].id
  } else if (historyView.value.length === 0) {
    selectedId.value = ''
  }
}
ensureSelected()
</script>

<template>
  <div class="observatory-history-viewer">
    <HistoryList
      :entries="historyView"
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