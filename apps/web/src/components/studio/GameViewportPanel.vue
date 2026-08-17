<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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

let pixiApp: Application | null = null
let visLoop: RuntimeVisualizationLoop | null = null
let runner: VisualizationRunner | null = null
let inputProvider: KeyboardInputProvider | null = null

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
    cameraAnchor: { x: 400, y: 300 },
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
})

onUnmounted(() => {
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
        <span class="viewport-status">Playable</span>
        <span>800 × 600</span>
      </div>
    </header>
    <div class="viewport-stage">
      <div
        ref="gameContainer"
        class="game-container"
        aria-label="Playable game canvas"
      />
    </div>
  </section>
</template>

<style scoped>
.game-viewport-panel {
  display: grid;
  grid-template-rows: 42px minmax(0, 1fr);
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
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  padding: clamp(16px, 3vw, 32px);
  overflow: auto;
  background:
    linear-gradient(45deg, rgb(255 255 255 / 1%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 1%) 25%, transparent 25%),
    var(--studio-bg);
  background-position: 0 0, 8px 8px;
  background-size: 16px 16px;
}

.game-container {
  width: min(100%, 800px);
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
  height: auto;
}
</style>
