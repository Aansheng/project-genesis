/**
 * gameStore — the Pinia store for the Project Genesis game UI.
 *
 * Routes user commands through the CommandExecutor chain:
 *   StudioCommandBar.vue → send() → DefaultCommandExecutor
 *     → IntentRouter → CreateWorldRuntimeExecutor
 *       → CreateWorldPipeline → RuntimeWorldStore
 *
 * Architecture (WO-S10-004):
 * - Replaced legacy MockPlanner + DefaultPipeline with CommandExecutor
 * - World source changed from Runtime.world to RuntimeWorldStore
 * - All streaming state preserved as inert UI (toggle continues to render)
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Runtime, DefaultRuntimeWorldStore } from '@genesis/runtime'
import type { RuntimeWorldStore } from '@genesis/runtime'
import { DefaultIntentRouter, DefaultGameIntentExtractor, DefaultCreateWorldPipeline, DefaultCreateWorldRuntimeExecutor, DefaultSemanticWorldGenerator, DefaultSemanticGameDslBuilder } from '@genesis/ai'
import { DefaultRuntimeProjection } from '@genesis/runtime'
import { DefaultCommandExecutor } from '../command'
import type { CommandExecutor } from '../command'

export type CommandStatus = 'idle' | 'running' | 'success' | 'error'

function createCommandExecutor(worldStore: RuntimeWorldStore): CommandExecutor {
  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
  const createWorldExecutor = new DefaultCreateWorldRuntimeExecutor(pipeline, worldStore)
  return new DefaultCommandExecutor(new DefaultIntentRouter(), createWorldExecutor)
}

export const useGameStore = defineStore('game', () => {
  const runtime = new Runtime()
  const worldStore: RuntimeWorldStore = new DefaultRuntimeWorldStore(runtime.world)
  const renderVersion = ref(0)
  const selectedEntityId = ref<string | null>(null)
  const log = ref<string[]>([])
  const commandStatus = ref<CommandStatus>('idle')
  const lastCommand = ref<import('../command').CommandExecutionResult | null>(null)

  // --- Streaming UI state (inert — preserved for UI backward compatibility) ---
  const isStreaming = ref(false)
  const streamingText = ref('')
  const streamingFinished = ref(false)
  const useStreaming = ref(false)

  const commandExecutor = createCommandExecutor(worldStore)

  const selectedEntity = computed(() => {
    renderVersion.value
    const id = selectedEntityId.value
    return id === null
      ? null
      : worldStore.getWorld().entities.find((entity) => entity.id === id) ?? null
  })

  function selectEntity(id: string): void {
    selectedEntityId.value = worldStore.getWorld().entities.some(
      (entity) => entity.id === id,
    )
      ? id
      : null
  }

  function markWorldUpdated(): void {
    renderVersion.value++
    if (
      selectedEntityId.value !== null &&
      !worldStore.getWorld().entities.some(
        (entity) => entity.id === selectedEntityId.value,
      )
    ) {
      selectedEntityId.value = null
    }
  }

  async function send(input: string) {
    commandStatus.value = 'running'
    try {
      const result = commandExecutor.execute(input)
      lastCommand.value = result
      log.value.push(result.message)
      commandStatus.value = result.success ? 'success' : 'error'

      if (result.success) {
        markWorldUpdated()
      }
      return result
    } catch (error) {
      const result = {
        success: false,
        message: error instanceof Error ? error.message : 'Command failed',
      }
      lastCommand.value = result
      log.value.push(result.message)
      commandStatus.value = 'error'
      return result
    }
  }

  return {
    runtime,
    worldStore,
    renderVersion,
    selectedEntityId,
    selectedEntity,
    selectEntity,
    markWorldUpdated,
    log,
    commandStatus,
    lastCommand,
    send,
    // Streaming state (inert — preserved for UI backward compatibility)
    isStreaming,
    streamingText,
    streamingFinished,
    useStreaming,
  }
})
