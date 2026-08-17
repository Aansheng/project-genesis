# ADR-0233: AI Generation Observatory Trace Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S12-011
- Architecture Version: v1.120 → v1.121

## Decision

Reuse `GameWorldGenerationDiagnostics` and add an immutable `GameGenerationTrace`
with observable stage statuses for request, prompt assembly, model generation,
candidate parsing, validation, specification, world compilation, and runtime
injection. The AI package remains framework-independent; the Web Observatory
receives the latest trace through its existing data store.

Fallback diagnostics preserve the AI failure and identify deterministic fallback
separately. Only semantic candidate/specification fields are copied to the UI;
credentials, headers, raw transport data, and model reasoning are excluded.

The latest trace is session-scoped in Pinia and is replaced on each generation.
No persistence or multi-generation history is introduced.
