<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const input = ref('')
const latestResult = computed(() => {
  const results = store.log
  return results.length > 0
    ? results[results.length - 1]
    : 'Ready for a world description'
})

async function submitCommand(): Promise<void> {
  const text = input.value.trim()
  if (!text) return
  await store.send(text)
  input.value = ''
}
</script>

<template>
  <footer class="studio-command-bar">
    <div
      class="command-activity"
      aria-live="polite"
    >
      <span>Activity</span>
      <strong>{{ latestResult }}</strong>
    </div>
    <form @submit.prevent="submitCommand">
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
      <button type="submit">
        Generate
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
  min-height: 82px;
  padding: var(--studio-space-3) var(--studio-space-4);
  border-top: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

.command-activity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--studio-space-1);
}

.command-activity span {
  color: var(--studio-text-dim);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.command-activity strong {
  overflow: hidden;
  color: var(--studio-text-muted);
  font-family: var(--studio-font-mono);
  font-size: 11px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--studio-space-2);
  padding: var(--studio-space-2);
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
  box-shadow: 0 0 0 2px var(--studio-accent-soft);
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
