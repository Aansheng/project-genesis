# AI Generation Capability Matrix

Validated against the v1.121 semantic candidate contract. This matrix describes
what the current pipeline can preserve and execute; it does not claim gameplay
behavior that has not been implemented.

| Semantic | Understood | Preserved | Compiled | Runtime realized | Visually realized |
| --- | --- | --- | --- | --- | --- |
| platformer genre | yes | yes | yes | yes | primitive platformer geometry |
| ice/snow theme | yes, as `theme.name` | yes, in `GameDesignSpecification` | no | no | no |
| medium difficulty | yes | yes, in `GameDesignSpecification` | no | no | no |
| player | yes | yes | yes | yes | primitive entity |
| two distinct enemies | yes, as two entities | yes | yes | yes, as entities | primitive entities |
| patrol role | yes, as `entity.role` | yes | no | no patrol behavior | no |
| checkpoint | yes, as an entity/objective when emitted | yes | yes as a generic entity | no checkpoint logic | primitive entity |
| boss | yes, as an enemy/entity/objective when emitted | yes | yes as a generic entity | no combat or boss AI | primitive entity |
| multiplayer/trading/dungeons/leaderboards | only supported high-level fields | only supported fields | no implementation details | no | no |

The diagnostic result distinguishes `source: "ai"` from
`source: "deterministic"` and includes validation status, validation errors,
the accepted specification, and resulting entity IDs. Real API calls remain a
manual verification step and are not part of automated tests.

Observability status: prompt assembly, candidate parsing, validation, design
specification, world compilation, and runtime injection are represented by the
latest session trace. AI failure remains distinct from deterministic fallback;
no credentials, headers, raw transport payloads, or model reasoning are traced.
