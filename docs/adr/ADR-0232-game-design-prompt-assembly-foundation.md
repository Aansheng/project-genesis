# ADR-0232: Game Design Prompt Assembly Foundation

**Status:** Accepted  
**Work Order:** WO-S12-009  
**Architecture Version:** v1.118 → v1.119

## Decision

Add `DefaultGameDesignPromptBuilder` under `@genesis/ai` as a pure,
vendor-independent semantic prompt assembly layer. It receives the original
request and `GameIntent`, and emits deterministic system/user prompt content
that describes the actual candidate contract, supported values, realized
semantics, and preserve-only semantics.

`StructuredGenerationClient` accepts the assembled prompt as an optional
second argument for backward compatibility. The gateway and LLM candidate
provider assemble prompts before calling the client. `OpenAIStructuredGenerationClient`
only transports the assembled messages and retains no Genesis game-design
instructions.

No runtime, renderer, DSL, gameplay, schema parser, or vendor-specific
capability framework is added. Theme, difficulty, objectives, and roles remain
preserved above the current executable world model.
