# Sprint 21 Gap Analysis — Post WO-S21-001

Date: 2026-08-26

## Verified Sprint Evidence

The existing Codex CLI World Evolution gateway was started on the local Studio
gateway. A real seven-entity playable platformer was opened as `world-1` with
one Enemy, Player position `(80,400)`, Health `100/100`, Experience `0`, and
Level `1`.

The browser automation keyboard bridge did not produce a Player-position change
in this session, so continuity was verified against the observed live baseline
state rather than a newly collected progression state; this did not prevent the
same-world/session, Health, progression, entity-preservation, or active-play
checks below.

- `增加5个enemy` succeeded through the existing World Evolution path. Enemy
  count changed `1 → 6`; Runtime entity count changed `7 → 12`.
- The Studio activity reported `Add Enemy ×5` and `Runtime synchronized; Visual
  asset synchronization completed`.
- `再加五只怪` then succeeded with the same semantics. Enemy count changed
  `6 → 11`; Runtime entity count changed `12 → 17`.
- `world-1`, Player position/Health, XP/Level, active gameplay, all original
  terrain/item entities, and the browser error/warning log remained unchanged.
- The Renderer displayed the evolved world. Its existing compatible Enemy
  visual contract was reused: the image-operation list did not grow with five
  duplicate Enemy requests, and the operation reported completed visual sync.

Together with the production wiring in `gameStore.send()` and ADR-0283, this
is evidence of the intended chain: deterministic route miss → existing AI
World Evolution interpretation → Genesis validation → semantic delta → atomic
semantic mutation → targeted Runtime synchronization → gameplay-rule
reconciliation → visual synchronization. The Studio surface does not expose a
separate per-operation candidate trace without leaving the active session, so
the valid-candidate inference is bounded to the observed successful mutation
and the production path that permits it.

## Completed Non-Enemy Target Measurement

In a new real active `world-1`, the baseline contained one existing
collectible/coin. `再加两个金币` succeeded through the same production
fallback:

- the deterministic router does not list `再加` or `金币` among its v1
  evolution verb/target anchors, so this was a route miss; the existing-world
  `gameStore.send()` fallback invoked the structured World Evolution planner;

- the activity reported `Add Coin ×2`;
- the total entity count changed `7 → 9`;
- the original `collectible` plus `coin-1` and `coin-2` establish Coin count
  `1 → 3`, not a replacement total of two;
- Player `(80,400)`, Health `100/100`, Experience `0`, Level `1`, original
  Enemy, terrain, Platform, goal, checkpoint, active session, and clean
  browser diagnostics remained;
- the activity reported Runtime and completed visual synchronization. The
  pre-existing Coin image-operation list did not gain duplicate equivalent
  Coin work, and the rendered active world reflected the targeted update.

This proves free-form paraphrase robustness for two distinct add targets
(Enemy and Coin), quantitative ADD semantics, targeted mutation, and
same-session continuation. No new product code was added.

## Exactly One Next Measured Blocker

**Unmeasured operation diversity:** Sprint 21 now proves multiple free-form
ADD targets, but has not measured whether an ordinary non-ADD edit reaches the
same validated targeted path.

The next bounded measurement is one request only:

`删掉一个敌人`

Expected result: remove exactly one existing Enemy while retaining the current
world/session, Player/progression, unrelated entities, gameplay rules, and
compatible visuals. If it does not succeed, classify the first failing boundary
as FRONT_DOOR, AI_INTERPRETATION, TARGET_RESOLUTION, QUANTITY, VALIDATION,
SEMANTIC_MUTATION, RUNTIME_SYNC, GAMEPLAY_RECONCILIATION, or
VISUAL_RECONCILIATION. This is a measurement, not a pre-authorized
implementation item; no WO-S21-002 is created.
