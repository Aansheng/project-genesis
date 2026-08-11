<script setup lang="ts">
import { computed, ref } from 'vue'
import TraceList from './TraceList.vue'
import TraceDetails from './TraceDetails.vue'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import type { TraceViewModel } from '../../../adapters/observatory'

const dataStore = useObservatoryDataStore()

const traces = computed<readonly TraceViewModel[]>(() => dataStore.viewModel.traceView)

const selectedId = ref<string>(traces.value.length > 0 ? traces.value[0].id : '')
const selectedTrace = computed<TraceViewModel | null>(
  () => traces.value.find((t) => t.id === selectedId.value) ?? null,
)

function selectTrace(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-trace-viewer">
    <TraceList
      :traces="traces"
      :selected-id="selectedId"
      @select="selectTrace"
    />
    <TraceDetails :trace="selectedTrace" />
  </div>
</template>

<style scoped>
.observatory-trace-viewer {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-width: 0;
  height: 100%;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

:deep(.trace-details) {
  min-height: 0;
}
</style>