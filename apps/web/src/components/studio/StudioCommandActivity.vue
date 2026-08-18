<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { assetArtworkLabel } from '../../assets/GeneratedAssetOrchestrator'

const store = useGameStore()
const visualOperations = computed(() => Object.values(store.visualGenerationOperations))
const visualSummary = computed(() => {
  const ready = visualOperations.value.filter(operation => operation.stage === 'ready').length
  const active = visualOperations.value.filter(operation => operation.stage === 'generating' || operation.stage === 'applying').length
  const fallback = visualOperations.value.filter(operation => operation.stage === 'fallback').length
  return { ready, active, fallback, total: visualOperations.value.length }
})
const title = computed(() => {
  if (store.commandStatus === 'running') return 'Creating world…'
  if (store.commandStatus === 'success') return 'World created'
  if (store.commandStatus === 'error') return 'Command not understood'
  return 'Ready to create'
})
const visualTitle = computed(() => {
  if (visualSummary.value.total > 1) return `${visualSummary.value.ready} / ${visualSummary.value.total} visual assets ready`
  const label = store.imageGenerationOperation ? assetArtworkLabel(store.imageGenerationOperation) : 'Visual artwork'
  switch (store.imageGenerationOperation?.stage) {
    case 'preparing': return `Preparing ${label.toLowerCase()}…`
    case 'generating': return `Generating ${label.toLowerCase()}…`
    case 'applying': return `Applying ${label.toLowerCase()}…`
    case 'ready': return `${label} ready`
    case 'fallback': return 'Using fallback artwork'
    default: return ''
  }
})
const visualDetail = computed(() => {
  if (visualSummary.value.total > 1) return `${visualSummary.value.active} generating · ${visualOperations.value.filter(operation => operation.stage === 'queued').length} queued${visualSummary.value.fallback ? ` · ${visualSummary.value.fallback} fallback` : ''}`
  switch (store.imageGenerationOperation?.stage) {
    case 'preparing': return `${assetArtworkLabel(store.imageGenerationOperation)} fallback remains active`
    case 'generating': return `${assetArtworkLabel(store.imageGenerationOperation)} fallback remains active`
    case 'applying': return 'Manifest updated; waiting for Sprite application'
    case 'ready': return `Applied: ${assetArtworkLabel(store.imageGenerationOperation)}`
    case 'fallback': return store.imageGenerationOperation.outcome === 'generated_but_not_applied' ? 'Artwork unavailable; using fallback visual' : 'Generation unavailable; using fallback visual'
    default: return ''
  }
})
const detail = computed(() => {
  if (store.commandStatus === 'success' && store.lastCommand?.entityCount !== undefined) {
    return `${store.lastCommand.entityCount} entit${store.lastCommand.entityCount === 1 ? 'y' : 'ies'}`
  }
  if (store.commandStatus === 'error') return store.lastCommand?.message
  if (store.imageGenerationOperation?.status === 'succeeded') return `AI-generated ${assetArtworkLabel(store.imageGenerationOperation).toLowerCase()}`
  if (store.imageGenerationOperation?.status === 'failed') return 'The world remains playable'
  return 'Describe a game to begin'
})
</script>

<template>
  <div
    class="command-activity"
    :class="`command-activity--${store.commandStatus}`"
    aria-live="polite"
  >
    <span class="activity-label"><i aria-hidden="true" />Activity</span>
    <strong>{{ title }}</strong>
    <span class="activity-detail">{{ detail }}</span>
    <div
      v-if="visualOperations.length"
      class="visual-activity"
      :class="`visual-activity--${store.imageGenerationOperation?.stage ?? 'fallback'}`"
      aria-live="polite"
    >
      <span class="activity-label"><i aria-hidden="true" />Visuals</span>
      <strong><span v-if="store.imageGenerationOperation?.stage === 'generating' || store.imageGenerationOperation?.stage === 'applying'" aria-hidden="true">⟳ </span>{{ visualTitle }}</strong>
      <span class="activity-detail">{{ visualDetail }}</span>
      <ul v-if="visualOperations.length > 1" class="visual-operation-list">
        <li v-for="operation in visualOperations" :key="operation.operationId">
          <span>{{ operation.assetId }}</span><strong>{{ operation.stage ?? operation.status }}</strong>
        </li>
      </ul>
    </div>
    <span class="sr-only">{{ store.lastCommand?.message }}</span>
  </div>
</template>

<style scoped>
.command-activity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--studio-space-1);
}

.activity-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--studio-text-dim);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.activity-label i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--studio-accent);
}

strong,
.activity-detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visual-operation-list {
  display: grid;
  gap: var(--studio-space-1);
  margin: var(--studio-space-1) 0 0;
  padding: 0;
  color: var(--studio-text-muted);
  font-family: var(--studio-font-mono);
  font-size: 10px;
  list-style: none;
}

.visual-operation-list li {
  display: flex;
  justify-content: space-between;
  gap: var(--studio-space-2);
}

.visual-activity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--studio-space-1);
  margin-top: var(--studio-space-2);
  padding-top: var(--studio-space-2);
  border-top: 1px solid var(--studio-border);
}

.visual-activity--generating .activity-label i,
.visual-activity--applying .activity-label i {
  background: var(--studio-accent);
}

.visual-activity--ready .activity-label i {
  background: var(--studio-success);
}

.visual-activity--fallback .activity-label i {
  background: #e2b45f;
}

strong {
  color: var(--studio-text);
  font-size: 13px;
}

.activity-detail {
  color: var(--studio-text-muted);
  font-family: var(--studio-font-mono);
  font-size: 11px;
}

.command-activity--success .activity-label i {
  background: var(--studio-success);
}

.command-activity--error .activity-label i {
  background: #e27d86;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
