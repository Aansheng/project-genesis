# Sprint 22 Review — Studio Session Continuity

- Date: 2026-08-26
- Architecture: v1.171
- Decision: **FROZEN**
- Code Complete: **YES**
- Product Verified: **YES**

The reported Studio → Full Observatory session-loss issue was **NOT REPRODUCED
IN CURRENT PRODUCT**. Real SPA navigation retained `world-1`, 12 entities,
Player `(80,400)`, Health `100/100`, and the active Runtime/session; a
post-return `再加两个金币` changed entities `12 → 14` with Runtime/Renderer
synchronization and clean diagnostics. Pinia owns Runtime authority at app
scope; viewport resource teardown does not reset it. Refresh/close durability
was neither claimed nor required.
