# Sprint 26 — Second-Genre Generalization Proof

Status: **READY FOR SPRINT FREEZE REVIEW**

Architecture before Sprint 26: **v1.173**
Current architecture boundary: **v1.176**

## Product thesis

Prove that Genesis can generate and continue evolving a small playable 2D
Survivor-like game outside the established platformer path without adding a
genre-specific Runtime, engine, manager, execution loop, renderer, or world
authority.

Primary scenario:

`帮我生成一个2D幸存者游戏`

The bounded target is a small top-down survival probe, not commercial Survivor
feature parity.

## Initial Gap Analysis

Date: 2026-08-28

The first production-path measurement traced:

`StudioCommandBar → gameStore.send() → DefaultIntentRouter →
DefaultCreateWorldPipeline → GameIntent → SemanticWorld → Game DSL → Runtime`

The creation verb `生成` is recognized, so the request reaches CreateWorld.
However, `DefaultGameIntentExtractor` only recognizes English `survival` and
`survivor`. The Chinese phrase `幸存者` (and the existing Chinese synonym
`生存`) is not recognized. The authoritative `GameIntent` therefore becomes
`sandbox`, the semantic generator produces the sandbox template, and the
current Runtime world contains only a Player. This is the first blocker before
movement, enemy pressure, combat, progression, or visual verification can be
meaningfully measured for the requested genre.

## Capability audit snapshot

| Capability | Current repository truth | Sprint 26 implication |
| --- | --- | --- |
| Create routing | `生成` routes to `create-world`; `幸存者`/`生存` now select `survival` with confidence 1.0 | Verified through the production path |
| Survival `worldType` | `WorldType` includes `survival`; authoritative intent mapping exists | Domain value exists |
| Survival defaults | Deterministic template produces Player, Resource, Tree, Stone, Enemy, Campfire | Semantic seed exists, only one Enemy |
| DSL / Runtime projection | One DSL entity per semantic entity; Position/Health/collision components project | Structural projection exists |
| Player movement | Controller maps left/right/up/down; survival selects generic top-down motion while platformer keeps jump/gravity/ground collision | Verified in two axes for survival; platformer regression retained |
| Enemy movement | No target-following system or enemy velocity path is wired | Deferred; measure after entering survival |
| Contact / damage | Runtime contact facts and trusted `DAMAGE_ENTITY` are supported; lethal Player damage commits failed | Generic pressure primitive exists |
| Player offense | No survival offense/defeat interaction is currently generated; platformer stomp is genre-specific in the deterministic defaults | Must be measured before adding combat |
| XP / level | Generic additive numeric progression and one threshold transition are supported | Reusable where a supported rule can reach it |
| Spawn / waves / duration | Spawn action, spawn rules, timer, and survive-duration execution are deferred | Do not add until Product Verification proves required |
| Renderer / assets | Existing semantic visual → asset manifest → resolver → Pixi path handles Player/Enemy/props/environment with primitive fallback | No new visual pipeline needed |
| Evolution | Existing World Evolution preserves a current world and can add five enemies through deterministic recovery | Verified: survival `world-1`, 6 → 11 entities |

## Sole selected first blocker

`PRODUCT_GAP`: the primary Chinese request is accepted as creation but is
compiled as `sandbox`, not `survival`.

Verified capabilities A/B/C exist (creation routing, the `survival` semantic
world type/template, and the existing DSL/Runtime projection); Sprint
acceptance still requires D (the requested Chinese phrase selecting survival);
D is the smallest blocker because all downstream Survivor measurements are
invalid while the production path contains only a sandbox Player.

## WO-S26-001 — Chinese Survivor Intent Alias

Status: **DONE — Code Complete = YES; Product Verified = YES for the bounded
alias/pipeline acceptance**

Measured bottleneck: the core Chinese request reaches CreateWorld but the
authoritative intent extractor falls back to `sandbox` because `幸存者` and
`生存` are not survival aliases.

Architecture: v1.173 → v1.174

Dependencies: Sprint 25 frozen; Sprint 26 explicitly authorized; no unresolved
human decision is required for this bounded alias alignment.

Allowed scope:

- Add deterministic Chinese survival aliases to the existing intent extractor,
  router genre-confidence check, and standalone semantic generator compatibility
  matcher.
- Add focused extractor/router tests and a production CreateWorld pipeline
  regression for `帮我生成一个2D幸存者游戏`.
- Update the capability/state documentation to reflect the measured front-door
  behavior.

Forbidden scope:

- Any Survivor-specific Runtime, engine, manager, renderer, world authority, or
  new genre ontology.
- Four-direction system wiring, gravity policy, enemy AI/chase, weapons,
  projectiles, spawns, waves, timer, ability/inventory systems, or progression
  expansion.
- Structured-output infrastructure, provider changes, legacy reconnection, or
  unrelated refactoring.

Acceptance criteria:

1. The exact Chinese request routes to `create-world` with genre confidence
   `1.0` and extracts `survival`.
2. The real CreateWorld pipeline returns `success: true`, semantic
   `worldType: survival`, the six deterministic survival entities, and
   Position/Runtime projections for those entities.
3. English `survival`/`survivor` behavior and existing platformer routing do
   not regress.
4. No new Runtime or Renderer implementation is introduced.

Automated verification: PASS — full AI suite (156 files / 9425 tests), full Web
suite (47 files / 3552 tests), AI and Web TypeScript checks, Web production
build, focused intent/pipeline regressions, and AI/Web lint with no errors
(existing warnings only). Root `pnpm typecheck` was attempted but Turbo could
not initialize its TLS client because this host reported that no Keychain is
available; package-level checks passed.

Product Verification: PASS for this bounded WO in real Genesis Studio on
`localhost:5888`. The exact request produced `Runtime active`, six entities in
Explorer/Inspector/Viewport, the survival set `player/resource/tree/stone/
enemy/campfire`, Player `Position (80,400)`, and clean browser warning/error
diagnostics. This verifies front-door classification and current semantic →
DSL → Runtime → Pixi reachability; it does not claim top-down combat parity.

Observability: no false gameplay or combat facts may be claimed. Generation
diagnostics must continue to identify the actual semantic world and provider or
deterministic fallback source.

Non-goal: this WO does not claim the Sprint 26 thesis is proven. After this WO,
run one fresh Gap Analysis and generate at most one next bounded item.

## Post-WO Gap Analysis — after WO-S26-001

Date: 2026-08-28

Status: **DONE — exactly one next bounded WO generated**

Measured result: the requested Chinese phrase now routes with genre confidence
`1.0`, extracts `survival`, and reaches the existing deterministic survival
template. Real Studio displayed six semantic/Runtime entities and an active
Pixi session with clean diagnostics. The alias blocker is closed.

The next blocker is `PRODUCT_GAP — semantic motion profile selection`. The
current `GameViewportPanel` registers `DefaultJumpSystem`,
`DefaultGravitySystem`, `DefaultVerticalMotionSystem`, and
`DefaultGroundCollisionSystem` for every world, including `survival`. The
Survivor probe therefore still exposes the platformer-only `Space Jump` control
and is coupled to platformer gravity/ground behavior. A discrete browser
`ArrowRight` probe left the inspected Player at `(80,400)`, so top-down movement
is not yet a passing product claim; the source wiring and visible control label
make the profile-selection defect independently reproducible.

The existing generic `DefaultPlayerControllerSystem` already accepts four
directions and the Runtime/Renderer seams are reusable. No enemy AI, combat,
spawn, wave, timer, or progression expansion is selected by this analysis.

## WO-S26-002 — World-Type-Selected Generic Motion Profile

Status: **DONE — Code Complete = YES; Product Verified = YES**

Measured bottleneck: all Studio worlds receive platformer gravity, jump, and
ground-collision registration. The survival request now reaches the right
semantic world, but it is not yet composed as a top-down probe.

Architecture: v1.174 → v1.175

Allowed scope:

- Reuse the existing semantic `WorldType` at the Web composition boundary to
  select a generic motion profile.
- Keep the existing platformer registration unchanged.
- For `survival`, compose the existing four-direction player controller and
  generic position/motion/contact systems without platformer jump, gravity, or
  ground-collision systems.
- Add focused wiring/integration tests and real Studio movement verification.
- Update only the current Sprint 26 state and evidence documents.

Forbidden scope:

- Survivor-specific Runtime/engine/manager/renderer/world authority or a new
  gameplay loop.
- Enemy chase, weapons, projectiles, auto-attack, spawn/wave/timer,
  survive-duration, ability/inventory, XP/level expansion, or visual redesign.
- Changes to platformer behavior, legacy reconnection/deletion, provider
  authority, structured-output infrastructure, or unrelated refactoring.

Acceptance criteria:

1. A survival world uses the existing generic four-direction control path and
   no platformer-only jump/gravity/ground systems.
2. A platformer world retains its current jump/gravity/ground behavior.
3. Real Studio verification observes survival Player movement in at least two
   directions, no forced ground clamp/jump affordance, six-entity continuity,
   and clean diagnostics.
4. No Survivor-specific Runtime or Renderer implementation is introduced.

Automated verification: PASS — focused motion-profile, platformer-wiring, and
Studio-shell tests (24 tests), full Web suite (48 files / 3557 tests), Web
TypeScript check, AI/Web lint with no errors (existing warnings only), and Web
production build.

Product Verification: PASS in real Genesis Studio on `localhost:5888`. The
survival request displayed six active entities and only `Arrow Keys / Move`;
Player movement was observed in two directions (`x:80→83`, then `y:300→297`)
with the same Runtime/Inspector session. Reloaded MarioWorld retained seven
entities and `Space / Jump`. Browser warning/error diagnostics were clean.

Non-goal: this WO proves motion composition only; it does not claim enemy
pressure, combat, waves, duration, or the full Sprint 26 thesis.

## Post-WO Gap Analysis — after WO-S26-002

Date: 2026-08-28

Status: **DONE — exactly one next bounded WO generated**

Measured result: the motion-profile blocker is closed. The requested survival
world is top-down and the generic Runtime position path moves the Player in two
directions while platformer controls remain intact.

The next Sprint acceptance blocker is `PRODUCT_GAP — active-world enemy
addition recovery`. In real Studio, each of `再加五只怪`, `再创建5个怪物`, and
`增加5个enemy` reached the active-world evolution path but returned
`Structured world evolution planning failed`; `world-1` remained at six
entities. Source tracing confirms that the browser selects the structured
evolution planner whenever a gateway is configured, while the existing
deterministic evolution provider has no enemy-addition vocabulary and no
provider-error fallback is wired at this boundary.

The existing semantic delta applier, Runtime synchronizer, gameplay
reconciliation, visual evolution planner, and deterministic fallback seams are
reusable. Enemy chase, offense, spawning, waves, timer, and duration remain
deferred.

## WO-S26-003 — Deterministic Active-World Enemy Addition Recovery

Status: **DONE — Code Complete = YES; Product Verified = YES**

Measured bottleneck: the same-world five-enemy acceptance request is rejected
when the structured evolution provider is unavailable, and the deterministic
candidate source does not recognize enemy-addition language.

Architecture: v1.175 → v1.176

Allowed scope:

- Extend the existing deterministic World Evolution candidate vocabulary with
  enemy/怪物/怪 aliases and Chinese/English addition-count forms.
- Reuse the existing deterministic `DefaultWorldEvolutionPlanner` as the
  provider-error/no-primary recovery path in the Web command executor.
- Preserve successful structured AI evolution when available and report the
  selected deterministic source truthfully.
- Add focused planner/store regressions and update current Sprint evidence.

Forbidden scope:

- Enemy chase, weapons, projectiles, auto-attack, combat balancing, spawns,
  waves, timers, progression, Survivor-specific Runtime/engine/manager/
  renderer/world authority, provider protocol changes, or legacy reconnection.

Acceptance criteria:

1. In an active survival world, `再加五只怪` succeeds through the existing
   World Evolution path when the structured provider fails, preserves the same
   `world-1`, and adds five semantic/Runtime enemy entities.
2. Runtime synchronization, gameplay reconciliation, visual planning, and
   actual fallback-source diagnostics remain truthful.
3. Existing structured-AI evolution and platformer evolution regressions stay
   green; explicit new-world creation remains CreateWorld.
4. No Survivor-specific execution or rendering implementation is introduced.

Automated verification: PASS — AI World Evolution Planner suite (15 tests),
Web World Evolution integration suite (19 tests), focused and full Web
regressions (48 files / 3557 tests), AI/Web TypeScript checks, AI/Web lint with
no errors (existing warnings only), and Web production build.

Product Verification: PASS in a clean real Genesis Studio page on
`localhost:5888`. The exact request created `world-1` with six survival
entities; `再加五只怪` preserved `world-1`, added `enemy-1` through `enemy-5`,
produced 11 Runtime/Explorer/Viewport entities, and reported Runtime plus
visual synchronization complete. Observatory showed `deterministic · fallback`
with `provider_failed`; browser warning/error diagnostics were empty.

Non-goal: this WO proves same-world enemy addition/recovery only; it does not
claim enemy movement, combat, waves, duration, or the full Sprint 26 thesis.

## Post-WO Gap Analysis — after WO-S26-003

Date: 2026-08-28

Status: **DONE — no further measured blocker within the authorized Sprint 26
acceptance; SPRINT26_FREEZE_REVIEW selected; no Sprint 27**

Measured result: the bounded Sprint 26 scenario is now reachable end to end:

`帮我生成一个2D幸存者游戏`
→ `survival` semantic world
→ six-entity Game DSL/Runtime/Pixi session
→ generic top-down movement in two axes
→ same-world `再加五只怪`
→ 11-entity Runtime/visual synchronization with the same world ID.

The remaining enemy chase, offense, spawn/wave, timer/survive-duration,
ability/inventory, and progression-expansion ideas are explicitly deferred
non-goals of this bounded proof, not measured blockers requiring another WO.
The Sprint 26 evidence is complete and the only next item is the freeze review:

## SPRINT26_FREEZE_REVIEW

Status: **READY FOR HUMAN/CTO REVIEW**

Recommended decision: freeze Sprint 26 at **v1.176** with Code Complete = YES
and Product Verified = YES for the bounded Second-Genre Generalization Proof.
Do not open Sprint 27 automatically. Preserve `renderWorld.ts`, all frozen
legacy dispositions, and the deterministic/static/primitive recovery paths.
