<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import StudioCommandActivity from './StudioCommandActivity.vue'

const store = useGameStore()
const input = ref('')
async function submitCommand(): Promise<void> {
  const text = input.value.trim()
  if (!text) return
  await store.send(text)
  input.value = ''
}
</script>

<template>
  <footer class="studio-command-bar">
    <StudioCommandActivity />
    <form
      :aria-busy="store.commandStatus === 'running'"
      @submit.prevent="submitCommand"
    >
      <label
        class="sr-only"
        for="studio-command-input"
      >Describe the game you want to create</label>
      <input
        id="studio-command-input"
        v-model="input"
        type="text"
        placeholder="Describe the game you want to create..."
        autocomplete="off"
      >
      <button
        type="submit"
        :disabled="store.commandStatus === 'running'"
      >
        {{ store.commandStatus === 'running' ? 'Generating…' : 'Generate' }}
      </button>
    </form>
  </footer>
</template>

<style scoped>
.studio-command-bar {
  display: grid;
  grid-template-columns: minmax(220px, 0.32fr) minmax(480px, 1fr);
  align-items: center;
  gap: var(--studio-space-4);
  min-height: 96px;
  padding: var(--studio-space-4) var(--studio-space-5);
  border-top: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--studio-space-2);
  min-height: 56px;
  padding: 6px;
  border: 1px solid var(--studio-border-strong);
  border-radius: var(--studio-radius-md);
  background: var(--studio-surface-raised);
}

input {
  min-width: 0;
  padding: 0 var(--studio-space-3);
  border: 0;
  background: transparent;
  color: var(--studio-text);
  font: inherit;
  outline: 0;
}

input::placeholder {
  color: var(--studio-text-muted);
}

form:focus-within {
  border-color: var(--studio-accent);
  box-shadow: 0 0 0 3px var(--studio-accent-soft);
}

button {
  min-width: 92px;
  padding: 9px var(--studio-space-4);
  border: 1px solid var(--studio-accent);
  border-radius: var(--studio-radius-sm);
  background: var(--studio-accent);
  color: #10131a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: var(--studio-accent-strong);
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--studio-accent-strong);
  outline-offset: 2px;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

button:active {
  transform: translateY(1px);
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
