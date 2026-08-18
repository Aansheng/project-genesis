<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const title = computed(() => {
  if (store.commandStatus === 'running') return 'Creating world…'
  if (store.commandStatus === 'success') return 'World created'
  if (store.commandStatus === 'error') return 'Command not understood'
  return 'Ready to create'
})
const visualTitle = computed(() => {
  switch (store.imageGenerationOperation?.stage) {
    case 'preparing': return 'Preparing player artwork…'
    case 'generating': return 'Generating player artwork…'
    case 'applying': return 'Applying player artwork…'
    case 'ready': return 'Player artwork ready'
    case 'fallback': return 'Using fallback artwork'
    default: return ''
  }
})
const visualDetail = computed(() => {
  switch (store.imageGenerationOperation?.stage) {
    case 'preparing': return 'Player fallback remains active'
    case 'generating': return 'Player fallback remains active'
    case 'applying': return 'Manifest updated; waiting for Sprite application'
    case 'ready': return 'Applied to player'
    case 'fallback': return store.imageGenerationOperation.outcome === 'generated_but_not_applied' ? 'Artwork unavailable; using fallback visual' : 'Generation unavailable; using fallback visual'
    default: return ''
  }
})
const detail = computed(() => {
  if (store.commandStatus === 'success' && store.lastCommand?.entityCount !== undefined) {
    return `${store.lastCommand.entityCount} entit${store.lastCommand.entityCount === 1 ? 'y' : 'ies'}`
  }
  if (store.commandStatus === 'error') return store.lastCommand?.message
  if (store.imageGenerationOperation?.status === 'succeeded') return 'AI-generated player sprite'
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
      v-if="store.imageGenerationOperation"
      class="visual-activity"
      :class="`visual-activity--${store.imageGenerationOperation.stage ?? 'fallback'}`"
      aria-live="polite"
    >
      <span class="activity-label"><i aria-hidden="true" />Visuals</span>
      <strong><span v-if="store.imageGenerationOperation.stage === 'generating' || store.imageGenerationOperation.stage === 'applying'" aria-hidden="true">⟳ </span>{{ visualTitle }}</strong>
      <span class="activity-detail">{{ visualDetail }}</span>
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
