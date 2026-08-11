<script setup lang="ts">
import { computed, ref } from 'vue'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import type { TimelineViewModel } from '../../../adapters/observatory'
import TimelineList from './TimelineList.vue'
import TimelineDetails, { type Timeline } from './TimelineDetails.vue'

/**
 * Timeline Viewer — reads timeline data from the observatoryData store
 * via ObservatoryViewModel.timelineView.
 *
 * WO-S6-015 — Observatory Timeline Real Data Integration
 * Replaced MOCK_TIMELINES with store-driven data through
 * DefaultObservatoryAdapter.
 */
const dataStore = useObservatoryDataStore()

const timelineView = computed<readonly TimelineViewModel[]>(
  () => dataStore.viewModel.timelineView,
)

const selectedId = ref<string>('')
const selectedTimeline = computed<Timeline | null>(() => {
  const found = timelineView.value.find((t) => t.id === selectedId.value)
  if (!found) return null
  return {
    id: found.id,
    entryCount: found.entryCount,
    entries: found.entries,
  }
})

function selectTimeline(id: string): void {
  selectedId.value = id
}

// Initialize selectedId from first timeline when data changes
const initialized = ref(false)
function ensureSelected(): void {
  if (timelineView.value.length > 0 && !selectedId.value) {
    selectedId.value = timelineView.value[0].id
    initialized.value = true
  } else if (timelineView.value.length === 0 && !initialized.value) {
    selectedId.value = ''
  }
}
ensureSelected()
</script>

<template>
  <div class="observatory-timeline-viewer">
    <TimelineList
      :timelines="timelineView"
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