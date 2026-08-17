<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Application, Container } from 'pixi.js'
import {
  DefaultAnimationFrameScheduler,
  DefaultCameraController,
  DefaultEntityVisualCatalog,
  DefaultPixiEntityRenderer,
  DefaultRuntimeRendererAdapter,
  DefaultRuntimeVisualizationLoop,
  DefaultVisualizationRunner,
  KeyboardInputProvider,
  StoreBackedWorldProvider,
} from '@genesis/renderer'
import type {
  RuntimeVisualizationLoop,
  VisualizationRunner,
} from '@genesis/renderer'
import {
  DefaultGravitySystem,
  DefaultGroundCollisionSystem,
  DefaultJumpSystem,
  DefaultPlayerControllerSystem,
  DefaultVerticalMotionSystem,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeSystemRegistry,
} from '@genesis/runtime'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const gameContainer = ref<HTMLDivElement | null>(null)
const runtimeMounted = ref(false)
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
let inputProvider: KeyboardInputProvider | null = null
let resizeObserver: ResizeObserver | null = null
const cameraAnchor = { x: 400, y: 300 }

function resizeViewport(): void {
  const container = gameContainer.value
  if (!container || !pixiApp) return

  const bounds = container.getBoundingClientRect()
  const width = Math.max(1, Math.round(bounds.width || container.clientWidth || 800))
  const height = Math.max(1, Math.round(bounds.height || container.clientHeight || 600))

  pixiApp.renderer?.resize?.(width, height)
  cameraAnchor.x = width / 2
  cameraAnchor.y = height / 2
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
  resizeViewport()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resizeViewport)
    resizeObserver.observe(gameContainer.value)
  }

  const entityContainer = new Container()
  pixiApp.stage.addChild(entityContainer)

  const systemRegistry = new DefaultRuntimeSystemRegistry()
  inputProvider = new KeyboardInputProvider(window)
  inputProvider.attach()
  systemRegistry.register(new DefaultPlayerControllerSystem(inputProvider, 3))
  systemRegistry.register(new DefaultJumpSystem(inputProvider, 10))
  systemRegistry.register(new DefaultGravitySystem(0.5))
  systemRegistry.register(new DefaultVerticalMotionSystem())
  systemRegistry.register(new DefaultGroundCollisionSystem(400))

  const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
  const adapter = new DefaultRuntimeRendererAdapter()
  const entityRenderer = new DefaultPixiEntityRenderer(entityContainer, {
    catalog: new DefaultEntityVisualCatalog(),
    cameraController: new DefaultCameraController(),
    cameraAnchor,
  })
  const worldProvider = new StoreBackedWorldProvider(store.worldStore)
  const worldSink = {
    setWorld(world: Parameters<typeof store.worldStore.setWorld>[0]): void {
      store.worldStore.setWorld(world)
      store.markWorldUpdated()
    },
  }

  visLoop = new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    entityRenderer,
    store.worldStore.getWorld(),
    worldProvider,
    worldSink,
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
  resizeObserver?.disconnect()
  resizeObserver = null
  runner?.stop()
  runner = null
  visLoop?.stop()
  visLoop = null
  inputProvider?.detach()
  inputProvider = null
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
      >
        <div
          v-if="viewportStatus === 'Empty'"
          class="viewport-empty-state"
          aria-live="polite"
        >
          <strong>No game world yet</strong>
          <span>Describe a game below to generate a playable world.</span>
        </div>
      </div>
    </div>
    <footer
      class="viewport-controls"
      aria-label="Game controls"
    >
      <span>Arrow Keys <em>Move</em></span>
      <span>Space <em>Jump</em></span>
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
</style>
