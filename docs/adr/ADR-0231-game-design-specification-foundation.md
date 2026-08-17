# ADR-0231: AI Game Design Specification Foundation

**Status:** Accepted  
**Work Order:** WO-S12-008  
**Architecture Version:** v1.117 → v1.118

## Decision

Introduce the vendor-independent shared `GameDesignSpecification` between the
untrusted AI candidate and `GameWorldModel`. The first version contains title,
genre, optional theme and difficulty, typed objectives, and semantic entity
roles. It contains no coordinates, components, renderer data, runtime systems,
DSL details, or implementation class names.

`DefaultGameWorldValidator` remains the trust boundary. After validating a
candidate it creates a deeply frozen specification, and
`DefaultGameDesignWorldBuilder` projects only `genre`, `id`, `category`, and
`name` into the existing world model. Theme, difficulty, objectives, and roles
are retained for future consumers because the current layout, DSL, and runtime
cannot realize them yet.

The existing `WorldTemplateCatalog` and deterministic Mario path remain
unchanged. Gameplay feature intents and multi-level/region structure are
deferred until a downstream consumer exists.
