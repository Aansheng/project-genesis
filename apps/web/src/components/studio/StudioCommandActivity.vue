<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const title = computed(() => {
  if (store.commandStatus === 'running') return 'Creating world…'
  if (store.imageGenerationOperation?.status === 'running') return 'Generating player artwork…'
  if (store.imageGenerationOperation?.status === 'succeeded') return 'Player artwork ready'
  if (store.imageGenerationOperation?.status === 'failed') return 'Using fallback artwork'
  if (store.commandStatus === 'success') return 'World created'
  if (store.commandStatus === 'error') return 'Command not understood'
  return 'Ready to create'
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
