# Project Genesis — Engineering Invariants

These invariants are the durable boundary for supervised work. They were
checked against the current source wiring, PROJECT_STATE.md, Sprint 16/17/18
backlogs, capability matrices, and ADR-0261 through ADR-0276 on 2026-08-25.
The source code and accepted ADRs remain authoritative if this projection
becomes stale.

## Authority and validation

1. AI/provider output is a candidate, never authority.
2. Genesis validates, normalizes, and derives support status for structured
   output before it can affect shared state.
3. Runtime state and Runtime geometry are authoritative for execution and
   collision; provider claims and image geometry are not.
4. Gameplay rules are structured data. They are not arbitrary generated code,
   scripts, expressions evaluated with eval, or provider-owned executables.
5. A provider cannot claim a Runtime capability is supported. Capability truth
   comes from Genesis-owned catalog and actual Runtime wiring.

## Identity, world mutation, and visuals

6. Entity identity is stable data. It must not be inferred from ID prefixes or
   naming conventions.
7. Image assets are visual skin, not collision or gameplay truth.
8. World Evolution is targeted and revision-guarded. It must preserve unaffected
   identity and must not silently replace the whole world to simulate a delta.
9. A semantic change must not silently rebind stale gameplay rules to changed
   entities; stale or unsupported bindings remain explicit.

## Dependency boundaries

10. Runtime stays independent of Vue, Pinia, PixiJS, renderer implementation
    details, AI providers, and natural-language parsing.
11. Renderer consumes Runtime projections and does not interpret natural
    language or own gameplay authority.
12. AI/provider layers do not import renderer implementation details.
13. There is no genre-specific foundational Runtime such as MarioRuntime.
    Generic Runtime primitives are extended only for a measured, trusted
    capability.
14. Do not add duplicate transformation layers or speculative Manager,
    Factory, Hydrator, registry, orchestration service, database, queue, or
    Context Store when an existing boundary is sufficient.

## Truthful product surfaces

15. Observatory shows real data or a truthful empty/unavailable state. It must
    not synthesize execution facts for deferred capabilities.
16. Raw Runtime facts, gameplay rule results, world-evolution facts, and
    renderer outcomes remain distinct observable surfaces.
17. Product Verified means real user-path evidence when the work item requires
    it. Passing unit tests alone is not Product Verified.
18. Existing unrelated baseline environment failures are recorded and do not
    automatically block a focused work item; new failures and failures in the
    affected path do block completion.
19. Current-session goal completion and lethal failure are Runtime-owned
    `RuntimeGameplaySessionState`; Goal and damage rules may trigger them, but
    Web/Pinia/Renderer/Observatory are projections and must not author or
    reset the state. World/session replacement rebinds the state;
    non-replacing semantic evolution does not. Same-world recovery is only the
    explicit Runtime respawn operation.
20. Numeric progression is Runtime-owned immutable keyed finite state. A
    supported `CHANGE_NUMERIC_STATE` rule may commit only finite additive
    deltas through the existing execution seam; the lifecycle baseline is
    `experience=0, level=1`, and a supported typed numeric threshold may commit
    the bounded Level 1 → Level 2 transition exactly once. Semantic revision
    changes in the same Runtime/session retain it, while world/session
    replacement resets it. Web/Pinia/Renderer/Observatory may project it but
    cannot author it.
21. A structurally valid provider `platformer` candidate must pass the bounded
    current mechanically-complete baseline before acceptance. An incomplete
    candidate is rejected into the existing deterministic baseline; no
    candidate merge or provider regeneration is authoritative.
22. A trusted player `DAMAGE_ENTITY` action that reaches Health `0` commits
    Runtime session `failed`; failed sessions do not execute further gameplay
    rules until the explicit same-world Runtime respawn restores Health to its
    existing maximum and safe velocity. Respawn preserves the current entity
    set, progression, semantic revision, and World Evolution continuity.
23. Asset render usage is provider-neutral structured metadata carried through
    the existing requirement → generation request/context → manifest seams.
    It may constrain prompt/composition intent, but it never authorizes Runtime
    geometry, collision, or image-pixel inference. Bounded current usages must
    not silently become a universal visual taxonomy.
24. The Renderer may consume bounded asset usage to select a visual projection,
    but Runtime-projected position and existing bounds remain authoritative.
    Legacy manifests without usage retain deterministic kind/target fallbacks;
    Renderer selection must not create gameplay geometry.

## Evidence anchors

- Current product state: docs/project/PROJECT_STATE.md
- Current gameplay boundary: docs/project/GAMEPLAY_CAPABILITY_MATRIX.md
- Current AI boundary: docs/project/AI_GENERATION_CAPABILITY_MATRIX.md
- Current visual boundary: docs/project/VISUAL_CAPABILITY_MATRIX.md
- World-evolution authority: docs/adr/ADR-0256-world-evolution-semantic-delta-operation-history.md,
  docs/adr/ADR-0257-world-evolution-semantic-delta-application.md, and
  docs/adr/ADR-0258-world-evolution-targeted-runtime-synchronization.md
- Capability-specific context: docs/adr/ADR-0261-capability-specific-generation-context-foundation.md
- Gameplay specification/events/rules/execution:
  docs/adr/ADR-0262-gameplay-specification-game-loop-foundation.md through
  docs/adr/ADR-0272-default-platformer-collectible-composition.md,
  docs/adr/ADR-0273-platformer-provider-candidate-completeness-gate.md, and
  docs/adr/ADR-0274-runtime-gameplay-failure-and-respawn.md,
  docs/adr/ADR-0275-bounded-platformer-asset-render-usage.md, and
  docs/adr/ADR-0276-consume-bounded-platform-usage.md
