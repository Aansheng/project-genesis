<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Application, Container } from 'pixi.js'
import {
  DefaultAnimationFrameScheduler,
  DefaultCameraController,
  DefaultEntityVisualCatalog,
  DefaultPixiEntityRenderer,
  PixiEnvironmentRenderer,
  DefaultRuntimeRendererAdapter,
  DefaultRuntimeVisualizationLoop,
  DefaultVisualizationRunner,
  KeyboardInputProvider,
  StoreBackedWorldProvider,
} from '@genesis/renderer'
import type {
  RuntimeVisualizationLoop,
  RuntimeGameplayProgressionStateObserver,
  RuntimeGameplaySessionStateObserver,
  VisualizationRunner,
} from '@genesis/renderer'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeSystemRegistry,
} from '@genesis/runtime'
import type {
  GameplayRuleExecutionObserver,
  RuntimeGameplayRuleExecutionConfig,
  RuntimeGameplaySessionStatus,
} from '@genesis/runtime'
import type { GameplayEventObserver } from '@genesis/shared'
import { resolveWorldSpatialMode } from '@genesis/shared'
import { useGameStore } from '../../stores/gameStore'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { useI18nStore } from '../../stores/i18n'
import { registerStudioRuntimeSystems } from './runtimeMotionProfile'

const store = useGameStore()
const observatoryDataStore = useObservatoryDataStore()
const i18n = useI18nStore()
const gameContainer = ref<HTMLDivElement | null>(null)
const runtimeMounted = ref(false)
const gameplaySessionStatus = computed<RuntimeGameplaySessionStatus>(() => store.gameplaySessionState.status)
const isTopDownWorld = computed(() => resolveWorldSpatialMode(store.semanticWorld?.worldType) === 'top-down')
const entityCount = computed(() => {
  void store.renderVersion
  return store.worldStore.getWorld().entities.length
})
const viewportStatus = computed(() => {
  if (!entityCount.value) return 'Empty'
  return runtimeMounted.value ? 'Running' : 'Ready'
})

let pixiApp: Application | null = null
let visLoop: RuntimeVisualizationLoop | null = null
let runner: VisualizationRunner | null = null
let entityRenderer: DefaultPixiEntityRenderer | null = null
let environmentRenderer: PixiEnvironmentRenderer | null = null
let inputProvider: KeyboardInputProvider | null = null
let resizeObserver: ResizeObserver | null = null
let stopMotionProfileWatch: (() => void) | null = null
let respawnRuntimeGameplay: (() => void) | null = null
const cameraAnchor = { x: 400, y: 300 }
const visualCatalog = new DefaultEntityVisualCatalog()
const gameplayEventObserver: GameplayEventObserver = {
  observe(events) {
    observatoryDataStore.recordRuntimeGameplayEvents(events)
    if (events.some(event => event.type === 'ENTITY_ADDED' || event.type === 'ENTITY_REMOVED')) {
      store.synchronizeRuntimeVisualBindings()
      observatoryDataStore.loadRuntimeWorld(store.worldStore.getWorld(), store.currentWorldId)
    }
  },
}
const gameplayRuleExecutionObserver: GameplayRuleExecutionObserver = {
  observe(results) {
    observatoryDataStore.recordRuntimeGameplayRuleResults(results)
    if (results.some(result => result.committed)) {
      observatoryDataStore.loadRuntimeWorld(store.worldStore.getWorld(), store.currentWorldId)
    }
  },
}
const gameplaySessionStateObserver: RuntimeGameplaySessionStateObserver = {
  observe(state) {
    store.recordRuntimeGameplaySessionState(state)
    observatoryDataStore.recordRuntimeGameplaySessionState(state)
  },
}
const gameplayProgressionStateObserver: RuntimeGameplayProgressionStateObserver = {
  observe(state) {
    observatoryDataStore.recordRuntimeGameplayProgressionState(state)
  },
}

function resizeViewport(): void {
  const container = gameContainer.value
  if (!container || !pixiApp) return

  const bounds = container.getBoundingClientRect()
  const width = Math.max(1, Math.round(bounds.width || container.clientWidth || 800))
  const height = Math.max(1, Math.round(bounds.height || container.clientHeight || 600))

  pixiApp.renderer?.resize?.(width, height)
  cameraAnchor.x = width / 2
  cameraAnchor.y = height / 2
  environmentRenderer?.setViewport(width, height)
}

function focusGameViewport(): void {
  gameContainer.value?.focus()
}

onMounted(() => {
  if (!gameContainer.value) return

  pixiApp = new Application({
    width: 800,
    height: 600,
    backgroundColor: 0x0c0d10,
    antialias: true,
    resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    autoDensity: true,
  })
  gameContainer.value.appendChild(pixiApp.view as HTMLCanvasElement)
  const bounds = gameContainer.value?.getBoundingClientRect()
  environmentRenderer?.setViewport(
    Math.max(1, Math.round(bounds?.width || gameContainer.value?.clientWidth || 800)),
    Math.max(1, Math.round(bounds?.height || gameContainer.value?.clientHeight || 600)),
  )
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resizeViewport)
    resizeObserver.observe(gameContainer.value)
  }

  const entityContainer = new Container()
  const environmentContainer = new Container()
  pixiApp.stage.addChild(environmentContainer, entityContainer)

  const systemRegistry = new DefaultRuntimeSystemRegistry()
  inputProvider = new KeyboardInputProvider(window)
  inputProvider.attach()
  registerStudioRuntimeSystems(systemRegistry, inputProvider, store.semanticWorld?.worldType)
  stopMotionProfileWatch = watch(
    () => store.semanticWorld?.worldType,
    (worldType) => registerStudioRuntimeSystems(systemRegistry, inputProvider!, worldType),
    { flush: 'sync' },
  )

  const ruleExecutionConfig: RuntimeGameplayRuleExecutionConfig = {
    getRuleSet: () => store.gameplayRuleSet,
    getWorldId: () => store.currentWorldId || undefined,
    getSessionId: () => store.currentWorldId || undefined,
    getSemanticRevision: () => store.semanticRevision,
    getSemanticWorld: () => store.semanticWorld ?? undefined,
  }
  const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry, store.gameplayEventCollector, ruleExecutionConfig)
  const adapter = new DefaultRuntimeRendererAdapter({
    getWorldSpatialMode: () => resolveWorldSpatialMode(store.semanticWorld?.worldType),
  })
  const cameraController = new DefaultCameraController()
  watch(() => store.worldRevision, () => cameraController.reset?.(), { flush: 'sync' })
  watch(() => store.currentWorldId, (worldId) => {
    store.gameplayEventCollector.setWorldId(worldId || undefined)
  }, { flush: 'sync', immediate: true })
  try {
    if (typeof PixiEnvironmentRenderer === 'function') {
      environmentRenderer = new PixiEnvironmentRenderer(environmentContainer, {
        width: 800,
        height: 600,
        cameraController,
        cameraAnchor,
        assetManifest: store.assetManifest,
        assetStore: store.assetStore,
        visualCatalog,
        onAssetApplication: store.reportAssetApplication,
      })
    }
  } catch {
    // Test doubles may intentionally expose only the entity renderer surface.
    environmentRenderer = null
  }
  resizeViewport()
  const renderer = new DefaultPixiEntityRenderer(entityContainer, {
    catalog: visualCatalog,
    cameraController,
    cameraAnchor,
    assetManifest: store.assetManifest,
    assetStore: store.assetStore,
    onAssetApplication: store.reportAssetApplication,
  })
  entityRenderer = renderer
  watch(() => store.renderVersion, () => {
    entityRenderer?.setAssetManifest?.(store.assetManifest)
    environmentRenderer?.setAssetManifest(store.assetManifest)
  })
  const worldProvider = new StoreBackedWorldProvider(store.worldStore)
  const worldSink = {
    setWorld(world: Parameters<typeof store.worldStore.setWorld>[0]): void {
      store.worldStore.setWorld(world)
      store.markWorldUpdated()
    },
  }

  respawnRuntimeGameplay = () => {
    const result = executionLoop.respawnGameplay(store.worldStore.getWorld())
    if (!result.respawned) return
    worldSink.setWorld(result.world)
    if (result.gameplaySessionState) gameplaySessionStateObserver.observe(result.gameplaySessionState)
    if (result.gameplayProgressionState) gameplayProgressionStateObserver.observe(result.gameplayProgressionState)
  }

  visLoop = new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    renderer,
    store.worldStore.getWorld(),
    worldProvider,
    worldSink,
    environmentRenderer ?? undefined,
    gameplayEventObserver,
    gameplayRuleExecutionObserver,
    gameplaySessionStateObserver,
    gameplayProgressionStateObserver,
  )
  runner = new DefaultVisualizationRunner(
    new DefaultAnimationFrameScheduler(),
    visLoop,
  )
  runner.start()
  runtimeMounted.value = true
})

onUnmounted(() => {
  runtimeMounted.value = false
  stopMotionProfileWatch?.()
  stopMotionProfileWatch = null
  respawnRuntimeGameplay = null
  resizeObserver?.disconnect()
  resizeObserver = null
  runner?.stop()
  runner = null
  visLoop?.stop()
  visLoop = null
  inputProvider?.detach()
  inputProvider = null
  entityRenderer?.destroy?.()
  entityRenderer = null
  environmentRenderer?.destroy()
  environmentRenderer = null
  pixiApp?.destroy(true, { children: true, texture: true })
  pixiApp = null
})
</script>

<template>
  <section
    class="game-viewport-panel"
    aria-labelledby="game-viewport-title"
  >
    <header class="viewport-header">
      <div class="viewport-title">
        <span class="panel-kicker">Canvas</span>
        <h2 id="game-viewport-title">
          Game Viewport
        </h2>
      </div>
      <div class="viewport-meta">
        <span class="viewport-status">{{ viewportStatus }}</span>
        <span>{{ entityCount }} entities</span>
      </div>
    </header>
    <div class="viewport-stage">
      <div
        ref="gameContainer"
        class="game-container"
        aria-label="Playable game canvas"
        tabindex="0"
        @pointerdown="focusGameViewport"
      >
        <div
          v-if="viewportStatus === 'Empty'"
          class="viewport-empty-state"
          aria-live="polite"
        >
          <strong>No game world yet</strong>
          <span>Describe a game below to generate a playable world.</span>
        </div>
        <div
          v-if="gameplaySessionStatus !== 'active'"
          class="gameplay-lifecycle-overlay"
          :data-testid="`studio-gameplay-${gameplaySessionStatus}`"
          aria-live="assertive"
        >
          <div class="gameplay-lifecycle-card">
            <span class="gameplay-lifecycle-kicker">{{ gameplaySessionStatus }}</span>
            <h3>{{ i18n.t(gameplaySessionStatus === 'failed' ? 'studio.lifecycle.gameOver' : 'studio.lifecycle.victory') }}</h3>
            <p>{{ i18n.t(gameplaySessionStatus === 'failed' ? 'studio.lifecycle.gameOverDetail' : 'studio.lifecycle.victoryDetail') }}</p>
            <button
              v-if="gameplaySessionStatus === 'failed'"
              type="button"
              class="gameplay-lifecycle-action"
              data-testid="studio-respawn-gameplay"
              @click="respawnRuntimeGameplay?.()"
            >
              {{ i18n.t('studio.lifecycle.respawn') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <footer
      class="viewport-controls"
      aria-label="Game controls"
    >
      <span>Arrow Keys <em>Move</em></span>
      <span v-if="!isTopDownWorld">Space <em>Jump</em></span>
    </footer>
  </section>
</template>

<style scoped>
.game-viewport-panel {
  display: grid;
  grid-template-rows: 52px minmax(0, 1fr) 36px;
  min-width: 0;
  min-height: 0;
  background: var(--studio-bg);
}

.viewport-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 var(--studio-space-4);
  border-bottom: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

h2 {
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.panel-kicker {
  display: block;
  color: var(--studio-text-dim);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.viewport-title h2 {
  margin-top: 1px;
}

.viewport-meta {
  display: flex;
  align-items: center;
  gap: var(--studio-space-3);
  color: var(--studio-text-dim);
  font-family: var(--studio-font-mono);
  font-size: 10px;
}

.viewport-status {
  color: var(--studio-success);
  font-family: inherit;
}

.viewport-header span {
  color: var(--studio-text-dim);
  font-family: var(--studio-font-mono);
  font-size: 11px;
}

.viewport-stage {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  padding: clamp(12px, 2vw, 24px);
  overflow: auto;
  background:
    linear-gradient(45deg, rgb(255 255 255 / 1%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 1%) 25%, transparent 25%),
    var(--studio-bg);
  background-position: 0 0, 8px 8px;
  background-size: 16px 16px;
}

.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
  border: 1px solid var(--studio-border-strong);
  border-radius: var(--studio-radius-md);
  overflow: hidden;
  background: var(--studio-bg);
  box-shadow: 0 16px 48px rgb(3 4 7 / 38%);
  line-height: 0;
}

.game-container:focus-visible {
  outline: 2px solid var(--studio-accent);
  outline-offset: 2px;
}

.game-container :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.viewport-empty-state {
  position: absolute;
  inset: 50% auto auto 50%;
  display: grid;
  gap: var(--studio-space-2);
  width: min(280px, calc(100% - 32px));
  transform: translate(-50%, -50%);
  color: var(--studio-text-muted);
  text-align: center;
  pointer-events: none;
  line-height: 1.5;
}

.viewport-empty-state strong {
  color: var(--studio-text);
  font-size: 13px;
  font-weight: 600;
}

.viewport-empty-state span {
  color: var(--studio-text-dim);
  font-size: 11px;
}

.viewport-controls {
  display: flex;
  align-items: center;
  gap: var(--studio-space-4);
  padding: 0 var(--studio-space-4);
  border-top: 1px solid var(--studio-border);
  color: var(--studio-text-muted);
  font-family: var(--studio-font-mono);
  font-size: 10px;
}

.viewport-controls em {
  margin-left: var(--studio-space-1);
  color: var(--studio-text-dim);
  font-style: normal;
}

.gameplay-lifecycle-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: var(--studio-space-4);
  background: rgb(3 4 7 / 68%);
  line-height: 1.4;
}

.gameplay-lifecycle-card {
  display: grid;
  gap: var(--studio-space-3);
  width: min(360px, 100%);
  padding: var(--studio-space-5);
  border: 1px solid var(--studio-border-strong);
  border-radius: var(--studio-radius-md);
  background: var(--studio-surface);
  box-shadow: 0 18px 52px rgb(0 0 0 / 42%);
  text-align: center;
}

.gameplay-lifecycle-kicker {
  color: var(--studio-text-dim);
  font-family: var(--studio-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.gameplay-lifecycle-card h3 {
  color: var(--studio-text);
  font-size: 22px;
  font-weight: 650;
}

.gameplay-lifecycle-card p {
  color: var(--studio-text-muted);
  font-size: 12px;
}

.gameplay-lifecycle-action {
  justify-self: center;
  min-height: 32px;
  padding: 0 var(--studio-space-4);
  border: 1px solid var(--studio-accent);
  border-radius: var(--studio-radius-sm);
  background: var(--studio-accent);
  color: var(--studio-bg);
  font-family: var(--studio-font-mono);
  font-size: 11px;
  cursor: pointer;
}

.gameplay-lifecycle-action:hover {
  background: var(--studio-accent-strong);
}
</style>
