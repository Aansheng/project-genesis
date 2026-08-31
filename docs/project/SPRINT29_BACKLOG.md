# Sprint 29 — Generic Offensive Interaction

**Authorization:** Human/CTO decision, 2026-08-28  
**Architecture at authorization:** v1.178  
**Status:** FROZEN — WO-S29-001 DONE; Code Complete = YES; Product Verified =
YES; `SPRINT29_FREEZE_REVIEW` accepted

## Product goal

Give generated Survival a minimal truthful Player-offense loop through generic
Gameplay Rule and Runtime capabilities:

`Player → offensive interaction → Enemy Health decreases → Enemy defeated →
continued gameplay / progression`

No Survival-specific weapon engine, inventory, projectile framework, attack
animation framework, equipment system, ability framework, wave manager, or
spawn director is authorized.

## Production-path Gap Analysis

The inspected chain is:

`Studio command → gameStore → CreateWorld pipeline → Semantic World → Gameplay
Specification / RuleSet → Game DSL → Runtime projection → Studio-selected
Runtime systems → contact event → GameplayRuleExecutor → immutable World /
progression mutation → Renderer / Observatory`

| Question | Repository truth |
| --- | --- |
| 1. Do Enemy entities have Health? | **YES.** Generic semantic-to-DSL composition gives `player`, `enemy`, and `npc` Health; initial and evolved Survival enemies receive it. |
| 2. Is `DAMAGE_ENTITY` applicable to Enemy targets? | **YES.** It resolves any current entity selector with valid Health; only lethal Player damage has the additional failed-session effect. |
| 3. Can current rules express Player-originated damage → Enemy? | **YES.** `ENTITY_CONTACT_STARTED` identifies Player as actor and Enemy as target; a supported rule can apply `DAMAGE_ENTITY(eventTarget)`. |
| 4. Is there generic removal / defeat? | **PARTIAL BUT SUFFICIENT.** `REMOVE_ENTITY` is supported and immutable. Health zero alone does not remove; a following typed Health condition can trigger removal. |
| 5. Can defeat trigger XP? | **YES.** One atomic rule can stage `REMOVE_ENTITY` and `CHANGE_NUMERIC_STATE experience +1`; failure rolls the rule back. |
| 6. Does progression support XP from defeated entities? | **Primitive YES, production composition NO before this WO.** Runtime owns `experience=0, level=1`, finite additive XP, numeric thresholds, and Level 1→2; no Survival defeat rule fed it. |
| 7. Is there a cooldown/timed-rule primitive? | **NO.** The Runtime has deterministic ticks and the Renderer has RAF scheduling, but the Gameplay event/rule vocabulary exposes no timer, elapsed-time, cooldown, or periodic trigger. |
| 8. Is there generic proximity/range? | **NO.** Position exists, but rule conditions provide no distance/radius or nearest-entity selector. |
| 9. Is projectile/entity spawn production-reachable? | **NO for gameplay execution.** `SPAWN_ENTITY` is typed but deferred and rejected by the Runtime action executor. World Evolution entity addition is production-reachable but is not a frame combat projectile/spawn path. |
| 10. First smallest missing capability? | **Survival production RuleSet composition using existing supported primitives.** No new Runtime primitive is required for a first contact-driven offense. |

## Selected work order

### WO-S29-001 — Generic Contact Offense Rule Composition

**Status:** DONE — Code Complete = YES; Product Verified = YES  
**Architecture before:** v1.178  
**Expected architecture after:** v1.179

**Measured bottleneck:** Health, damage, removal, numeric progression, contact
identity, atomic rule execution, pursuit, and rendering are already
production-reachable. Generated Survival does not compose a Player-originated
offense rule or connect Enemy Health zero to removal and existing progression.

**Allowed scope:**

- truthfully promote one generic `contact-offense` mechanic in the Genesis
  capability catalog;
- deterministic Survival rule composition using the existing contact event,
  Player/Enemy categories, Health, `DAMAGE_ENTITY`, `REMOVE_ENTITY`, and
  `CHANGE_NUMERIC_STATE`;
- a bounded 25-damage contact action so repeated distinct contacts are required;
- remove the defeated Enemy and grant one XP atomically at Health zero;
- reuse the existing first XP threshold / Level transition;
- production-reachability and Platformer non-regression tests;
- ADR and control-plane updates.

**Forbidden scope:** weapons, projectiles, inventory, equipment, attack input,
cooldowns, timers, proximity/radius selection, nearest-target framework,
spawning/waves, VFX, damage numbers, death animation, Survivor-specific
Runtime/manager/renderer, or Platformer behavior changes.

**Acceptance:**

- generated Survival composes supported contact-offense, defeat, XP, level,
  and existing Enemy-contact threat rules;
- a new Player/Enemy contact changes Enemy Health `100 → 75`;
- four distinct valid contacts can reach Health zero, remove that Enemy, grant
  `experience +1`, and execute the existing Level 1→2 threshold;
- the session remains active and remaining enemies continue their existing
  pursuit/contact behavior;
- same-world added Enemy entities remain category-compatible with the same
  rules without rebuilding the world;
- Platformer rule/system composition is unchanged;
- real Studio behavior and diagnostics are verified before Product Verified is
  marked YES.

**Automated verification:** AI specification/rule/create-world tests, a Web
production-chain regression traversing the real generated RuleSet and Studio
Runtime system composition, affected package suites, TypeScript, ESLint, Web
build, and `git diff --check`.

**Product verification:** generate `生成一个幸存者游戏`, observe Enemy Health
decrease on distinct contacts, defeat/removal and XP/Level where visible,
confirm continued pursuit, then add five enemies in the same world and confirm
they remain valid contact-offense targets with clean diagnostics.

## WO-S29-001 Execution and Verification

The accepted implementation adds no Runtime system or combat manager. The
Shared capability catalog truthfully promotes `contact-offense`; the AI
deterministic Survival specification composes contact offense, existing contact
threat, XP, and Level semantics; and the RuleSet orders damage before explicit
defeat/removal and progression.

Automated production reachability traversed the real generated Survival
pipeline, Studio Runtime system registration, `EntityContactSystem`, and
`DefaultGameplayRuleExecutor`. Four distinct contacts produced Enemy Health
`100 → 75 → 50 → 25 → 0`, removed the Enemy, committed `experience=1` and
`level=2`, and kept the gameplay session `active`.

Real provider-backed Studio verification created `world-1` with five entities.
The initial `infected` Enemy exposed Health `75/100` after a real contact plus
`target-directed-movement(target=survivor, speed=1.5)`. `再加五只怪` preserved
`world-1`, changed 5 entities to 10, and added exactly `entity-1` through
`entity-5`. All five exposed generic Health, pursuit, collision, and each had
Health `75/100` after its real Player contact, proving the category-based
offense applies to evolved enemies. Runtime remained active with XP 0 / Level
1 because none of the browser-observed enemies had yet reached zero. Browser
warning/error diagnostics were empty.

The browser automation surface cannot reliably hold a direction key long
enough to force four separate disengage/re-contact cycles against pursuit. The
full repeated defeat/XP/Level chain is therefore classified `AUTO VERIFIED`
through the production-composition regression, while real Studio verifies the
provider path, first damage, ongoing pursuit, same-world +5 compatibility, and
clean diagnostics. This is an automated input limitation, not a Runtime or
product blocker.

Full checks passed: Shared 211, AI 9430, Runtime 705, and Web 3564 tests;
Shared/AI/Web TypeScript; ESLint with zero errors; Web production build; and
`git diff --check`. The Web typecheck initially exposed a pre-existing missing
discriminant guard in the same-world visual-reuse test; the test now explicitly
requires `evolutionPlan.status === 'validated'` before reading `visualPlan`.

## Fresh Sprint 29 Gap Analysis

The bounded Sprint thesis passes:

`Player movement/contact → Enemy Health loss → repeated valid contacts →
explicit Enemy removal → XP/Level progression → continued active Survival`

The mechanic is intentionally modest but genuine and production-reachable.
No immediate blocker requires timed/ranged attacks, nearest-target selection,
projectiles, spawning/waves, animation, inventory, or an ability framework.
Those remain future measured capabilities.

**Conclusion:** `SPRINT29_FREEZE_REVIEW` accepted by Human/CTO. Sprint 30 is
separately authorized; this backlog remains the historical Sprint 29 record.

## Explicit deferred gaps

The lack of timed triggers, range/proximity conditions, nearest-target
selection, projectile execution, and spawn/wave execution is recorded but does
not block this first contact-driven offense. Do not implement those capabilities
without a post-WO measured blocker.
