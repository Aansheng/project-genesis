# Sprint 18 Backlog — Visually Coherent Platformer Generation

Sprint 17 is FROZEN at v1.160. Human/CTO authorized Sprint 18 on 2026-08-25.
The sprint remains continuous and sequential; this file contains only the
current discovered work item, not a pre-planned feature backlog.

## Product Objective

A naturally generated platformer should compose background, ground, platforms,
and entity visuals according to their actual gameplay/rendering roles while
Runtime geometry remains authoritative. Generated images are skins/materials;
they never define collision or layout.

## Freeze Question

Can Genesis generate a mechanically complete platformer whose background,
ground, platforms, and entity visuals are assigned and composed according to
their correct visual roles, with Runtime geometry remaining authoritative?

## Fresh Sprint 18 Gap Analysis — 2026-08-25

Measured repository facts:

- `AssetRequirement` carries `kind`, subject, and technical profile, but the
  current environment requirements do not carry a typed render usage.
- `DefaultAssetManifestBuilder` preserves kind/target/entity binding but drops
  visual-role information needed by a renderer to choose usage.
- `AssetGenerationPolicy` derives prompt constraints from `kind` with fixed
  strings. The provider request has no explicit background-cover or
  ground-repeat usage contract, allowing scenic foreground/background leakage.
- `PixiEnvironmentRenderer` selects the first resolved `terrain` entry for both
  `terrain` and `platform` entities. The current `RenderWorld`/adapter path
  still carries only id/type/position; Runtime collision/layout remains the
  authority and is not inferred from image pixels.
- Existing gameplay and Runtime geometry behavior is already Product Verified
  by Sprint 17 and is not the current visual bottleneck.

Candidate gaps measured but not selected for this WO:

- platform-specific asset usage and local platform composition;
- carrying authoritative Runtime geometry into the render projection;
- repeated/tiled terrain composition;
- visual inspection/quality scoring or a broad graphics framework.

The smallest blocker is the missing role/usage contract at the existing asset
request boundary. Without it, prompt constraints and later Renderer selection
cannot distinguish even the currently generated background and ground roles.

## WO-S18-001 — Bounded Platformer Asset Render-Usage Contract

Status: **DONE**. Code Complete: YES. Product Verified: YES.

Architecture before: v1.160.

Architecture actual after: v1.161. See ADR-0275.

### Mission

Carry the smallest current platformer render-usage fact through the existing
semantic asset requirement → image request/context → manifest path, and derive
prompt constraints from that fact. The bounded vocabulary is deliberately
limited to the currently emitted roles:

- `entity-sprite`
- `background-cover`
- `ground-repeat-x`

This WO does not claim a final universal visual taxonomy. Local platform usage
and geometry-driven composition remain the next measured candidates.

### Allowed Scope

- Add optional, typed `renderUsage` metadata to the existing Shared asset
  requirement/request/context/manifest contracts.
- Emit the three bounded usages from the existing AI asset specification
  builder.
- Include usage in visual identity/grouping so semantically different requests
  cannot be silently merged.
- Derive deterministic role-aware prompt constraints from usage.
- Preserve usage in generated asset operations/manifest data where the current
  path already carries those records.
- Add focused Shared/AI/Web/Assets regressions and direct type/lint checks.

### Forbidden Scope

No VisualAssetManager, TerrainManager, universal role engine, tileset/editor,
animation/spritesheet/parallax framework, image-based collision, CV collider
extraction, arbitrary code/eval, provider regeneration loops, candidate merge,
Runtime changes, broad Renderer rewrite, platform-specific asset generation,
or geometry inference from images.

### Acceptance

1. Current generated entity/background/ground requirements carry truthful
   bounded render usage.
2. Provider image requests and image-generation context expose the same usage;
   prompts contain usage-derived constraints rather than an unstructured
   kind-only assumption.
3. Manifest entries preserve usage for the later Renderer composition slice.
4. Usage participates in deterministic visual identity/grouping.
5. Sprint 17's complete gameplay lifecycle, Runtime authority, stale-world
   isolation, and World Evolution continuity do not regress.

### Verification

Focused Shared/AI/Web/Assets tests, affected package suites, TypeScript, ESLint,
Web build where applicable, `git diff --check`, and real Studio creation with
the generated request path. The browser/runtime console must remain clean.

### Next-Work Boundary

After this WO, re-run product-level Gap Analysis. Select exactly one next item;
likely candidates are local platform usage or Runtime-geometry-backed terrain
composition, but neither is pre-approved. Sprint 19 is never entered
automatically.

## Fresh Sprint 18 Gap Analysis — post-WO-S18-001 measurement

The real fallback Studio creation produced the expected seven-entity platformer
and nine visual operations with clean browser diagnostics. The source and
runtime path now carry bounded usage, but the actual environment projection
still has one measured consumer gap:

- `PixiEnvironmentRenderer` chooses the first resolved environment `terrain`
  resource for both `terrain` and `platform` entities, even though the asset
  specification already emits an exact platform entity-sprite requirement.
- `PixiEntityRenderer` intentionally defers environment entities when a ground
  material is resolved, so the platform asset is otherwise hidden by the
  generic ground material.
- Runtime position remains the only current render geometry fact; this slice
  does not yet carry collision bounds or repeat/tile composition into the
  renderer.

The smallest measured next bottleneck is therefore consumption of the already
proven platform usage fact in the environment projection. It does not require
new Runtime geometry, a new visual taxonomy, or image inspection.

## WO-S18-002 — Consume bounded platform usage in environment composition

Status: **DONE**. Code Complete: YES. Product Verified: YES.

Architecture before: v1.161.

Architecture actual after: v1.162. See ADR-0276.

### Mission

Make the existing Renderer consume the bounded role facts already emitted by
WO-S18-001: `ground-repeat-x` remains the environment ground material and a
resolved exact `entity-sprite` platform requirement is preferred for the
matching platform entity. Background selection prefers `background-cover`.
Legacy manifests without `renderUsage` retain the previous terrain fallback.

### Allowed Scope

- Update `PixiEnvironmentRenderer` asset selection using existing manifest
  fields and the bounded usages already in the contract.
- Prefer exact platform entity assets when the environment renderer owns a
  platform entity; preserve the ground fallback when no exact platform asset is
  available.
- Preserve Runtime position/render bounds as the authoritative projection
  inputs and preserve primitive/static fallback behavior.
- Add focused Renderer regressions and direct package verification.

### Forbidden Scope

No new universal visual taxonomy, Runtime geometry contract, collision changes,
tiling/repeat implementation, image-pixel inference, platform manager,
VisualAssetManager, broad Renderer rewrite, animation/spritesheets/parallax,
arbitrary code/eval, or Sprint 19 entry.

### Acceptance

1. A resolved platform entity-sprite is selected for its matching platform
   entity instead of the generic ground material.
2. Ground continues to use the bounded ground material and legacy manifests
   remain compatible.
3. Background usage selection remains truthful.
4. Runtime gameplay and fallback rendering behavior do not regress.

### Verification

Renderer focused/full tests, TypeScript, ESLint, Web regression/build, and a
real Studio fallback creation with clean browser diagnostics.

## Fresh Sprint 18 Gap Analysis — real image-backed measurement

The real Studio path at the configured 8787 gateway was exercised again with
the natural-language platformer request. The provider candidate was rejected
as `product_incomplete`, so the deterministic seven-entity baseline remained
the truthful Runtime world. The image path itself was not fallback-only:

- Background, Terrain, Player, and Enemy reached `codex-cli → succeeded →
  resolved → applied` (`4 / 9 ready`). The canvas showed generated mountain
  background, local generated ground material, and independently applied
  generated entity sprites. Browser warning/error logs were empty.
- The real Runtime snapshot showed `terrain` and `platform` both with
  `type: terrain`; Inspector/semantic data distinguished their names as
  `Terrain` and `Platform`.
- Before the bounded repair, the adapter dropped `semantic.name`, so the
  environment Renderer selected `terrain-main` for the platform and used the
  terrain catalog envelope. The smallest source gap was therefore semantic
  platform identity projection, not tiling or a new geometry system.
- The bounded repair is implemented and unit-tested in the working tree (see
  ADR-0277). It preserves Runtime authority and selects the matching platform
  entity-sprite plus existing platform catalog bounds when a resolved resource
  exists.
- The same run's `entity-platform-primary` provider operation timed out at the
  configured Codex CLI boundary. Observatory truthfully recorded provider
  failure and retained fallback. Consequently, real provider-backed platform
  asset application is still an unresolved acceptance gate; it is not claimed
  as Product Verified.

Measurement A (background separation) and D (independent entity sprites) pass
for the resolved resources. Measurement B has no evidence that a wider repeat
or tile composition is required: the current scene exposes only local
Runtime-authoritative terrain/platform bounds, and the generated ground is
fitted to those bounds. Do not implement repeat/tiling speculatively.

## WO-S18-003 — Ground-Repeat Composition Measurement

Status: **BLOCKED**. Code Complete: YES for the bounded semantic projection
repair; Product Verified: PENDING.

### Bounded Question

With a successful image-backed generated platformer scene, does the current
`ground-repeat-x` asset render as a coherent ground surface across the
Runtime-authoritative bounds, or is a smaller bounded composition change
required?

### Blocking Acceptance Gate

Needs one real generated scene with resolved background, ground, and platform
visual resources plus observable Runtime positions/bounds. A real image-backed
scene was obtained and resolved Background/Terrain/Player/Enemy, but the
provider timed out for `entity-platform-primary`. The platform selection and
platform-bounds repair therefore has automated evidence only; the required
real provider-backed platform application remains open.

### Forbidden Until Measurement

No tiling/repeat implementation, Runtime geometry contract, image-pixel
inspection, broad Renderer rewrite, visual quality framework, new visual
manager, provider regeneration loop, or Sprint 19 entry is authorized by this
blocked item. Do not generate WO-S18-004 while this acceptance gate remains
unresolved; the next-work discovery boundary is reached only after this item
is Product Verified.

### Current acceptance gate

The remaining gate is narrow and external to the Renderer code: obtain one
provider-successful `entity-platform-primary` result through the existing
production image path, then verify that the real canvas applies that exact
resource to the Runtime `Platform` bounds. A provider timeout is a provider
failure and must retain deterministic/static fallback; it is not a platform
composition pass.
