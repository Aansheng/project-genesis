# Genesis Supervisor — Human Decision Log

This log records decisions and gates that require human control. It is not a
replacement for ADRs or PROJECT_STATE.md.

## Open decisions

| Date | Decision | Status | Owner | Consequence |
| --- | --- | --- | --- | --- |
| 2026-09-04 | Freeze Sprint 40 at v1.190 after WO-S40-001 completion and fresh Gap Analysis PASS. | ACCEPTED — FREEZE SPRINT 40 | Human / CTO | WO-S40-001 is DONE with Code Complete = YES and Product Verified = YES. The v1.190 Git checkpoint is 04c3090; the local root Turbo Keychain/TLS failure does not block the freeze. |
| 2026-09-04 | Authorize Sprint 41 — World Evolution Gameplay Capability Continuity Discovery. | ACCEPTED — ENTER SPRINT 41 DISCOVERY ONLY | Human / CTO | Use real Studio Farm/RPG evolution and the Survival control, select exactly one blocker, and generate exactly one READY WO. Do not modify product code, execute the WO, extend Sprint 40, or enter Sprint 42. |
| 2026-09-04 | Record the Sprint 41 discovery disposition and stop at the first measured divergence. | ACCEPTED — DISCOVERY COMPLETE / STOP | Human / CTO | Exact Farm-field and RPG-quest mutations failed at structured planning in the local provider environment; the single Product blocker is missing validated archetype-native delta coverage. WO-S41-001 is READY and not executed; Sprint 42 is not entered. |
| 2026-08-21 | Select the concrete S15-005 gameplay scenario from a measured Studio bottleneck and approve its acceptance boundary. | ACCEPTED | Human / CTO | ENEMY STOMP is the primary scenario; WO-S15-005 may enter IN_PROGRESS with its bounded generic Runtime contract. |
| 2026-08-21 | Keep initial Supervisor continuation at ONE_WORK_ITEM. | ACCEPTED | Human / CTO | Supervisor stops after one verified work item. |
| 2026-08-24 | Select the WO-S15-006 gameplay scenario and acceptance boundary for the next product trial. | ACCEPTED | Human / CTO | DAMAGE / HEALTH is the primary scenario; WO-S15-006 is prepared READY but is not executed by WO-META-004. |
| 2026-08-24 | Choose the authoritative owner and lifecycle contract for Sprint 15 goal/session completion before executing WO-S15-007. | ACCEPTED | Human / CTO | RuntimeGameplaySessionState is the sole current-session completion authority; WO-S15-007 is unblocked and may execute within the accepted minimum slice. |
| 2026-08-24 | Proceed with the Sprint 15 Freeze Review against the Sprint-level Gameplay Mechanics Foundation thesis. | ACCEPTED | Human / CTO | Evaluate the Sprint thesis and bounded acceptance criteria; do not require deferred future mechanics; if satisfied, freeze Sprint 15 and stop before Sprint 16. |
| 2026-08-24 | Choose targeted Gameplay Rule Reconciliation for Sprint 16 Gameplay-Preserving World Evolution. | ACCEPTED | Human / CTO | Unblock `SPRINT16_DISCOVERY`, generate `WO-S16-001` as the first bounded Sprint 16 product WO, and do not execute it during this decision-resolution step. |
| 2026-08-24 | Promote the engineering continuation mode to `SPRINT_CONTINUOUS`. | ACCEPTED | Human / CTO | Permit sequential execution of accepted WOs within the current Sprint while retaining max concurrency 2, repair budget 3, human escalation, one-next-WO generation, Sprint-boundary stop, and no automatic cross-Sprint execution. |
| 2026-08-24 | Decide whether Sprint 16 is satisfied by WO-S16-001 and should freeze at v1.155. | ACCEPTED — CONTINUE | Human / CTO | WO-S16-001 closes Part 1 only. Sprint 16 remains open and NOT READY FOR FREEZE; Part 2 requires the first generic progression loop. Exactly one next bounded WO is authorized: `WO-S16-002 — First Generic Progression Loop: Authoritative Numeric State`. |
| 2026-08-24 | Decide whether Sprint 16's corrected Gameplay Evolution & Progression Foundation goal is satisfied and should freeze at v1.156. | ACCEPTED — CONTINUE | Human / CTO | WO-S16-002 proves numeric progression storage but not a progression transition. Sprint 16 remains NOT READY FOR FREEZE; exactly one bounded `WO-S16-003 — Deterministic XP Threshold Level Transition` is authorized and auto-executing under `SPRINT_CONTINUOUS`. No Sprint 17 auto-crossing. |
| 2026-08-24 | Decide whether Sprint 16 is satisfied and should freeze at v1.157 after WO-S16-003. | ACCEPTED — FREEZE | Human / CTO | All eight corrected Sprint 16 criteria pass. Sprint 16 is Code Complete = YES, Product Verified = YES, and FROZEN = YES at v1.157; no Sprint 17 auto-crossing. |
| 2026-08-24 | Approve the Sprint 17 high-level product objective before detailed discovery. | ACCEPTED — ENTER SPRINT 17 | Human / CTO | `Mechanically Complete Platformer Generation` is approved. Run fresh product-level Next-Work Discovery, generate exactly one bounded READY/BLOCKED WO, execute only the smallest measured bottleneck under `SPRINT_CONTINUOUS`, and stop at human/escalation/freeze gates; do not auto-enter Sprint 18. |
| 2026-08-24 | Decide whether a structurally valid provider platformer candidate must meet the deterministic mechanically complete baseline floor, with under-complete candidates failing closed into the existing fallback. | ACCEPTED — EXECUTE | Human / CTO | Approved WO-S17-002: structurally valid but baseline-incomplete platformer candidates are rejected as product-incomplete and use the existing deterministic baseline; complete candidates are accepted; provider failures retain safe fallback and distinct diagnostics. |
| 2026-08-25 | Decide whether Sprint 17 should freeze after WO-S17-003 proved the successful platformer lifecycle. | ACCEPTED — CONTINUE | Human / CTO | Success is Product Verified, but lethal damage/failure/recovery is not. Generate exactly one smallest bounded item: `WO-S17-004 — Runtime-Authoritative Lethal Failure and Same-Session Respawn`; continue automatically under `SPRINT_CONTINUOUS`; do not enter Sprint 18. |
| 2026-08-28 | Freeze Sprint 25 after the production reachability and legacy disposition audit. | ACCEPTED — FREEZE | Human / CTO | Sprint 25 is FROZEN at v1.173. WO-S25-001 is audit-complete; no legacy reconnection or deletion is authorized by the freeze. |
| 2026-08-28 | Authorize Sprint 26 — Second-Genre Generalization Proof using a bounded Survivor-like probe. | ACCEPTED — ENTER SPRINT 26 | Human / CTO | Run fresh production-path Gap Analysis, generate exactly one smallest measured WO at a time, preserve generic Runtime boundaries, and do not enter Sprint 27 automatically. |
| 2026-08-28 | Freeze Sprint 27 at v1.177 after Human/CTO Product Verification and authorize Sprint 28 — Survival Gameplay Pressure. | ACCEPTED — FREEZE SPRINT 27 / ENTER SPRINT 28 | Human / CTO | `WO-S27-001` is Code Complete = YES, Product Verified = YES, and DONE. The automated Space observation is an input/observation limitation, not a Platformer regression. Sprint 28 may generate exactly one bounded first WO: `WO-S28-001 — Generic Runtime Target-Directed Enemy Pursuit`; do not enter Sprint 29 automatically. |
| 2026-08-28 | Freeze Sprint 28 at v1.178 and authorize Sprint 29 — Generic Offensive Interaction. | ACCEPTED — FREEZE SPRINT 28 / ENTER SPRINT 29 | Human / CTO | WO-S28-001 is DONE and Product Verified. Sprint 29 starts with repository-grounded Gap Analysis, exactly one smallest bounded WO, production reachability, real Studio verification, and no weapons/projectiles/spawn/wave framework. |
| 2026-08-28 | Freeze Sprint 29 at v1.179 and authorize Sprint 30 — Sustained Survival Loop. | ACCEPTED — FREEZE SPRINT 29 / ENTER SPRINT 30 | Human / CTO | WO-S29-001 is DONE with Code Complete = YES and Product Verified = YES. Sprint 30 runs one fresh ten-question Gap Analysis, exactly one bounded WO, production reachability, real Studio verification, fresh Gap Analysis, and stops at `SPRINT30_FREEZE_REVIEW`; no Sprint 31 auto-entry. |
| 2026-08-31 | Freeze Sprint 31 at v1.181 and authorize Sprint 32 — Survival Playability Gap Product Gap Discovery. | ACCEPTED — FREEZE SPRINT 31 / ENTER SPRINT 32 DISCOVERY | Human / CTO | WO-S31-001 and WO-S31-002 are DONE with Code Complete = YES and Product Verified = YES. Run a real Survival playability discovery, select only the first largest measured user-visible blocker, generate exactly one READY WO (`WO-S32-001`), stop before implementation, and do not enter Sprint 33. |
| 2026-09-01 | Execute `WO-S32-001` — Generic Player-Directed Short-Range Offense. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded generic top-down `Space` attack slice, complete real Studio Product Verification and a fresh Sprint 32 Gap Analysis, then stop at `SPRINT32_FREEZE_REVIEW`; do not enter Sprint 33. |
| 2026-09-01 | Freeze Sprint 32 at v1.182 and authorize Sprint 33 — Survival Playability Gap Discovery. | ACCEPTED — FREEZE SPRINT 32 / ENTER SPRINT 33 DISCOVERY | Human / CTO | `WO-S32-001` is DONE with Code Complete = YES and Product Verified = YES; the fresh Sprint 32 Gap Analysis is PASS. Run normal-play discovery, generate exactly one `READY` WO (`WO-S33-001`), do not execute it in this continuation, and do not enter Sprint 34. |
| 2026-09-01 | Execute `WO-S33-001` — Generic Runtime Gameplay Outcome Feedback. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded committed Runtime-result → Game presentation projection, complete real Studio Product Verification and a fresh Sprint 33 Gap Analysis, then stop at `SPRINT33_FREEZE_REVIEW`; do not enter Sprint 34. |
| 2026-09-01 | Freeze Sprint 33 at v1.183 and authorize Sprint 34 — Survival Playability Gap Discovery. | ACCEPTED — FREEZE SPRINT 33 / ENTER SPRINT 34 DISCOVERY | Human / CTO | `WO-S33-001` is DONE with Code Complete = YES, Product Verified = YES, and the fresh Sprint 33 Gap Analysis is PASS. Play the real Survival product, select exactly one blocker, generate exactly one READY WO, do not implement it, and do not enter Sprint 35. |
| 2026-09-01 | Execute `WO-S34-001` — Generic Runtime Replacement Fair-Start Policy. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded spatial Runtime fair-start policy, preserve current Runtime/Renderer authority and cross-genre behavior, complete real Studio Product Verification and a fresh Sprint 34 Gap Analysis, then stop at `SPRINT34_FREEZE_REVIEW`; do not enter Sprint 35. |
| 2026-09-01 | Freeze Sprint 34 at v1.184 and authorize Sprint 35 — Progression Meaning Discovery. | ACCEPTED — FREEZE SPRINT 34 / ENTER SPRINT 35 DISCOVERY | Human / CTO | `WO-S34-001` is DONE with Code Complete = YES and Product Verified = YES; the fresh Sprint 34 Gap Analysis is PASS. Audit XP/Level authority and real Survival behavior, rank candidate consequences, generate exactly one READY WO, do not execute it, and do not enter Sprint 36. |
| 2026-09-01 | Execute `WO-S35-001` — Generic Progression-Conditioned Gameplay Capability. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded Level-conditioned Survival offense composition: Level 1 damage 25, Level 2+ damage 50, using existing generic `NUMBER_COMPARE` and `DAMAGE_ENTITY` semantics. Complete real Studio Product Verification and a fresh Sprint 35 Gap Analysis, then stop at `SPRINT35_FREEZE_REVIEW`; do not add scaling, a modifier framework, or enter Sprint 36. |
| 2026-09-01 | Freeze Sprint 35 at v1.185 and authorize Sprint 36 — Active-World New-World Intent Correctness Discovery. | ACCEPTED — FREEZE SPRINT 35 / ENTER SPRINT 36 DISCOVERY | Human / CTO | `WO-S35-001` is DONE with Code Complete = YES and Product Verified = YES; the fresh Sprint 35 Gap Analysis is PASS. Audit the real active-world Intent path, generate exactly one READY WO, do not modify routing during discovery, and do not enter Sprint 37. |
| 2026-09-01 | Execute `WO-S36-001` — Generic Active-World New-World Intent Classification. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded generic Intent/Web front-door classification. Preserve current-world mutations, explicit-new behavior, AI candidate validation, and the existing CreateWorld replacement contract; complete real Studio Product Verification and a fresh Sprint 36 Gap Analysis, then stop at `SPRINT36_FREEZE_REVIEW`; do not add a genre registry, second router, broad ambiguity/NLU expansion, or enter Sprint 37. |
| 2026-09-02 | Freeze Sprint 36 at v1.186 and authorize Sprint 37 — CreateWorld Semantic Fidelity Discovery. | ACCEPTED — FREEZE SPRINT 36 / ENTER SPRINT 37 DISCOVERY | Human / CTO | `WO-S36-001` is DONE with Code Complete = YES and Product Verified = YES; the fresh Sprint 36 Gap Analysis is PASS. Trace semantic interpretation after CreateWorld, generate exactly one READY WO, do not execute it in this continuation, and do not enter Sprint 38. |
| 2026-09-02 | Execute `WO-S37-001` — Generic CreateWorld Supported-Archetype Intent Preservation. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded existing typed supported-archetype extraction change. Preserve CreateWorld routing, current-world mutation precedence, provider candidate validation, deterministic fallback, Farm template/DSL, Runtime/Renderer authority, and Sandbox for unknown input; complete real Studio Product Verification and a fresh Sprint 37 Gap Analysis, then stop at `SPRINT37_FREEZE_REVIEW`; do not add Farm mechanics, a classifier framework, a provider architecture, or enter Sprint 38. |
| 2026-09-02 | Freeze Sprint 37 at v1.187 and authorize Sprint 38 — Cross-Genre Playability Fidelity Discovery. | ACCEPTED — FREEZE SPRINT 37 / ENTER SPRINT 38 DISCOVERY | Human / CTO | `WO-S37-001` is DONE with Code Complete = YES and Product Verified = YES; the fresh Sprint 37 Gap Analysis is PASS. Play the real Platformer, Survival, Farm, and RPG Studio paths, select exactly one highest-priority blocker, generate exactly one READY WO, do not implement it in this continuation, and do not enter Sprint 39. |
| 2026-09-02 | Execute `WO-S38-001` — Generic Player-Directed Entity Interaction Reachability. | ACCEPTED — EXECUTE | Human / CTO | Execute only the bounded generic Player interaction path. Preserve Platformer `Space` Jump, Survival `Space` Attack, Runtime/Renderer authority, provider candidate-only behavior, and existing Farm/RPG compositions; complete real Studio Product Verification and a fresh Sprint 38 Gap Analysis, then stop at `SPRINT38_FREEZE_REVIEW`; do not add genre systems, a universal ontology, a second input authority, a legacy reconnection, or enter Sprint 39. |
| 2026-09-02 | Close `WO-S38-001` after Human/CTO clarification of the real Farm/RPG Product Verification evidence. | ACCEPTED — PRODUCT VERIFIED / CLOSE | Human / CTO | Farm and RPG both prove the generic normal-play interaction path. The Provider-accepted Farm 5-vs-8 composition variance is a separate observation, not a WO blocker; preserve the deterministic 8-entity regression, mark Code Complete/Product Verified/DONE, record a fresh Sprint 38 Gap Analysis PASS, select `SPRINT38_FREEZE_REVIEW`, and do not enter Sprint 39 or fix Provider composition in this WO. |
| 2026-09-02 | Freeze Sprint 38 at v1.188 and authorize Sprint 39 — Cross-Genre Interaction Meaning Discovery. | ACCEPTED — FREEZE SPRINT 38 / ENTER SPRINT 39 DISCOVERY | Human / CTO | `WO-S38-001` is FROZEN with Code Complete = YES, Product Verified = YES, and fresh Gap Analysis PASS. Run real Farm/RPG interaction-meaning discovery, select exactly one highest-priority blocker, generate exactly one READY WO, do not execute it in this continuation, and do not enter Sprint 40. |
| 2026-09-03 | Execute `WO-S39-001` — Generic Archetype Interaction Consequence (first bounded slice). | ACCEPTED — EXECUTE | Human / CTO | Execute only this Sprint 39 WO. Reuse the existing generic Enter → finite-range target → `ENTITY_INTERACTION_REQUESTED` → GameplayRule → Runtime-authoritative mutation path; preserve no-target/repeat truth, Platformer `Space` Jump, Survival `Space` Attack, Provider candidate-only behavior, and all forbidden-scope boundaries. Complete real Farm/RPG Studio Product Verification and a fresh Sprint 39 Gap Analysis, then stop at `SPRINT39_FREEZE_REVIEW`; do not enter Sprint 40. |
| 2026-09-03 | Freeze Sprint 39 at v1.189 and authorize Sprint 40 — Cross-Genre Gameplay Loop Continuity Discovery. | ACCEPTED — FREEZE SPRINT 39 / ENTER SPRINT 40 DISCOVERY | Human / CTO | `WO-S39-001` is DONE with Code Complete = YES, Product Verified = YES, and fresh Gap Analysis PASS. Perform discovery only in real Studio, select exactly one shared blocker, generate exactly one READY WO, do not modify product code, do not execute a new WO, and do not enter Sprint 41. |
| 2026-09-03 | Execute `WO-S40-001` — Generic Post-Interaction Gameplay Loop Continuity (first bounded slice). | ACCEPTED — EXECUTE | Human / CTO | Execute only the authorized generic continuation slice. Prove ordered Farm/RPG two-step gameplay in real Studio, complete a fresh Sprint 40 Gap Analysis, mark the WO DONE with Code Complete/Product Verified, select `SPRINT40_FREEZE_REVIEW` if PASS, and do not enter Sprint 41. |

## Sprint 39 discovery result and READY work order

Date: 2026-09-02

Result: **DISCOVERY COMPLETE — exactly one READY WO; no implementation
executed; v1.188 remains current**

Real Studio front-door sessions for 做一个农场游戏 and 创建一个 RPG confirmed
the Sprint 38 interaction path. The accepted in-range proofs show that both
archetypes currently stop at the generic gameplay-state.activated=true
mutation; no Farm field/resource consequence or RPG quest/NPC/progression
consequence follows. Two Provider-accepted Farm candidates contained 5
entities versus the deterministic 8-entity baseline; the candidates retained
an npc, so the variance remains a separate observation. Farm/RPG also inherit
Space — Jump from the platformer-style Studio composition, but that is not
the selected blocker.

The single selected blocker is **SUPPORTED ARCHETYPE INTERACTIONS LACK
MECHANICALLY MEANINGFUL CONSEQUENCES**. Exactly one READY item was generated:
`WO-S39-001 — Generic Archetype Interaction Consequence (first bounded slice)`.
It must audit the existing trusted action/state seam and is not executed in
this continuation. Full evidence is in
`docs/project/SPRINT39_PRODUCT_GAP_DISCOVERY.md`; the one-item backlog is in
`docs/project/SPRINT39_BACKLOG.md`. The next gate is
`SPRINT39_FREEZE_REVIEW`; Sprint 40 is not entered.

## WO-S39-001 execution result

Date: 2026-09-03

Result: **DONE — Code Complete = YES; Product Verified = YES; fresh Sprint 39
Gap Analysis = PASS; v1.189**

The authorized item reused the existing typed `SET_ENTITY_PROPERTY` seam.
Farm now targets eligible field-like `terrain` and commits
`activated=true, harvested=true`; RPG retains `quest` targeting and commits
`activated=true, questAccepted=true`. The Game surface derives labeled
feedback from committed Runtime mutations. Real Studio Farm and RPG input
edges, Full Observatory, Runtime entity inspection, full package quality
gates, Web build, and empty browser diagnostics passed. Repeated RPG Enter
produced truthful `no_op` actions. The Provider-accepted Farm PV candidate
contained 5 entities; deterministic Farm/RPG baselines remain covered and the
variance is separate from this WO.

Fresh Gap Analysis is recorded in `docs/project/SPRINT39_GAP_ANALYSIS.md`.
Human/CTO accepted `SPRINT39_FREEZE_REVIEW` on 2026-09-03, freezing Sprint 39
at v1.189. Sprint 40 discovery is recorded below; the product remains at
v1.189 because discovery does not modify product code.

## Sprint 40 discovery result and READY work order

Date: 2026-09-03

Result: **DISCOVERY COMPLETE — exactly one READY WO; no product code modified;
no WO executed; v1.189 remains current; Sprint 41 not entered**

Real Studio Farm `做一个农场游戏` used the deterministic 8-entity baseline.
Harvest committed `activated=true, harvested=true` through the sole supported
`farm-interaction` Rule. Real Studio RPG `创建一个 RPG` used the 9-entity
deterministic fallback. Quest Accept committed
`activated=true, questAccepted=true` through the sole supported
`rpg-interaction` Rule. Full Observatory showed one Rule and two property
actions in each case; Runtime remained at XP 0 / Level 1. No downstream Rule,
target, objective, numeric state, goal completion, or Player-readable next
action followed. The RPG `main-quest` and additional Farm content are
potential targets, not defined continuation stages.

The generic audit covered GameplayRule conditions, entity properties, numeric
state, `NUMBER_COMPARE`, gameplay events, `SET_ENTITY_PROPERTY`,
`REMOVE_ENTITY`, `SPAWN_ENTITY`, XP/Level, and goal/completion semantics. The
single selected blocker is **SUPPORTED ARCHETYPE INTERACTIONS DO NOT CONTINUE
INTO A BOUNDED MULTI-STEP GAMEPLAY LOOP**. Provider Farm composition variance,
inherited spatial/control composition, and next-state readability were
recorded as secondary observations.

Exactly one READY work order was generated:
`WO-S40-001 — Generic Post-Interaction Gameplay Loop Continuity (first bounded
slice)`. It is awaiting separate Human/CTO execution authorization. Evidence
and the one-item backlog are recorded in
`docs/project/SPRINT40_PRODUCT_GAP_DISCOVERY.md` and
`docs/project/SPRINT40_BACKLOG.md`. At that discovery boundary, the next
gate was `SPRINT40_DISCOVERY_REVIEW`; the later execution result is recorded
above. Sprint 41 was not entered.

## WO-S40-001 execution result

Date: 2026-09-03

Result: **DONE — Code Complete = YES; Product Verified = YES; fresh Sprint 40
Gap Analysis = PASS; v1.190**

The authorized item reused the existing generic GameplayRule execution path.
`BOOLEAN_EQUALS` now reads a typed boolean from the current Runtime entity
state, fails closed for unsupported or unavailable references, and permits
later interactions to be gated by an earlier committed consequence. Farm
commits `wheat-field.gameplay-state.harvested=true` on the first interaction,
then commits `harvest-quest.gameplay-state.questCompleted=true` only after that
state exists. RPG commits `quest-giver.gameplay-state.questAccepted=true`, then
commits `main-quest.gameplay-state.questCompleted=true`. The mutation remains
generic and idempotent; no Farm/RPG Runtime or progression framework was
introduced.

Real Studio chronology, Full Observatory, Runtime entity inspection, package
tests, TypeScript, ESLint, the direct Web build, and browser diagnostics passed.
The root Turbo orchestration was unavailable in this environment because its
API client could not initialize TLS without a Keychain; equivalent package
gates and the affected Web build passed. Provider composition variance,
spatial/control composition, and standalone readability remain recorded
follow-up observations, not additional WOs.

Fresh Gap Analysis is recorded in `docs/project/SPRINT40_GAP_ANALYSIS.md`.
At that historical point the gate was `SPRINT40_FREEZE_REVIEW`; Human/CTO
subsequently froze Sprint 40 at v1.190 and authorized Sprint 41 discovery.

## WO-S38-001 execution decision and result

Date: 2026-09-02

Result: **DONE — Code Complete = YES; Product Verified = YES; fresh Sprint 38
Gap Analysis = PASS; v1.188**

The authorized work order adds one generic Runtime interaction path. Farm
selects one nearby `npc`; RPG selects one nearby `quest`; both use the same
`Enter` request, finite range `48`, nearest/stable-ID targeting,
`ENTITY_INTERACTION_REQUESTED`, trusted `SET_ENTITY_PROPERTY`, immutable
Runtime state, and committed Renderer feedback. Real Studio normal play
confirmed Farm `player-farmer → npc-merchant` at distance `31` and RPG
`player → quest-giver` at approximately `36.67`; both committed the expected
authoritative activation and repeated Enter was a truthful `no_op`. The
normal production CreateWorld → Runtime regression passes for both archetypes,
as do all full package suites, package TypeScript/ESLint checks, the Web build,
and browser UI/Observatory checks with empty diagnostics.

The Provider-accepted Farm verification world contained 5 entities rather than
the historical deterministic 8-entity Farm baseline. The deterministic
8-entity path remains covered by regression, and this variance is classified
as Provider candidate semantic composition completeness variance, not an
interaction-reachability failure or a blocker for this WO. No Provider
composition fix, fallback forcing, candidate-acceptance weakening, Farm
template change, or retry was introduced.

The fresh Gap Analysis is PASS and recorded in
`docs/project/SPRINT38_GAP_ANALYSIS.md`. The next control-plane gate is
`SPRINT38_FREEZE_REVIEW`; Sprint 39 is not entered.

## Sprint 36 freeze and Sprint 37 semantic-fidelity discovery decision

Date: 2026-09-02

Result: **ACCEPTED — Sprint 36 FROZEN at v1.186; Sprint 37 discovery PASS**

Sprint 36 is frozen with `WO-S36-001` DONE, Code Complete = YES, Product
Verified = YES, and the fresh Gap Analysis PASS. Sprint 37 starts after the
verified CreateWorld route; its scope is semantic interpretation and fallback
fidelity only.

The bounded matrix found one semantic gap. All five clear requests reached
CreateWorld. Platformer, Survival, and RPG preserved their supported types on
the deterministic fallback. `做一个农场游戏` was extracted as `sandbox`
because `DefaultGameIntentExtractor` recognizes `farm` but not the clear
Chinese `农场` signal. The same typed loss reaches provider context, sync
generation, and deterministic fallback; the fallback therefore selects the
one-entity Sandbox template. The current Farm template is present, and a
controlled valid provider candidate with `genre: farm` is accepted into the
existing eight-entity Farm composition.

Exactly one READY work order was generated:
`WO-S37-001 — Generic CreateWorld Supported-Archetype Intent Preservation`.
It is not executed. No Farm/RPG mechanics, `IntentRouter` change, provider
architecture, legacy reconnection, second WO, or Sprint 38 entry is authorized
by this discovery decision.

## Sprint 36 Active-World New-World Intent Correctness discovery decision

Date: 2026-09-01

Result: **PASS — discovery complete; historical `SPRINT36_FREEZE_REVIEW` READY**

The repository audit and real Studio evidence agree on one front-door gap. With
an active Survival world, `创建 MarioWorld`, `创建一个 RPG`, and `生成一个
幸存者游戏` are returned by `DefaultIntentRouter` as `unknown`; the Web
`gameStore` then deliberately sends active-world `unknown` input to the
existing World Evolution planner. The planner prompt is constrained to mutate
the current world, and the named whole-world request fails at structured
generation/fallback rather than reaching the existing CreateWorld pipeline.
The same session successfully preserves entity-scoped evolution and replaces
the world for explicit `创建一个新的游戏`.

Exactly one product work order was generated:
`WO-S36-001 — Generic Active-World New-World Intent Classification`, status
`READY`, not executed. This discovery changes no Runtime, Renderer, Semantic
World, AI authority, or architecture contract; v1.185 remained current at
that historical boundary. The next control-plane action was Human/CTO review
at `SPRINT36_FREEZE_REVIEW`; that gate is now accepted and Sprint 37 discovery
is current.

## WO-S36-001 execution decision and result

Date: 2026-09-01

Result: **DONE — Code Complete = YES; Product Verified = YES; v1.186; fresh
Sprint 36 Gap Analysis PASS**

The separately authorized work order changed only the existing IntentRouter
and Web front-door classification boundary. Current-world mutation signals
remain higher precedence; generic whole-world/game creation and named-world
signals use the existing CreateWorld path even with an active world; bare
creation remains ambiguous and non-replacing. The real Studio sequence
verified same-world entity Evolution, active Survival → MarioWorld → Survival
replacement, RPG/Farm and explicit-new replacements, ambiguous preservation,
Platformer Space input, current Observatory truth/assets, and empty browser
diagnostics. At this historical execution boundary, the repository remained at
`SPRINT36_FREEZE_REVIEW` pending the separate Human/CTO freeze decision. That
decision is now accepted: Sprint 36 is FROZEN and Sprint 37 discovery is
current.

## WO-S37-001 execution and Sprint 37 fresh Gap Analysis

Date: 2026-09-02

Result: **DONE — Code Complete = YES; Product Verified = YES; v1.187; fresh
Sprint 37 Gap Analysis PASS**

The authorized work order closed the measured semantic divergence at the
existing `DefaultGameIntentExtractor` boundary. Its ordered immutable local
alias table now recognizes `农场 → farm` alongside `farm`; the existing
Platformer, Survival, RPG, and Sandbox fallback aliases and precedence remain
unchanged. The typed intent continues through provider context and the
deterministic fallback into the current eight-entity Farm template / `Farm
World` DSL. No `IntentRouter`, provider architecture, Runtime, Renderer,
mechanics, or legacy path changed.

AI 9441/9441 and Web 3583/3583 passed, as did focused semantic/fallback/
active-world regressions, AI/Web TypeScript, AI/Web ESLint with zero errors,
Web build, `git diff --check`, and real Studio clean Farm plus active
Survival → Farm world-identity verification. Platformer, Survival, RPG,
unknown-to-Sandbox, Observatory truth, and browser diagnostics remained clean.

Fresh Sprint 37 Gap Analysis is PASS with no immediate P0 blocker. Human/CTO
subsequently accepted the `SPRINT37_FREEZE_REVIEW` freeze and authorized Sprint
38 discovery, recorded below.

## Sprint 37 freeze and Sprint 38 cross-genre playability discovery decision

Date: 2026-09-02

Result: **ACCEPTED — Sprint 37 FROZEN at v1.187; Sprint 38 discovery DONE;
`WO-S38-001` READY**

Sprint 37 is frozen with `WO-S37-001` Code Complete = YES, Product Verified =
YES, and fresh Gap Analysis PASS. Sprint 38 discovery used the real Studio
front door with `创建 MarioWorld`, `生成一个幸存者游戏`, `做一个农场游戏`, and
`创建一个 RPG`.

Platformer preserved its seven-entity side-view baseline and Survival
preserved its six-entity top-down movement/attack baseline. Farm preserved
the eight-entity semantic composition but exposed only generic movement/jump;
its Full Observatory reported one deferred `farm-interaction` rule. RPG
preserved the nine-entity semantic composition but exposed only generic
movement/jump; its Full Observatory reported zero Gameplay Rules. Actual
Runtime Player movement was observed, while Farm/RPG characteristic entities
did not change state after the available controls were exercised. Browser
diagnostics were empty.

The single selected blocker is **SUPPORTED ARCHETYPE ENTITIES ARE NOT
PLAYER-REACHABLE THROUGH AN EXPLICIT PLAYER INTERACTION PATH**. The smallest
candidate shared primitive is discoverable Player action → deterministic
finite-range target → Gameplay Rule → authoritative Runtime result → visible
feedback and truthful Observatory state. The exact control key is not
preselected, and no Farm/RPG system or genre parity is proposed.

Exactly one work order was generated:
`WO-S38-001 — Generic Player-Directed Entity Interaction Reachability`, status
`READY`, not executed. Sprint 38 stops at this READY item; Sprint 39 is not
entered.

## Sprint 17 Goal Authorization

Date: 2026-08-24

Result: **ACCEPTED — ENTER SPRINT 17**

Approved product goal:

> A user can request a simple 2D platformer through natural language and
> Genesis can generate a mechanically coherent game that can be played from
> start to a truthful success or failure lifecycle, using generic structured
> gameplay capabilities rather than genre-specific Runtime implementations.

Primary acceptance scenario:

`natural-language request → world/game generation → move → jump → collectible
interaction → enemy interaction → damage/health → truthful failure when
applicable → recovery/restart/respawn as required → continue → reach goal →
Runtime session completed`.

The candidate gaps (death/failure, restart/respawn, autonomous enemy behavior,
hazards, reward feedback, composition/pacing, and full generated-loop quality)
remain measurement inputs, not pre-approved implementation scope. Exactly one
smallest measured bottleneck is selected per discovery pass. Existing generic
GameplaySpecification, GameplayRuleSet, GameplayEvent, Trigger/Condition/
Action, trusted Runtime execution, World Evolution continuity, and progression
foundations remain the authority boundaries.

## Sprint 17 Product Acceptance Gate

Date: 2026-08-24

Status: **ACCEPTED — WO-S17-002 EXECUTED**

The deterministic/fallback platformer baseline generates seven entities and the
existing generic collect → XP → level path remains verified in Studio. The
approved boundary is:

`provider candidate → structural validation → platformer baseline gate`

Complete candidates are accepted without fallback. Structurally valid but
product-incomplete candidates are rejected and use the deterministic baseline.
Provider transport/execution failure remains a separate safe-fallback outcome.
This decision does not authorize death, respawn, hazards, enemy AI, score, or
pacing work.

## WO-S15-005 product decision

Date: 2026-08-21
Result: ACCEPTED — primary gameplay scenario is ENEMY STOMP.

Boundary:

`player` contacting an `enemy` from above must produce a Runtime-owned
`ENTITY_CONTACT_STARTED` fact with `direction=top`; the generic
`GameplayRuleMatcher` and `GameplayConditionEvaluator` must validate the
player/enemy/top rule, then the trusted generic actions
`REMOVE_ENTITY(eventTarget)` and `APPLY_VELOCITY(eventActor, upward bounce)`
must commit exactly once. The enemy must disappear from Runtime and Renderer;
the player must bounce, land, and retain movement/jump continuity.

The slice must keep direction out of Pixi/visual geometry, avoid genre-specific
Runtime systems, keep deferred damage visibly non-executed, and use deterministic
rule-level all-or-nothing semantics for multi-action failure without creating a
general transaction framework.

## WO-S15-007 — Human Architecture Decision

Date: 2026-08-24
Result: ACCEPTED — goal completion authority belongs to the Runtime session
gameplay state.

Authoritative model:

- `RuntimeGameplaySessionState` is the minimal current-session state with
  `status: active | completed`.
- Optional completion metadata is limited to reliable facts already available,
  such as `completedByGoalId` and `completedAtTick`.
- The Goal entity/component is the world object that may trigger completion; it
  is not the authoritative session-completion state.
- Web/application state and Pinia are projections of committed Runtime truth.
- No generic `GameStateManager` is introduced.

Lifecycle and isolation:

1. A new Runtime world/session starts as `active`.
2. A trusted `COMPLETE_GOAL` action transitions `active` to `completed`.
3. Completion is terminal for the current world/session.
4. Repeated `COMPLETE_GOAL` execution is idempotent and returns a deterministic
   already-completed/no-op result without duplicate completion side effects.
5. Replacing the world/session resets the new session to `active`.
6. World Evolution that does not replace the Runtime world/session does not
   reset completion.
7. A stale World A event/rule/action cannot complete World B.

Execution boundary:

`GameplayEvent → GameplayRule → COMPLETE_GOAL → trusted Runtime session-state
mutation → Renderer/Web/Observatory projection`.

WO-S15-007 is unblocked. Its implementation is limited to the player-contact →
generic goal rule → `COMPLETE_GOAL` → Runtime completion-state → truthful
Observatory/UI slice. Runtime ticking may continue after completion. Stopping the
loop, freezing controls, victory UI, next level, restart, failure/game-over,
score, XP, progression, timers, goal deletion, and generic game-state
infrastructure remain out of scope.

The queue transition is explicitly `BLOCKED → READY → IN_PROGRESS`; the READY
gate was satisfied by this accepted decision and WO-S15-007 could proceed.

## WO-META-003 dry run

Date: 2026-08-21
Result: PASS — no product code changed.

Simulation:

1. Read source/runtime truth, PROJECT_STATE.md, latest Sprint 15 backlog, and
   relevant ADRs.
2. Recovered architecture v1.151 and confirmed WO-S15-004 complete.
3. Selected WO-S15-005 as the next queue item; its dependency is satisfied,
   but its scenario choice correctly raises a human decision gate.
4. Proposed topology: Supervisor owns scope and contract; one optional
   read-only Architecture Reviewer; a Verification Agent only after an
   implementation slice exists; Product Verification only if the next item is
   user-visible.
5. Applied the gates: targeted tests, affected-package checks, TypeScript,
   ESLint, build when applicable, diff check, architecture review, and
   Product Verification classification.
6. Escalation points are the S15-005 scenario choice, any invariant/ADR
   conflict, destructive operation, security/dependency change, broad
   refactor, or three failed repair rounds.

The dry run selected no product work and left S15-005 READY.

## Delegation records

- 2026-08-21: An initial broad read-only reviewer did not return after bounded
  waits and was shut down. Result: unavailable, not treated as PASS; no files
  were modified.
- 2026-08-21: A second bounded read-only reviewer checked v1.151, S15-005
  readiness/dependency, repair budget 3, ONE_WORK_ITEM, and the forbidden
  product/external scope. Result: PASS; findings: none; no files modified.

## WO-META-004 — Supervisor Trial #1 record

Date: 2026-08-24
Architecture: v1.152 → v1.152
Product architecture changed: NO
Result: PASS — docs/control-plane-only hardening; no Genesis product code was
changed.

### Trial #1 lessons

What worked:

- subagent results were not blindly trusted;
- the cancelled/unavailable Audit Agent result was not accepted;
- an independent Architecture Reviewer found real defects;
- the Supervisor repaired those findings within the three-round budget;
- Product Verification remained truthful;
- `continuation_mode=ONE_WORK_ITEM` was respected;
- the Supervisor stopped after WO-S15-005 and did not execute S15-006.

What needs tuning:

- the first read-only audit task was too broad;
- repeated bounded waits were treated too aggressively;
- the lifecycle policy lacked clear progress/timeout semantics;
- full-suite validation must remain centralized under the Supervisor.

This is orchestration tuning, not a product defect.

### Trial #1 scorecard

| Dimension | Result | Note |
| --- | --- | --- |
| Scope Discipline | PASS | Product slice stayed within approved generic Runtime boundaries. |
| Delegation Quality | PASS | Useful delegation, with task-granularity tuning required. |
| Evidence Integrity | PASS | Unavailable/cancelled output contributed no gate evidence. |
| Architecture Review Independence | PASS | Reviewer found ordering, capability, and isolation issues. |
| Repair Convergence | PASS | Two repair rounds; budget was 2/3. |
| Product Verification Truthfulness | PASS | Browser evidence was collected and classified separately. |
| Stop Discipline | PASS | No automatic WO-S15-006 execution. |
| Human Escalation Correctness | PASS | Scenario decision remained human-controlled. |

Overall Trial #1: PASS, with delegation/lifecycle tuning noted.

### Optional narrow subagent test

2026-08-24: Socrates, Read-only Runtime Audit. Objective: determine whether a
reusable authoritative generic Health component or equivalent numeric entity
health state exists. Result: PASS — `NO`; no reusable authoritative Health
primitive was found. Evidence was limited to the exact paths returned:

- `/Users/jjbond/Desktop/project-genesis/packages/shared/src/RuntimeComponent.ts`
  (`RuntimeComponent`);
- `/Users/jjbond/Desktop/project-genesis/packages/runtime/src/model/RuntimeComponent.ts`
  (`RuntimeComponent` re-export only);
- `/Users/jjbond/Desktop/project-genesis/packages/shared/src/types.ts`
  (`Entity.components`);
- `/Users/jjbond/Desktop/project-genesis/packages/shared/src/gameplay/GameplayRule.ts`
  (`GameplayAction.DAMAGE_ENTITY`, `GameplayNumericReference.health`);
- `/Users/jjbond/Desktop/project-genesis/packages/shared/src/gameplay/GameplaySpecification.ts`
  (`action-damage-entity` remains `deferred`).

The agent was read-only, ran no full suite, spawned no descendants, and was
closed after returning its auditable result.

### WO-S15-006 dry run under hardened policy

The dry run did not execute product code. The Supervisor owns the shared
Health/DAMAGE_ENTITY contract before any implementation delegation.

```text
Supervisor
├── Read-only Audit Agent
│   Question: Is there already a generic Health-like authoritative state?
└── Architecture Reviewer
    Runs after the bounded implementation/verification slice, not as a
    competing contract designer.
```

The audit task is one question with exact-file output and no edits/full suite.
Implementation remains with the Supervisor unless a later bounded code slice is
explicitly delegated. A future Verification Agent may check only side/top
contact gating, exactly-once, Health mutation, and stale-world isolation. The
maximum concurrency is two, nested spawning is disabled, and Product
Verification remains Supervisor-owned. Dry-run result: PASS.

## WO-META-005 — Next-work discovery dry run

Date: 2026-08-24
Result: PASS — control-plane-only discovery; no Genesis product code or
architecture was changed. The current Sprint goal is explicit in
`SPRINT15_BACKLOG.md`; the queue horizon contains exactly one generated next
product WO.

### Measured decision

Verified capabilities are movement/jump continuity, Runtime-owned contact and
landing facts, collectible removal, generic enemy stomp with bounce, generic
Health plus non-top `DAMAGE_ENTITY`, and separate Runtime/Rule/Renderer/
Observatory truth. Sprint 15 still requires a truthful success/goal path for
the platformer checkpoint. Goal intent is modeled, but `reach-goal` and
`COMPLETE_GOAL` remain deferred: there is no goal/session completion state or
completion executor, and `RuntimeWorldStore` owns only the current World. This
is the smallest current blocker because the already verified interaction and
damage loop has no authoritative success outcome.

### Candidate gap classification

- `PRODUCT_GAP` + `EXECUTION_GAP`: goal contact cannot produce a committed
  success result; the shared action is deferred and the Runtime executor
  rejects it.
- `ARCHITECTURE_GAP`: ownership and lifecycle of authoritative completion state
  are not decided. This is a high-impact choice because it determines whether
  completion belongs to a Runtime session state, a World entity/component, or
  an application-owned projection.
- `VERIFICATION_GAP`: no Studio path can truthfully show goal completion while
  the capability is deferred.
- `DEFERRED_OUT_OF_SPRINT`: score/XP, death/respawn/game-over, enemy AI,
  timers, spawning, progression, persistence, and gameplay-rule evolution do
  not win the current Sprint selection.

### Rejected alternative candidates

- **Death/respawn/game-over** did not win: the completed Health contract
  deliberately defines zero as state only, and failure/restart ownership is a
  larger follow-on boundary than the missing success path.
- **Score/numeric state** did not win: collectible contact/removal is already
  the verified interaction slice, while no Sprint acceptance criterion
  requires a score store; adding one would be speculative infrastructure.
- **Timers, spawning, enemy AI, progression, XP, and waves** did not win:
  they are explicitly outside the Sprint checkpoint and have no measured
  blocker relationship to the current playable slice.
- **Verification/quality polish** did not win: the existing S15-006 path has
  automated gates and real Studio evidence; the remaining issue is executable
  product capability, not an unverified implemented path.

### Human decision gate for WO-S15-007

The next product WO is `BLOCKED`, not `READY`, until Human/CTO chooses the
completion authority. Concrete options:

1. **Runtime session completion state** — add a narrow, world/session-bound
   `GameplayCompletionState` owned by Runtime and mutated by a supported
   `COMPLETE_GOAL`; it is generic and aligns with Runtime authority, but adds a
   session-state lifecycle and a new observable result contract.
2. **Goal entity/component state** — represent completion on the goal entity
   through the existing immutable World mutation boundary; it reuses World
   persistence, but makes session-level completion and multi-goal semantics
   depend on entity state and world evolution.
3. **Web/application session state** — let the Web/game store derive and own
   completion from rule results; it is the smallest local code change, but
   duplicates gameplay authority outside Runtime and conflicts with the
   current authority invariants unless explicitly approved.

No option is selected by the Supervisor. The decision must also define whether
completion is terminal for the current session, whether repeated completion is
idempotent, and how world/session replacement clears or rebinds it. This is a
narrow decision gate; it does not authorize death, respawn, progression, or a
generic game-state store.

## WO-META-005 — Supervisor Trial #2 record

Date: 2026-08-24
Architecture: v1.153 → v1.153
Product architecture changed: NO
Result: PASS — WO-S15-006 completed with zero subagents, truthful product
verification, and correct stop discipline. This trial is valid evidence that
multi-agent delegation is optional.

| Dimension | Result | Note |
| --- | --- | --- |
| Scope Discipline | PASS | Health/DAMAGE_ENTITY stayed within the approved generic slice. |
| Delegation Quality | PASS | No delegation was needed; zero subagents was the correct bounded choice. |
| Evidence Integrity | PASS | Automated evidence and manual Chrome evidence were kept distinct. |
| Architecture Review Independence | PASS | The Supervisor performed the invariant review directly; no unresolved gate was hidden behind a subagent. |
| Repair Convergence | PASS | No repeated repair loop; required checks converged within budget. |
| Product Verification Truthfulness | PASS | Observatory and Inspector evidence showed committed damage and Health 100→93. |
| Stop Discipline | PASS | The Supervisor stopped after WO-S15-006 and did not execute the discovered WO. |
| Human Escalation Correctness | PASS | No high-impact choice was invented during the product slice. |

Overall Trial #2: PASS. The new discovery phase now records the next goal
bottleneck and its human decision gate without executing it.

## WO-S15-007 completion and Next-Work Discovery

Date: 2026-08-24

Result: PASS — the accepted Runtime session-state decision was implemented and
verified within the minimum goal-completion slice. RuntimeGameplaySessionState
owns committed current-session completion; the Goal remains a trigger, and
Web/Pinia/Observatory remain projections. Automated evidence covers terminal
idempotence, semantic-revision retention, world/session reset, stale-world
isolation, and Renderer/Web projection. Studio evidence confirmed a real goal
completion status and that replacement of the completed world starts the new
world as `active` while Runtime remains Live.

Discovery result: the Sprint 15 minimum checkpoint is satisfied. Exactly one
next horizon item was generated: `SPRINT_FREEZE_REVIEW — Sprint 15 Gameplay
Mechanics Foundation`, currently `BLOCKED` pending Human/CTO review. No next
implementation was executed.

## Sprint 15 Freeze Review decision

Date: 2026-08-24
Result: ACCEPTED — proceed with `SPRINT_FREEZE_REVIEW` for Sprint 15.

The review authority is the Sprint-level product thesis: Genesis must be able
to describe and execute a mechanically coherent platformer slice through
generic structured Gameplay Rules and trusted Runtime primitives. Death,
Game Over, respawn, lives, score, question-block rewards, timers, spawners,
XP, level-up, skill selection, waves, and the full Survivor loop are deferred
unless an existing Sprint 15 contract explicitly requires them. Sprint 16
implementation is not authorized by this decision.

## Sprint 16 Gameplay-Preserving World Evolution decision

Date: 2026-08-24
Result: ACCEPTED — use targeted Gameplay Rule Reconciliation.

Authoritative reconciliation input:

`Current Semantic World + Current GameplaySpecification + Current
GameplayRuleSet + Applied Semantic Delta + Genesis Gameplay Capability Catalog`

The reconciler must preserve unaffected rules, revalidate affected rules,
remove invalid or dangling exact references, and deterministically rebuild
affected known rules where the existing `GameplaySpecification` and
`GameplayRuleBuilder` can resolve them. A semantic revision change alone must
not disable the entire RuleSet. Provider/AI regeneration is not the default;
it is reserved for genuinely new or ambiguous gameplay intent that cannot be
derived deterministically.

The current GameplaySpecification remains design-intent authority, the
reconciled GameplayRuleSet remains executable rule-plan authority, Runtime
remains execution/state authority, and Web/Observatory remain projections.
World A rules/results must not affect World B. Runtime, Renderer, and the
current world must not be fully rebuilt. No GameplayRuleManager, generic
workflow engine, event sourcing, or second gameplay authority is authorized.

Decision-resolution outcome: `SPRINT16_DISCOVERY` transitioned from `BLOCKED`
to `READY`, completed its bounded discovery pass, and generated exactly one
product item: `WO-S16-001 — Targeted Gameplay Rule Reconciliation Across World
Evolution`. The product WO is `READY` but is not executed in this continuation;
the then-current `ONE_WORK_ITEM_WITH_DISCOVERY` policy required stopping after
generation. The later continuation-mode promotion is recorded below and does
not retroactively execute this product WO.

## Continuation mode promotion

Date: 2026-08-24
Result: ACCEPTED — current continuation mode is `SPRINT_CONTINUOUS`.

This is an engineering control-plane change only. It permits sequential
Supervisor execution of accepted work items within the current Sprint. It does
not authorize uncontrolled autonomy, parallel primary work, automatic future
Sprint entry, or execution of product WO-S16-001 in the mode-change request
itself.

The following controls remain unchanged:

- `max_concurrent_subagents = 2`
- repair budget = 3 rounds
- Human/CTO escalation for authority, architecture, product direction,
  destructive changes, security/dependency changes, unresolved gates, and
  repeated verification failure
- one primary WO at a time
- exactly one next WO generated per discovery pass
- Sprint boundary freeze/review stop
- no automatic cross-Sprint execution
