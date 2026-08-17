# AI Generation Capability Matrix

Validated against the v1.123 semantic candidate contract. This matrix describes
what the current pipeline can preserve and execute; it does not claim gameplay
behavior that has not been implemented.

| Semantic | Understood | Preserved | Compiled | Runtime realized | Visually realized |
| --- | --- | --- | --- | --- | --- |
| platformer genre | yes | yes | yes | yes | primitive platformer geometry |
| world title | yes | yes, as `GameDesignSpecification.title` | yes as specification metadata | no gameplay effect | no |
| ice/snow theme | yes, as `theme.name` | yes, in `GameDesignSpecification` | no | no | no |
| medium difficulty | yes | yes, in `GameDesignSpecification` | no | no | no |
| player | yes | yes | yes | yes | primitive entity |
| two distinct enemies | yes, as two entities | yes | yes | yes, as entities | primitive entities |
| patrol role | yes, as `entity.role` | yes | no | no patrol behavior | no |
| checkpoint | yes, as an entity/objective when emitted | yes | yes as a generic entity | no checkpoint logic | primitive entity |
| boss | yes, as an enemy/entity/objective when emitted | yes | yes as a generic entity | no combat or boss AI | primitive entity |
| goal objective | yes, as `objectives[].type = reach-goal` | yes | yes as objective metadata/generic entities when emitted | no goal-completion system | primitive entity only |
| multiplayer/trading/dungeons/leaderboards | only supported high-level fields | only supported fields | no implementation details | no | no |

The diagnostic result distinguishes `source: "ai"` from
`source: "deterministic"` and includes validation status, validation errors,
the accepted specification, and resulting entity IDs. The runtime activation
scenario was manually verified with an OpenAI-compatible DeepSeek provider;
credentials remain server-session-only and are not recorded here.

Observability status: prompt assembly, candidate parsing, validation, design
specification, world compilation, and runtime injection are represented by the
latest session trace. AI failure remains distinct from deterministic fallback;
no credentials, headers, raw transport payloads, or model reasoning are traced.

## Reliability capabilities

| Capability | Status | Policy |
| --- | --- | --- |
| Structured Response Validation | SUPPORTED | Strict candidate validation remains authoritative. |
| Output Budget | SUPPORTED | Server default is 4000 tokens; configurable via `AI_MAX_OUTPUT_TOKENS`. |
| Timeout | SUPPORTED | One request is bounded by `AI_TIMEOUT_MS` (default 30 seconds). |
| Bounded Retry | SUPPORTED | At most one retry; only transient/provider/truncation failures retry. |
| Deterministic Fallback | SUPPORTED | Terminal AI failures produce a playable deterministic world. |
| Malformed JSON Recovery | SUPPORTED | Empty/malformed/truncated text is classified and rejected; no permissive prose extraction. |

Generation traces expose attempt count and failure reason without provider
secrets or raw transport payloads.
