# Visual Capability Matrix

Architecture version: v1.145

This matrix distinguishes semantic intent from asset and renderer realization.

| Capability | Semantically represented | Asset specified | Asset resolved | Renderer realized |
| --- | --- | --- | --- | --- |
| Art direction | YES | NO | NO | NO |
| Theme refinement | YES | NO | NO | NO |
| Palette semantics | YES | NO | NO | NO |
| Environment / terrain semantics | YES | NO | NO | NO |
| Background semantics | YES | NO | NO | NO |
| Player visual role | YES | YES | YES | Sprite with primitive fallback |
| Generic enemy visual role | YES | YES | YES | Sprite with primitive fallback |
| Boss visual role | YES | YES | YES | Sprite with primitive fallback |
| NPC / animal semantic archetypes | YES | YES | YES | Sprite with primitive fallback |
| Meaningful prop / structure archetypes | YES | YES | YES | Sprite with primitive fallback |
| Checkpoint / goal visual role | YES | YES | YES | Sprite with primitive fallback |
| Asset requirement representation | YES | YES | NO | NO |
| Asset identity | YES | YES | NO | NO |
| Entity → asset binding | YES | YES | NO | NO |
| Visual evolution delta plan | YES | YES | NO | NO |
| Targeted archetype impact analysis | YES | YES | NO | NO |
| Canonical generation-required set | YES | YES | NO | NO |
| Visual revision/session correlation | YES | YES | NO | NO |
| Asset generated | NO | YES | NO | NO |
| Asset manifest | YES | YES | YES | NO |
| Partial resolution representation | YES | YES | YES | NO |
| Actual asset store | NO | NO | YES | YES |
| Asset resolver | YES | YES | YES | NO |
| Asset store | YES | YES | YES | NO |
| Static URI resolution | YES | YES | YES | NO |
| Binary/image decode | NO | NO | NO | NO |
| Pixi sprite rendering | NO | NO | YES | YES |
| Pixi texture adapter | NO | NO | YES | YES |
| Primitive fallback | YES | YES | YES | YES |
| Mixed sprite + primitive world | NO | NO | YES | YES |
| Production static asset wiring | YES | YES | YES | YES |
| Static character assets | YES | YES | YES | YES |
| Background asset rendering | YES | YES | YES | Viewport-covering Pixi environment layer with fallback |
| Terrain asset rendering | YES | YES | YES | Existing terrain/platform bounds decorated by Pixi environment layer |
| Tileset rendering | NO | NO | NO | NOT YET |
| Animation | NO | NO | NO | NOT YET |
| AI image generation | YES | YES | YES | YES for meaningful character/prop/environment assets; static-only technical markers |
| Image generation domain | YES | NO | NO | NO |
| Text-to-image request | YES | NO | NO | NO |
| Image-to-image request | YES | NO | NO | NO |
| Image edit request | YES | NO | NO | NO |
| Reference-guided request | YES | NO | NO | NO |
| Real image provider | NO | NO | NO | NOT YET |
| Generated asset storage | NO | NO | NO | NOT YET |
| Generated asset → manifest | NO | NO | NO | NOT YET |
| AI-generated sprite | NO | NO | NO | NOT YET |
| Real text-to-image provider | YES | NO | YES | NO |
| Server-side image gateway | YES | NO | YES | NO |
| Generated image artifact | YES | YES | YES | YES for environment and character operations |
| Visual generation activity | YES | YES | YES | YES for environment and character operations |
| Generated artwork applied status | YES | YES | YES | YES for environment and character operations |

WO-S13-009 adds a session-owned generated artifact bridge and asynchronous
player Sprite upgrade. Data URIs remain provider/server transport details and
are not accepted by the generic AssetResolver. Codex CLI is experimental and
local-only; generated artifacts are not durable project assets.

DashScope native Qwen Image text-to-image is supported server-side. Its
provider-hosted PNG URL is temporary (24 hours), and transparent character
output is not guaranteed or verified; no alpha metadata is claimed. Generated
RGB images still require a future background-removal/alpha-extraction step
before durable AssetManifest publication.

The visual and asset layers are compiled deterministically from
`GameDesignSpecification`. Studio production wiring now resolves selected
repository-owned static character/prop fixtures and passes the manifest/store
to the Pixi renderer. Unresolved and failed entries retain primitive fallback.
Image-to-image, edit, and reference-guided remain domain-only. Visual generation
activity now exposes visual operations with safe asset-kind metadata,
manifest/application status, renderer outcome, and fallback without exposing
secrets or hidden reasoning. Multi-asset generation now includes one
background and one terrain visual per world. Persistence, tiling, and animation
remain deferred.

WO-S13-013 adds provider-independent semantic archetypes from upstream entity
names. Stable entity asset IDs remain per-entity, while matching archetypes
share one generation operation/resource with multiple bindings. Grouping keeps
enemy species, NPC/animal/prop names, and incompatible visual contexts distinct.

WO-S14-004 adds planning, but not execution, for semantic world evolution. The
current session stores immutable VisualDesignSpecification and
AssetSpecification revisions; the planner reports canonical additions,
replacements, removals/orphans, rebinding, unaffected assets, and world-level
visual dependencies. Theme/palette changes are broad eligible impact and the
current `timeOfDay` policy is background-only. `AssetManifest`, `AssetStore`,
image-generation operations, Pixi textures, and renderer bindings remain
unchanged until WO-S14-005.
