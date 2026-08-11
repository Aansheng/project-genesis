<script setup lang="ts">
import { computed, ref } from 'vue'
import DiffList from './DiffList.vue'
import DiffDetails from './DiffDetails.vue'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import type { DiffViewModel } from '../../../adapters/observatory'

const dataStore = useObservatoryDataStore()

const selectedId = ref<string>('')
const entries = computed<readonly DiffViewModel[]>(
  () => dataStore.viewModel.diffView,
)

// Initialize selectedId from the first entry when entries change
const firstId = computed<string | null>(() => entries.value[0]?.id ?? null)
if (firstId.value && !selectedId.value) {
  selectedId.value = firstId.value
}

const selectedDiff = computed<DiffViewModel | null>(
  () => entries.value.find((d) => d.id === selectedId.value) ?? null,
)

function selectDiff(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-diff-viewer">
    <DiffList
      :entries="entries"
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