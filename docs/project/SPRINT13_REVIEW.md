# Sprint 13 Review — Visual & Asset Generation

## Status

Sprint 13 is frozen. Architecture remains v1.139.

## Proven production chain

`Natural Language → GameDesignSpecification → VisualDesignSpecification → AssetSpecification → Semantic Archetype Planning → Bounded Multi-Asset Generation → Generated Artifact Publication → AssetManifest → AssetStore → Pixi Entity / Environment Rendering → Playable World`

## Browser evidence

- Provider configuration: local Codex CLI-backed game-design and image gateway;
  no secrets exposed.
- Farm: 10 upstream entities; 6 visual jobs. Three cows shared one Cow job and
  three bindings; five crops shared one Crop job and five bindings; Barn entered
  an eligible prop job.
- RPG: 7 entities; Merchant, Villager, and Slime remained distinct, with two
  Villagers sharing one job.
- Mixed enemies: Slime, Skeleton, and Wolf were separate archetype jobs.
- Survival: Zombie, Supply Chest, and Campfire were eligible alongside the
  environment jobs.
- Sandbox: Deer, Tree, Boulder, and Cabin were eligible; repeated Deer/Tree
  entities shared archetype jobs.
- Runtime stayed active and entity counts/IDs remained independent. Successive
  world creation removed old visual Activity entries. Browser error logs were
  empty.

## Deferred to future work

Reference-guided consistency, image-to-image, animation, sprite sheets,
persistent generated artifact storage, tilesets/autotiling, advanced terrain,
visual quality scoring, and game UI generation remain deferred.

Sprint 14 readiness: natural-language world evolution with targeted semantic
delta, runtime mutation, and regeneration of only affected visuals.
