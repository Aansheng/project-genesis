# AI Architecture

> Project Genesis — AI Architecture Reference (v1.14)
> Primary reference for all AI development.

### BuilderOptions

`BuilderOptions` is a consolidated options interface for `DefaultPromptBuilder`, introduced in WO-S4-009. Extended with `intentAnalyzer` in WO-S5-003, `intentRenderer` in WO-S5-004, `entityAnalyzer` in WO-S5-008, `entityRenderer` in WO-S5-009, `semanticContextBuilder` in WO-S5-012, and `semanticContextRenderer` in WO-S5-013, `strategySelector` and `strategies` in WO-S5-016, `strategyRenderer` in WO-S5-017, `strategyModules` in WO-S5-024, `strategyModuleRenderer` in WO-S5-025, `strategyEvaluator` in WO-S5-029, `strategySelectionRenderer` in WO-S5-038, `promptAssemblyTraceDiffer` in WO-S5-061, `promptAssemblyTraceRenderer` in WO-S5-063, and `promptAssemblyTraceExporter` in WO-S5-065. Timeline model introduced independently in WO-S5-066 and consumed by DefaultPromptBuilder in WO-S5-067 via Phase 0.95996. Timeline differ introduced in WO-S5-068 foundation and consumed in WO-S5-069 via Phase 0.95997. Timeline renderer introduced in WO-S5-070 foundation and consumed in WO-S5-071 via Phase 0.959975. Timeline exporter introduced in WO-S5-072 foundation and consumed in WO-S5-073 via Phase 0.959976. Timeline snapshot foundation introduced in WO-S5-074. Timeline snapshot consumed in WO-S5-075 via Phase 0.9599765. PromptAssemblyHistory foundation introduced in WO-S5-076. PromptAssemblyHistory consumed in WO-S5-077 via Phase 0.9599767. PromptAssemblyHistoryDiff foundation introduced in WO-S5-078. PromptAssemblyHistoryDiff consumed in WO-S5-079 via Phase 0.9599768. PromptAssemblyHistoryRenderer foundation introduced in WO-S5-080.

```typescript
interface BuilderOptions {
  renderer?: PromptRenderer
  compression?: PromptCompression
  ranking?: MemoryRanking
  budget?: PromptBudget
  selection?: PromptSelection
  providerBudget?: ProviderBudget
  configuration?: AIConfiguration
  intentAnalyzer?: IntentAnalyzer       // ← WO-S5-003
  intentRenderer?: IntentRenderer       // ← WO-S5-004
  entityAnalyzer?: EntityAnalyzer            // ← WO-S5-008
  entityRenderer?: EntityRenderer            // ← WO-S5-009
  semanticContextBuilder?: SemanticContextBuilder  // ← WO-S5-012
  semanticContextRenderer?: SemanticContextRenderer  // ← WO-S5-013
  strategySelector?: PromptStrategySelector          // ← WO-S5-016
  strategies?: readonly PromptStrategy[]               // ← WO-S5-016
  strategyRenderer?: PromptStrategyRenderer            // ← WO-S5-017
  strategyModules?: readonly StrategyModule[]           // ← WO-S5-024
  strategyModuleRenderer?: StrategyModuleRenderer       // ← WO-S5-025
  strategyEvaluator?: StrategyEvaluator                 // ← WO-S5-029
}
```

**Current status:** Fully consumed by `DefaultPromptBuilder` since WO-S4-010. Both legacy positional and BuilderOptions forms coexist. `intentAnalyzer`, `intentRenderer`, `entityAnalyzer`, `entityRenderer`, `semanticContextBuilder`, `semanticContextRenderer`, `strategyEvaluator` only available via BuilderOptions form — no new positional parameter added.

**Design principles:**
- All fields are optional
- Each field maps 1:1 to an existing or new constructor parameter
- No new fields beyond what the constructor already accepts
- Pure data interface — no methods, no behavior

---

## Intent Layer

The Intent Layer is the semantic bridge between natural language and executable runtime actions. Introduced in WO-S5-001 (Sprint 5).

### Architecture Status

**Production V1** — Intent fully integrated into Prompt Assembly pipeline. IntentAnalyzer + IntentRenderer + DefaultPromptRenderer produce "User Intent:" section in final prompt. IntentResult and intentRendered stored in metadata.

### Component Responsibilities

| Component | Type | Purpose |
|-----------|------|---------|
| `IntentType` | String union | User intention categories: `Create`, `Delete`, `Move`, `Modify`, `Query` |
| `Intent` | Interface | Minimal immutable data object with `readonly type: IntentType` |
| `IntentResult` | Interface | Container for multiple intents: `{ intents: Intent[] }` |
| `IntentAnalyzer` | Interface | Contract for extracting intents from natural language: `analyze(input: string): IntentResult` |
| `DefaultIntentAnalyzer` | Class | Placeholder implementation returning empty `{ intents: [] }` |
| `RuleBasedIntentAnalyzer` | Class | Production V1 — keyword-based intent detection |
| `IntentRenderer` | Interface | Contract for converting IntentResult to formatted string: `render(intent: IntentResult): string` |
| `DefaultIntentRenderer` | Class | Default implementation — "User Intent:\\n- Create" format |

### Intent Types

```typescript
type IntentType = 'Create' | 'Delete' | 'Move' | 'Modify' | 'Query'
```

Future types are added via string union extension — no breaking changes.

### DefaultIntentAnalyzer

```typescript
class DefaultIntentAnalyzer implements IntentAnalyzer {
  analyze(_input: string): IntentResult {
    return { intents: [] }
  }
}
```

- Foundation only — no parsing, no AI, no heuristics
- Pure, deterministic, stateless, no side effects
- No dependencies on Planner, Runtime, Provider, Memory, ToolCalling, or AgentLoop

### RuleBasedIntentAnalyzer

Production V1 intent analyzer using keyword matching. Introduced in WO-S5-002.

**Keyword Mapping:**

| IntentType | Chinese Keywords | English Keywords |
|-----------|-----------------|------------------|
| `Create` | 创建, 生成, 画, 添加, 新建, 制造, 放一个, 放一棵 | spawn, create, generate, draw, add, build, make |
| `Delete` | 删除, 移除, 销毁, 清除, 干掉, 消灭 | delete, remove, destroy, clear, erase |
| `Move` | 移动, 挪 | move, translate |
| `Modify` | 修改, 改变, 编辑, 调整, 替换, 更新 | replace, change, modify, update, adjust |
| `Query` | 查询, 查看, 显示, 列出, 获取, 有什么, 多少, 哪些, 看看 | query, what, show, list, get, find, which, how many |

**Algorithm:**

```
analyze(input):
  1. Trim — return empty if blank
  2. Split by separators (， 、 。 , . 再 然后 and then)
  3. For each segment:
     a. Lowercase for case-insensitive matching
     b. Scan all keywords in INTENT_ORDER priority
     c. If keyword found → add IntentType
  4. Deduplicate — first occurrence preserved
  5. Return IntentResult or empty result
```

**Properties:**
- Pure, stateless, deterministic — no I/O, no LLM, no external dependencies
- Case-insensitive English keyword matching
- Multi-intent support via separator-based segmentation
- Duplicate removal preserves input order
- Unknown/empty input returns `{ intents: [] }` (never throws)
- Implements `IntentAnalyzer` interface — no modifications to existing interfaces

### StrategyModule

```typescript
interface StrategyModule extends PromptModule {}
```

- Marker extension of `PromptModule` — inherits `build()` and optional `buildContext()`
- Semantic category for strategy-specific prompt content modules
- Each concrete module produces deterministic guideline text
- Foundation only — not consumed by PromptBuilder yet

### CreateStrategyModule

```typescript
class CreateStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return `Creation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities`
  }
  async buildContext(_context: PipelineContext): Promise<Partial<PromptContext>> {
    return { strategyRendered: `Creation Guidelines:...` }
  }
}
```

- Produces creation-oriented behavioral guidelines
- Pure, stateless, deterministic — same output regardless of input
- Input-independent — ignores PipelineContext content

### QueryStrategyModule

```typescript
class QueryStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return `Query Guidelines:\n\n- Focus on retrieving information\n- Avoid changing world state`
  }
}
```

- Produces query-oriented behavioral guidelines
- Pure, stateless, deterministic — same output regardless of input

### ModifyStrategyModule

```typescript
class ModifyStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return `Modification Guidelines:\n\n- Preserve entity identity\n- Modify only requested properties`
  }
}
```

- Produces modification-oriented behavioral guidelines
- Pure, stateless, deterministic — same output regardless of input

### DeleteStrategyModule

```typescript
class DeleteStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return `Deletion Guidelines:\n\n- Confirm target existence\n- Remove only requested entities`
  }
}
```

- Produces deletion-oriented behavioral guidelines
- Pure, stateless, deterministic — same output regardless of input

### Dependency Rules

- `IntentAnalyzer` must NOT depend on Planner, Runtime, Provider, Memory, ToolCalling, AgentLoop, PromptBuilder, or Pipeline
- `Intent` is pure data — no behavior, no methods
- `IntentResult` is pure data — no behavior, no methods
- `DefaultIntentAnalyzer` is a placeholder — zero logic beyond the contract

### Future (Not Yet Implemented)

| Capability | Interface | Mechanism |
|-----------|-----------|-----------|
| HeuristicIntentAnalyzer | `IntentAnalyzer` | New class, same interface |
| LLMIntentAnalyzer | `IntentAnalyzer` | New class, same interface |
| Intent → Prompt Output | `PromptContext` | Inject intentRendered into final prompt |
| Intent → Pipeline | `PipelineContext` | Add intent to PipelineContext |
| Intent Routing | `Planner` | Route intents to different executors |
| Custom IntentRenderer | `IntentRenderer` | Alternative rendering formats |

---

## Entity Layer

The Entity Layer is the second semantic understanding layer, responsible for recognizing entity types from user input. Introduced in WO-S5-006 (Sprint 5).

### Architecture Status

**Prompt Integrated** — EntityAnalyzer + EntityRenderer + DefaultPromptRenderer. Entity rendered in final prompt as "Entities:" section.

### Component Responsibilities

| Component | Type | Purpose |
|-----------|------|---------|
| `EntityType` | String union | Recognized entity types: `Tree`, `Flower`, `House`, `Rock`, `Water`, `Grass`, `Character`, `Unknown` |
| `Entity` | Interface | Minimal immutable data object with `readonly type: EntityType` |
| `EntityResult` | Interface | Container for multiple entities: `{ entities: Entity[] }` |
| `EntityAnalyzer` | Interface | Contract for extracting entities from natural language: `analyze(input: string): EntityResult` |
| `DefaultEntityAnalyzer` | Class | Placeholder implementation returning empty `{ entities: [] }` |
| `RuleBasedEntityAnalyzer` | Class | Production V1 — keyword-based entity detection |
| `EntityRenderer` | Interface | Contract for converting EntityResult to formatted string: `render(entity: EntityResult): string` |
| `DefaultEntityRenderer` | Class | Default implementation — "Entities:\n- Tree" format |

### Entity Types

```typescript
type EntityType =
  | 'Tree'
  | 'Flower'
  | 'House'
  | 'Rock'
  | 'Water'
  | 'Grass'
  | 'Character'
  | 'Unknown'
```

Future types are added via string union extension — no breaking changes.

### DefaultEntityAnalyzer

```typescript
class DefaultEntityAnalyzer implements EntityAnalyzer {
  analyze(_input: string): EntityResult {
    return { entities: [] }
  }
}
```

- Foundation only — no parsing, no AI, no heuristics
- Pure, deterministic, stateless, no side effects
- No dependencies on Planner, Runtime, Provider, Memory, Intent, ToolCalling, or AgentLoop

### RuleBasedEntityAnalyzer

Production V1 entity analyzer using keyword matching. Introduced in WO-S5-007.

**Keyword Mapping:**

| EntityType | Chinese Keywords | English Keywords |
|-----------|-----------------|------------------|
| `Tree` | 树, 树木, 大树, 小树 | tree |
| `Flower` | 花, 鲜花, 花朵 | flower |
| `Grass` | 草, 草地 | grass |
| `House` | 房子, 房屋, 建筑 | house |
| `Rock` | 石头, 岩石 | rock |
| `Water` | 河, 河流, 水, 湖, 海 | river, water, lake, sea |
| `Character` | 人, 人物, 女孩, 男孩, 动物 | person, girl, boy, animal |

**Algorithm:**

```
analyze(input):
  1. Trim — return empty if blank
  2. Normalize — remove punctuation, collapse whitespace, convert to lowercase
  3. Scan — find all keyword matches with position tracking
  4. Sort by position (first occurrence preserved)
  5. Deduplicate — first occurrence of each entity type wins
  6. Return EntityResult
```

### DefaultEntityRenderer

Default entity renderer. Introduced in WO-S5-009.

**Rendering rules:**
- Empty `EntityResult` → empty string `""`
- Single entity → `"Entities:\n- Tree"`
- Multiple entities → `"Entities:\n- Tree\n- Flower\n- House"`
- Preserves `EntityResult` order (no sorting)
- No localization (always uses English entity type names)

**Properties:**
- Pure, stateless, deterministic — no side effects, no state, no I/O
- No dependencies on Planner, Runtime, Provider, Memory, or any other component
- Mirrors `IntentRenderer` architecture

### Dependency Rules

- `EntityAnalyzer` must NOT depend on Planner, Runtime, Provider, Memory, Intent, ToolCalling, AgentLoop, PromptBuilder, or Pipeline
- `Entity` is pure data — no behavior, no methods
- `EntityResult` is pure data — no behavior, no methods
- `DefaultEntityAnalyzer` is a placeholder — zero logic beyond the contract

### Future (Not Yet Implemented)

| Capability | Interface | Mechanism |
|-----------|-----------|-----------|
| ~~RuleBasedEntityAnalyzer~~ | `EntityAnalyzer` | ~~New class, same interface~~ **Done in WO-S5-007** |
| ~~Entity Prompt Integration~~ | `PromptContext` | ~~Inject entityRendered into final prompt~~ **Done in WO-S5-010** |
| LLMEntityAnalyzer | `EntityAnalyzer` | New class, same interface |
| Entity Payload | `Entity` | Add quantity/position fields |

---

## Semantic Layer

The Semantic Layer is the unified semantic representation layer, combining intent analysis and entity recognition into a single abstraction. Introduced in WO-S5-011 (Sprint 5).

### Architecture Status

**Prompt Integrated** — SemanticContext + SemanticContextBuilder + DefaultSemanticContextBuilder + SemanticContextRenderer + DefaultSemanticContextRenderer. SemanticContextRenderer integrated into PromptBuilder pipeline via Phase 0.85 (WO-S5-013). Semantic Context rendered as official Prompt section (WO-S5-014).

### Component Responsibilities

| Component | Type | Purpose |
|-----------|------|---------|
| `SemanticContext` | Interface | Unified semantic representation: `{ intent?, entity? }` |
| `SemanticContextBuilder` | Interface | Contract for building SemanticContext: `build(intent?, entity?): SemanticContext` |
| `DefaultSemanticContextBuilder` | Class | Default implementation — pure composition |
| `SemanticContextRenderer` | Interface | Contract for rendering SemanticContext to string |
| `DefaultSemanticContextRenderer` | Class | Default implementation — human-readable format |

### SemanticContext

```typescript
interface SemanticContext {
  readonly intent?: IntentResult
  readonly entity?: EntityResult
}
```

- Pure immutable data — no methods, no behavior
- readonly — immutable by design
- Optional fields — intent and entity are independently optional
- Extensible — future fields can be added without breaking changes

### DefaultSemanticContextBuilder

```typescript
class DefaultSemanticContextBuilder implements SemanticContextBuilder {
  build(intent?: IntentResult, entity?: EntityResult): SemanticContext {
    return {
      ...(intent !== undefined ? { intent } : {}),
      ...(entity !== undefined ? { entity } : {}),
    }
  }
}
```

- Pure composition — no inference, no modification, no filtering
- Pure, deterministic, stateless, no side effects
- No dependencies on Planner, Runtime, Provider, Memory, Intent, Entity, ToolCalling, or AgentLoop

### Dependency Rules

- `SemanticContext` must NOT depend on Planner, Runtime, Provider, Memory, ToolCalling, AgentLoop, PromptBuilder, or Pipeline
- `SemanticContext` is pure data — no behavior, no methods
- `DefaultSemanticContextBuilder` is a simple pass-through — zero logic beyond the contract

### Future (Not Yet Implemented)

| Capability | Interface | Mechanism |
|-----------|-----------|-----------|
| ~~SemanticContext → PromptAssembly~~ | `BuilderOptions` | ~~Add semanticBuilder to BuilderOptions~~ **Done in WO-S5-012** |
| ~~Semantic Rendering~~ | `SemanticContextRenderer` | ~~Render semantic context as string~~ **Done in WO-S5-013** |
| Semantic → Prompt | `PromptContext` | Render semantic context in prompt |
| SemanticContext → Planner | `Planner` | Pass SemanticContext to Planner |
| Sentiment Analysis | `SemanticContext` | Add sentiment field |

---

## Strategy Layer

The Strategy Layer determines how prompts should be assembled for different semantic contexts. Introduced in WO-S5-015 (Sprint 5).

### Architecture Status

**Weighted Strategy Scoring** — All five IntentTypes have dedicated strategies. DefaultPromptStrategySelector uses highest-score-wins (with StrategyEvaluator). WeightedStrategyEvaluator provides continuous scoring with cross-strategy weighting. StrategySelectionMetadata captures selected strategy + all candidate scores in `metadata.promptAssembly.strategySelection`. StrategyCandidate + StrategySelectionResult + StrategyEvaluator + WeightedStrategyEvaluator + StrategySelectionMetadata enable AI-based dynamic routing. Strategy selection: Phase 0.9, StrategySelectionMetadata: Phase 0.91, StrategyModule resolution: Phase 0.925, StrategyModule rendering: Phase 0.94, strategy rendering: Phase 0.95, assembly strategy resolution: Phase 0.96. Canonical order: Intent → Entity → Semantic → Strategy Module → Strategy → System → User Input → Memory → Reflection → World State → Observations.

### Component Responsibilities

| Component | Type | Purpose |
|-----------|------|---------|
| `PromptStrategy` | Interface | Contract for context-aware strategy selection: `name` + `applies(context)` |
| `DefaultPromptStrategy` | Class | Always-applies baseline strategy — `applies()` always returns `true` |
| `CreateStrategy` | Class | Creation-oriented strategy — `applies()` returns `true` when SemanticContext contains Create intent |
| `QueryStrategy` | Class | Query-oriented strategy — `applies()` returns `true` when SemanticContext contains Query intent |
| `ModifyStrategy` | Class | Modification-oriented strategy — `applies()` returns `true` when SemanticContext contains Move or Modify intent |
| `DeleteStrategy` | Class | Deletion-oriented strategy — `applies()` returns `true` when SemanticContext contains Delete intent |
| `PromptStrategySelector` | Interface | Contract for selecting a strategy from an ordered list |
| `DefaultPromptStrategySelector` | Class | Score-based selection with StrategyEvaluator + DefaultPromptStrategy fallback |
| `PromptStrategyRenderer` | Interface | Contract for rendering PromptStrategy to string: `render(strategy)` |
| `DefaultPromptStrategyRenderer` | Class | Default rendering — `"Prompt Strategy:\\n\\n- {name}"` |
| `StrategyModule` | Interface | Strategy-specific PromptModule — extends PromptModule for guideline content |
| `CreateStrategyModule` | Class | Creation guidelines — "Prefer creating new entities" |
| `QueryStrategyModule` | Class | Query guidelines — "Focus on retrieving information" |
| `ModifyStrategyModule` | Class | Modification guidelines — "Preserve entity identity" |
| `StrategyEvaluator` | Interface | Contract for scoring a strategy against a SemanticContext: `evaluate(strategy, context): number` |
| `DefaultStrategyEvaluator` | Class | Default implementation — applies() → 100/0 scoring |
| `WeightedStrategyEvaluator` | Class | Weighted implementation — continuous scoring with cross-strategy weighting |
| `StrategyCandidate` | Interface | Strategy paired with its evaluation score |
| `StrategySelectionResult` | Interface | Selected strategy + all candidates with scores (object-graph) |
| `StrategySelectionMetadata` | Interface | Selected strategy name + candidate scores (metadata-friendly, serializable) |
| `DeleteStrategyModule` | Class | Deletion guidelines — "Confirm target existence" |
| `PromptAssemblyOptimizer` | Interface | Contract for optimizing a PromptAssemblyPlan: `optimize(plan)` |
| `DefaultPromptAssemblyOptimizer` | Class | Identity implementation — returns the plan unchanged |
| `PromptAssemblyPlanDiff` | Interface | Diff result: added, removed, changed sections |
| `PromptAssemblyPlanDiffer` | Interface | Contract for diffing two plans: `diff(before, after)` |
| `DefaultPromptAssemblyPlanDiffer` | Class | Default implementation — detects added/removed/changed |
| `PromptAssemblySnapshot` | Interface | Unified diagnostics snapshot: strategy, plan, diff, rendered |
| `PromptAssemblySnapshotBuilder` | Interface | Contract for building a snapshot: `build(metadata)` |
| `DefaultPromptAssemblySnapshotBuilder` | Class | Default implementation — reads known fields, ignores unknown |

### PromptStrategy

```typescript
interface PromptStrategy {
  readonly name: string
  applies(context: SemanticContext): boolean
}
```

- `name` — Unique identifier for the strategy
- `applies()` — Pure predicate, returns `boolean`
- No methods beyond the contract
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### DefaultPromptStrategy

```typescript
class DefaultPromptStrategy implements PromptStrategy {
  readonly name = 'default'
  applies(_context: SemanticContext): boolean {
    return true
  }
}
```

- Always applies — returns `true` for any `SemanticContext`
- Preserves existing behavior as the baseline strategy
- Pure, stateless, deterministic — no side effects

### CreateStrategy

```typescript
class CreateStrategy implements PromptStrategy {
  readonly name = 'create'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Create') ?? false
  }
}
```

- Applies when SemanticContext contains a `Create` intent
- First business-specific strategy — demonstrates strategy selection pattern
- Leverages existing intent analysis pipeline (not raw text matching)
- Pure, stateless, deterministic — no side effects
- Selected before DefaultPromptStrategy (first-match wins in DefaultPromptStrategySelector)
- When CreateStrategy does not match, DefaultPromptStrategy remains fallback

### QueryStrategy

```typescript
class QueryStrategy implements PromptStrategy {
  readonly name = 'query'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Query') ?? false
  }
}
```

- Applies when SemanticContext contains a `Query` intent
- Second business-specific strategy — follows the same pattern as CreateStrategy
- Leverages existing intent analysis pipeline (not raw text matching)
- Pure, stateless, deterministic — no side effects
- Coexists with CreateStrategy — both independent, neither affects the other
- Selected before DefaultPromptStrategy (first-match wins in DefaultPromptStrategySelector)
- When QueryStrategy does not match, DefaultPromptStrategy remains fallback

### ModifyStrategy

```typescript
class ModifyStrategy implements PromptStrategy {
  readonly name = 'modify'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Move' || i.type === 'Modify') ?? false
  }
}
```

- Applies when SemanticContext contains a `Move` OR `Modify` intent
- Combines Move and Modify into a single strategy — both are transformation-oriented
- Third business-specific strategy — follows the same pattern as CreateStrategy and QueryStrategy
- Leverages existing intent analysis pipeline (not raw text matching)
- Pure, stateless, deterministic — no side effects
- Coexists with CreateStrategy and QueryStrategy — all independent
- When ModifyStrategy does not match, DefaultPromptStrategy remains fallback

### DeleteStrategy

```typescript
class DeleteStrategy implements PromptStrategy {
  readonly name = 'delete'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Delete') ?? false
  }
}
```

- Applies when SemanticContext contains a `Delete` intent
- Fourth business-specific strategy — completes the intent → strategy mapping
- Leverages existing intent analysis pipeline (not raw text matching)
- Pure, stateless, deterministic — no side effects
- When DeleteStrategy does not match, DefaultPromptStrategy remains fallback

### Strategy Selection Precedence

When strategies are ordered `[CreateStrategy, QueryStrategy, ModifyStrategy, DeleteStrategy, DefaultPromptStrategy]`:

| Input | Intent | Selected Strategy |
|-------|--------|-------------------|
| 创建一棵树 | Create | CreateStrategy |
| 列出所有树 | Query | QueryStrategy |
| 移动树到左边 | Move | ModifyStrategy |
| 修改房子颜色 | Modify | ModifyStrategy |
| 删除树 | Delete | DeleteStrategy |
| (no match) | — | DefaultPromptStrategy |

### DefaultPromptStrategySelector

```typescript
class DefaultPromptStrategySelector implements PromptStrategySelector {
  constructor(
    private readonly evaluator: StrategyEvaluator =
      new DefaultStrategyEvaluator()
  ) {}

  select(strategies, context): PromptStrategy {
    // Evaluates ALL strategies using StrategyEvaluator
    // Selects candidate with highest score
    // Ties broken by array order (first occurrence wins)
    // Falls back to DefaultPromptStrategy if all scores are 0
  }
}
```

- **Highest-score wins** — Evaluates all strategies, selects highest score
- **Default fallback** — Returns `DefaultPromptStrategy` when all scores are 0
- **Tie breaking** — First occurrence wins when scores are equal
- **Pluggable evaluator** — Accepts optional `StrategyEvaluator` (defaults to `DefaultStrategyEvaluator`)
- Pure, stateless, deterministic, complete (never returns `null` or `undefined`)
- Backward compatible — with `DefaultStrategyEvaluator`, identical results to first-match-wins

### WeightedStrategyEvaluator

```typescript
class WeightedStrategyEvaluator implements StrategyEvaluator {
  evaluate(strategy: PromptStrategy, context: SemanticContext): number
}
```

Continuous scoring implementation with cross-strategy weighting.

**Score Table (V1):**

| Intent  | Create | Query | Modify | Delete |
|---------|--------|-------|--------|--------|
| Create  | 100    | 20    | 10     | 0      |
| Query   | 20     | 100   | 10     | 0      |
| Modify  | 10     | 10    | 100    | 20     |
| Move    | 10     | 10    | 100    | 20     |
| Delete  | 0      | 0     | 20     | 100    |
| Unknown | 0      | 0     | 0      | 0      |

- **Continuous scoring** — non-primary strategies get partial scores (not just 0)
- **Cross-strategy weighting** — Create scores 20 for Query intent, etc.
- **Unknown = 0** — strategies not in the table always score 0
- **Move → Modify** — Move intent maps to Modify scoring (same semantic category)
- Pure, stateless, deterministic — no side effects
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### DefaultPromptStrategyRenderer

```typescript
class DefaultPromptStrategyRenderer implements PromptStrategyRenderer {
  render(strategy: PromptStrategy): string {
    if (strategy === undefined || strategy === null) return ''
    const name = strategy.name
    if (name === undefined || name === null || name.trim().length === 0) return ''
    return `Prompt Strategy:\n\n- ${name}`
  }
}
```

- Default strategy → `"Prompt Strategy:\n\n- default"`
- Custom strategy → `"Prompt Strategy:\n\n- {name}"`
- Empty/blank/null/undefined → `""`
- Pure, stateless, deterministic — no side effects

### Phase 0.9: StrategyEvaluator-Driven Selection (v0.74+)

```
Phase 0.9:   StrategyEvaluator.evaluate() for each strategy → scores
    ↓
    ↓         Select highest-scoring strategy (tie-break by order)
    ↓         Fallback to DefaultPromptStrategy when all scores ≤ 0
    ↓             → selectedStrategy
    ↓             → StrategySelectionMetadata { selected, candidates[] }
    ↓             → metadata.promptAssembly.strategySelection
Phase 0.915: StrategySelectionRenderer.render(metadata) → strategySelectionRendered
    ↓             → metadata.promptAssembly.strategySelectionRendered
Phase 0.925: StrategyModule resolution — find module where module.name === strategy.name
    ↓             module.build(context) → strategyModule (string)
    ↓             → metadata.promptAssembly.strategyModule
Phase 0.94:  StrategyModuleRenderer.render(strategyModule) → strategyModuleRendered
    ↓             → metadata.promptAssembly.strategyModuleRendered
Phase 0.95:  PromptStrategyRenderer.render(selectedStrategy) → strategyRendered
    ↓             → metadata.promptAssembly.strategyRendered
Phase 0.955: PromptAssemblyPlanner.buildPlan(strategyName, promptContext keys)
    ↓             → PromptAssemblyPlan { priorities[] }
    ↓             → metadata.promptAssembly.plan
Phase 0.956: PromptAssemblyOptimizer.optimize(plan)
    ↓             → optimizedPlan (identity passthrough by default)
    ↓             → metadata.promptAssembly.optimizedPlan
    ↓             → downstream phases use optimizedPlan ?? plan
Phase 0.9565: PromptAssemblyPlanDiffer.diff(plan, optimizedPlan)
    ↓             → planDiff (added, removed, changed)
    ↓             → metadata.promptAssembly.planDiff
Phase 0.957: PromptAssemblyPlanRenderer.render(optimizedPlan ?? plan)
    ↓             → metadata.promptAssembly.planRendered
Phase 0.958: PromptAssemblySnapshotBuilder.build(metadata)
    ↓             → metadata.promptAssembly.snapshot
Phase 0.959: PromptInspectorBuilder.build(snapshot)
    ↓             → metadata.promptAssembly.inspector
Phase 0.9595: PromptInspectorRenderer.render(inspector)
    ↓             → metadata.promptAssembly.inspectorRendered
Phase 0.9597: PromptInspectorExporter.export(inspector)
    ↓             → metadata.promptAssembly.inspectorExported
Phase 0.9598: PromptAssemblyTraceBuilder.build(metadata)
    ↓             → metadata.promptAssembly.trace
Phase 0.95985: PromptAssemblyTraceDiffer.diff(trace, trace)  — added/removed/changed fields
    ↓             → traceDiff
    ↓             → metadata.promptAssembly.traceDiff
Phase 0.9599:  PromptAssemblyTraceRenderer.render(trace)  — human-readable rendering
    ↓             → traceRendered
    ↓             → metadata.promptAssembly.traceRendered
Phase 0.95995: PromptAssemblyTraceExporter.export(trace)  — serialized JSON export
    ↓             → traceExported
    ↓             → metadata.promptAssembly.traceExported
Phase 0.95996: PromptAssemblyTimelineBuilder.build([trace])  — single-entry timeline
    ↓             → timeline
    ↓             → metadata.promptAssembly.timeline
Phase 0.96:  PromptAssemblyStrategyResolver.resolve(selectedStrategy.name) → assemblyStrategy
    ↓             → metadata.promptAssembly.promptAssemblyStrategy { strategyName }
    ↓             → apply() reorders renderContext sections by priority
                 (CreatePromptAssemblyStrategy: userInput > worldState > strategyModuleRendered > strategyRendered)
Phase 1:    MemoryRanking.rank()
```

Since WO-S5-041 (v0.76), Phase 0.955 invokes PromptAssemblyPlanner.buildPlan() with the current strategy name and available section keys, storing the resulting PromptAssemblyPlan in `metadata.promptAssembly.plan`. Metadata only — no prompt behavior changes. The planner is consumed via the optional `promptAssemblyPlanner` field in BuilderOptions.

Since WO-S5-042 (v0.77), Phase 0.96 checks whether the resolved strategy implements `PriorityAwarePromptAssemblyStrategy`. When both a plan and a priority-aware strategy exist, the builder uses `applyPlan()` instead of `apply()`, enabling priority-based section ordering. The `planApplied` boolean in metadata indicates whether priority-aware ordering was active.

Since WO-S5-043 (v0.78), the `StrategyAwarePromptAssemblyPlanner` is available as a drop-in replacement for `DefaultPromptAssemblyPlanner`. It produces distinct priority plans per strategy (create/query/modify/delete), enabling differentiated section ordering based on semantic intent. The default strategy still assigns all sections priority 100.

Since WO-S5-044 (v0.79), `PromptAssemblyPlanRenderer` and `DefaultPromptAssemblyPlanRenderer` provide human-readable rendering of PromptAssemblyPlan. The rendered output uses priority-descending ordering with stable tie-breaking. Foundation only — no integration with PromptBuilder yet.

Since WO-S5-045 (v0.80), Phase 0.957 invokes PromptAssemblyPlanRenderer.render() when both a plan and a renderer are configured, storing the result in `metadata.promptAssembly.planRendered`. Metadata only — no prompt injection.

Since WO-S5-046 (v0.81), `PromptAssemblyOptimizer` and `DefaultPromptAssemblyOptimizer` provide an identity optimization layer between `PromptAssemblyPlan` and `PriorityAwarePromptAssemblyStrategy`. The optimizer returns the plan unchanged — foundation only.

Since WO-S5-047 (v0.82), Phase 0.956 integrates the optimizer into `DefaultPromptBuilder`. When both a plan and an optimizer exist, the optimizer transforms the plan and the result (`optimizedPlan`) is used for all downstream phases (renderer and assembly strategy). The identity optimizer (`DefaultPromptAssemblyOptimizer`) preserves all existing behavior — no prompt output changes. The `optimizedPlan` is stored in `metadata.promptAssembly.optimizedPlan` only when the optimizer exists.

Since WO-S5-048 (v0.83), `PromptAssemblyPlanDiff`, `PromptAssemblyPlanDiffer`, and `DefaultPromptAssemblyPlanDiffer` provide a structured diff model for inspecting changes between two plans. The differ detects added sections, removed sections, and priority changes. Foundation only — not yet consumed by PromptBuilder. This enables future diagnostics and optimization verification.

Since WO-S5-049 (v0.84), Phase 0.9565 integrates the differ into `DefaultPromptBuilder`. When plan, optimizedPlan, and differ all exist, the differ produces a `planDiff` stored in `metadata.promptAssembly.planDiff`. The diff shows added/removed sections and priority changes. Metadata only — no prompt injection. With the identity optimizer, the diff is always empty (identical before/after plans).

Since WO-S5-050 (v0.85), `PromptAssemblySnapshot`, `PromptAssemblySnapshotBuilder`, and `DefaultPromptAssemblySnapshotBuilder` provide a unified snapshot structure consolidating all prompt assembly diagnostics (strategy, strategySelection, strategyRendered, strategyModule, strategyModuleRendered, plan, optimizedPlan, planDiff, planRendered). The builder reads known metadata fields and ignores unknown ones. Foundation only — not yet consumed by PromptBuilder.

Since WO-S5-051 (v0.86), Phase 0.958 integrates `PromptAssemblySnapshotBuilder` into `DefaultPromptBuilder`. When configured, it collects the individual promptAssembly metadata fields, passes them to the builder, and stores the resulting `PromptAssemblySnapshot` at `metadata.promptAssembly.snapshot`. The snapshot is additive — it coexists with all existing fields. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-052 (v0.87), `PromptInspector`, `PromptInspectorSection`, `PromptInspectorBuilder`, and `DefaultPromptInspectorBuilder` provide a domain model for converting `PromptAssemblySnapshot` into a human-readable section-based format. The inspector maps 7 snapshot fields to labeled sections with a consistent ordering (Rendered Strategy, Strategy Selection, Strategy Module, Prompt Plan, Optimized Plan, Plan Diff, Rendered Plan). Foundation only — not yet consumed by PromptBuilder.

Since WO-S5-053 (v0.87), Phase 0.959 integrates `PromptInspectorBuilder` into `DefaultPromptBuilder`. When both a snapshot (from Phase 0.958) and an inspector builder are configured, the builder converts the snapshot into a `PromptInspector` stored at `metadata.promptAssembly.inspector`. The inspector is additive — it coexists with all existing fields including snapshot. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-054 (v0.88), `PromptInspectorRenderer` and `DefaultPromptInspectorRenderer` provide a human-readable text rendering of `PromptInspector`. The renderer produces a structured report with an optional strategy block and a bullet list of section titles. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-055 (v0.89), Phase 0.9595 integrates `PromptInspectorRenderer` into `DefaultPromptBuilder`. When both an inspector (from Phase 0.959) and a renderer are configured, the renderer converts the inspector into a human-readable string stored at `metadata.promptAssembly.inspectorRendered`. The rendered output is additive — it coexists with all existing fields including inspector, snapshot, plan, optimizedPlan, planDiff, and planRendered. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-056 (v0.90), `PromptInspectorExporter` and `DefaultPromptInspectorExporter` provide a JSON export of `PromptInspector`. The exporter uses `JSON.stringify(inspector, null, 2)` to produce a pretty-printed JSON string, preserving the strategy and sections structure. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-057 (v0.91), Phase 0.9597 integrates `PromptInspectorExporter` into `DefaultPromptBuilder`. When both an inspector (from Phase 0.959) and an exporter are configured, the exporter converts the inspector into a stable external representation stored at `metadata.promptAssembly.inspectorExported`. The exported output is additive — it coexists with all existing fields including inspector, inspectorRendered, snapshot, plan, optimizedPlan, planDiff, and planRendered. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-058 (v0.92), `PromptAssemblyTrace`, `PromptAssemblyTraceBuilder`, and `DefaultPromptAssemblyTraceBuilder` provide a unified trace domain model aggregating all prompt assembly diagnostic artifacts (strategy, strategySelection, plan, optimizedPlan, planDiff, snapshot, inspector, inspectorRendered, inspectorExported) into a single structure. The builder reads known metadata fields from `metadata.promptAssembly` and silently ignores unknown fields. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-059 (v0.93), Phase 0.9598 integrates `PromptAssemblyTraceBuilder` into `DefaultPromptBuilder`. When configured, the trace builder receives the full promptAssembly metadata object and produces a `PromptAssemblyTrace` stored at `metadata.promptAssembly.trace`. The trace is additive — it coexists with all existing fields including snapshot, inspector, inspectorRendered, inspectorExported, plan, optimizedPlan, planDiff, and planRendered. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-060 (v0.94), `PromptAssemblyTraceDiff`, `PromptAssemblyTraceDiffer`, and `DefaultPromptAssemblyTraceDiffer` provide a unified diff model for comparing two `PromptAssemblyTrace` instances. The differ examines 9 known trace fields (strategy, strategySelection, plan, optimizedPlan, planDiff, snapshot, inspector, inspectorRendered, inspectorExported) and classifies each as added, removed, or changed based on presence and value equality. The implementation is pure, stateless, deterministic, and produces frozen (Object.freeze'd) results. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-061 (v0.95), Phase 0.95985 integrates `PromptAssemblyTraceDiffer` into `DefaultPromptBuilder`. When configured, the differ receives the current trace and produces a `PromptAssemblyTraceDiff` stored at `metadata.promptAssembly.traceDiff`. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-062 (v0.96), `PromptAssemblyTraceRenderer` and `DefaultPromptAssemblyTraceRenderer` provide a human-readable rendering of `PromptAssemblyTrace`. The renderer produces a formatted string with each trace field labeled and rendered. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-063 (v0.97), Phase 0.9599 integrates `PromptAssemblyTraceRenderer` into `DefaultPromptBuilder`. When configured, the renderer receives the current trace and produces a human-readable string stored at `metadata.promptAssembly.traceRendered`. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-064 (v0.98), `PromptAssemblyTraceExporter` and `DefaultPromptAssemblyTraceExporter` provide a JSON export of `PromptAssemblyTrace`. The exporter uses `JSON.stringify(trace, null, 2)` to produce a pretty-printed JSON string, preserving the full trace structure. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-065 (v0.99), Phase 0.95995 integrates `PromptAssemblyTraceExporter` into `DefaultPromptBuilder`. When configured, the exporter receives the current trace and produces a serialized JSON string stored at `metadata.promptAssembly.traceExported`. Metadata only — no prompt injection, no behavioral changes.

Since WO-S5-066 (v1.00), `PromptAssemblyTimelineEntry`, `PromptAssemblyTimeline`, `PromptAssemblyTimelineBuilder`, and `DefaultPromptAssemblyTimelineBuilder` provide a timeline model for representing multiple `PromptAssemblyTrace` entries across builds. The timeline preserves insertion order with zero-based sequential indices. The implementation is pure, stateless, deterministic, and produces frozen (Object.freeze'd) results. Foundation only — no consumption, no builder changes, no metadata changes.

Since WO-S5-067 (v1.01), Phase 0.95996 integrates `PromptAssemblyTimelineBuilder` into `DefaultPromptBuilder`. When configured, the timeline builder receives the current trace wrapped in a single-element array and produces a `PromptAssemblyTimeline` stored at `metadata.promptAssembly.timeline`. Metadata only — no prompt injection, no behavioral changes.

### Dependency Rules

- `PromptStrategy` is independent — no dependencies on any existing component
- `DefaultPromptStrategy` depends only on `PromptStrategy` and `SemanticContext`
- `PromptStrategySelector` depends only on `PromptStrategy` and `SemanticContext`
- `DefaultPromptStrategySelector` depends only on `PromptStrategySelector`, `PromptStrategy`, `DefaultPromptStrategy`, and `SemanticContext`
- `StrategyModule` depends only on `PromptModule` — marker extension
- `CreateStrategyModule`, `QueryStrategyModule`, `ModifyStrategyModule`, `DeleteStrategyModule` depend only on `StrategyModule`, `PipelineContext`, and `PromptContext`
- `StrategySelectionMetadata` is independent — no dependencies on any existing component
- `StrategySelectionRenderer` depends only on `StrategySelectionMetadata`
- `DefaultStrategySelectionRenderer` depends only on `StrategySelectionRenderer` and `StrategySelectionMetadata`
- `PromptSectionPriority` is independent — no dependencies on any existing component
- `PromptAssemblyPlan` depends only on `PromptSectionPriority`
- `PromptAssemblyPlanner` depends only on `PromptAssemblyPlan`
- `DefaultPromptAssemblyPlanner` depends only on `PromptAssemblyPlanner`, `PromptAssemblyPlan`, and `PromptSectionPriority`
- `PromptAssemblyStrategy` is independent — no dependencies on any existing component
- `DefaultPromptAssemblyStrategy` depends only on `PromptAssemblyStrategy`
- `CreatePromptAssemblyStrategy` depends only on `PromptAssemblyStrategy`
- `QueryPromptAssemblyStrategy` depends only on `PromptAssemblyStrategy`
- `ModifyPromptAssemblyStrategy` depends only on `PromptAssemblyStrategy`
- `DeletePromptAssemblyStrategy` depends only on `PromptAssemblyStrategy`
- `PromptAssemblyStrategyResolver` depends only on `PromptAssemblyStrategy`
- `DefaultPromptAssemblyStrategyResolver` depends only on `PromptAssemblyStrategyResolver`, `PromptAssemblyStrategy`, `DefaultPromptAssemblyStrategy`, `CreatePromptAssemblyStrategy`, `QueryPromptAssemblyStrategy`, `ModifyPromptAssemblyStrategy`, and `DeletePromptAssemblyStrategy`
- `PromptAssemblyOptimizer` depends only on `PromptAssemblyPlan`
- `DefaultPromptAssemblyOptimizer` depends only on `PromptAssemblyOptimizer` and `PromptAssemblyPlan`
- `PromptAssemblyPlanDiff` is independent — no dependencies on any existing component
- `PromptAssemblyPlanDiffer` depends only on `PromptAssemblyPlan` and `PromptAssemblyPlanDiff`
- `DefaultPromptAssemblyPlanDiffer` depends only on `PromptAssemblyPlanDiffer`, `PromptAssemblyPlan`, and `PromptAssemblyPlanDiff`
- `PromptAssemblySnapshot` depends only on `StrategySelectionMetadata`, `PromptAssemblyPlan`, and `PromptAssemblyPlanDiff`
- `PromptAssemblySnapshotBuilder` depends only on `PromptAssemblySnapshot`
- `DefaultPromptAssemblySnapshotBuilder` depends only on `PromptAssemblySnapshotBuilder`, `PromptAssemblySnapshot`, `StrategySelectionMetadata`, `PromptAssemblyPlan`, and `PromptAssemblyPlanDiff`
- `PromptInspector` depends only on `PromptInspectorSection`
- `PromptInspectorSection` is independent — no dependencies on any existing component
- `PromptInspectorBuilder` depends only on `PromptAssemblySnapshot` and `PromptInspector`
- `DefaultPromptInspectorBuilder` depends only on `PromptInspectorBuilder`, `PromptInspector`, `PromptInspectorSection`, and `PromptAssemblySnapshot`
- `PromptInspectorRenderer` depends only on `PromptInspector`
- `DefaultPromptInspectorRenderer` depends only on `PromptInspectorRenderer` and `PromptInspector`
- `PromptInspectorExporter` depends only on `PromptInspector`
- `DefaultPromptInspectorExporter` depends only on `PromptInspectorExporter` and `PromptInspector`
- `PromptAssemblyTrace` is independent — no dependencies on any existing component
- `PromptAssemblyTraceBuilder` depends only on `PromptAssemblyTrace`
- `DefaultPromptAssemblyTraceBuilder` depends only on `PromptAssemblyTraceBuilder` and `PromptAssemblyTrace`
- `PromptAssemblyTraceDiff` is independent — no dependencies on any existing component
- `PromptAssemblyTraceDiffer` depends only on `PromptAssemblyTrace` and `PromptAssemblyTraceDiff`
- `DefaultPromptAssemblyTraceDiffer` depends only on `PromptAssemblyTrace`, `PromptAssemblyTraceDiff`, and `PromptAssemblyTraceDiffer`
- `PromptAssemblyTraceRenderer` depends only on `PromptAssemblyTrace`
- `DefaultPromptAssemblyTraceRenderer` depends only on `PromptAssemblyTraceRenderer` and `PromptAssemblyTrace`
- `PromptAssemblyTraceExporter` depends only on `PromptAssemblyTrace`
- `DefaultPromptAssemblyTraceExporter` depends only on `PromptAssemblyTraceExporter` and `PromptAssemblyTrace`
- `PromptAssemblyTimelineEntry` is independent — no dependencies on any existing component
- `PromptAssemblyTimeline` depends only on `PromptAssemblyTimelineEntry`
- `PromptAssemblyTimelineBuilder` depends only on `PromptAssemblyTrace` and `PromptAssemblyTimeline`
- `DefaultPromptAssemblyTimelineBuilder` depends only on `PromptAssemblyTimelineBuilder`, `PromptAssemblyTrace`, and `PromptAssemblyTimeline`
- None of the strategy components depend on Planner, Runtime, Provider, Memory, ToolCalling, AgentLoop, PromptBuilder, or Pipeline

### Future (Not Yet Implemented)

| Capability | Interface | Mechanism |
|-----------|-----------|-----------|
| ~~Strategy → Builder~~ | `BuilderOptions` | ~~Add strategySelector to BuilderOptions~~ **Done in WO-S5-016** |
| ~~Strategy Renderer~~ | `BuilderOptions` | ~~Add strategyRenderer to BuilderOptions~~ **Done in WO-S5-017** |
| ~~Strategy-Based Prompt Assembly~~ | `PromptBuilder` | ~~Use selected strategy to guide assembly~~ **Deferred** |
| ~~Create Strategy~~ | `PromptStrategy` | ~~New class, same interface~~ **Done in WO-S5-019** |
| ~~Query Strategy~~ | `PromptStrategy` | ~~New class for query intent~~ **Done in WO-S5-020** |
| ~~Modify Strategy~~ | `PromptStrategy` | ~~New class for move+modify intent~~ **Done in WO-S5-021** |
| ~~Delete Strategy~~ | `PromptStrategy` | ~~New class for delete intent~~ **Done in WO-S5-022** |
| ~~StrategyModule Foundation~~ | `StrategyModule` | ~~Strategy-specific PromptModule abstraction~~ **Done in WO-S5-023** |
| ~~Strategy Module Consumption~~ | `PromptBuilder` | ~~Wire StrategyModule to PromptBuilder based on selected strategy~~ **Done in WO-S5-024** |
| ~~Strategy Module Rendering Foundation~~ | `StrategyModuleRenderer` | ~~StrategyModule rendering abstraction~~ **Done in WO-S5-025** |
| ~~Strategy Module → Prompt~~ | `PromptContext` | ~~Inject strategyModuleRendered text into final prompt string~~ **Done in WO-S5-026** |
| ~~Strategy Selection Result~~ | `BuilderOptions` | ~~Add strategyEvaluator to capture metadata~~ **Done in WO-S5-029** |
| ~~Weighted Strategy Evaluator~~ | `StrategyEvaluator` | ~~Continuous scoring with cross-strategy weighting~~ **Done in WO-S5-030** |
| ~~Prompt Assembly Strategy Foundation~~ | `PromptAssemblyStrategy` | ~~Strategy-aware prompt assembly abstraction~~ **Done in WO-S5-031** |
| ~~Prompt Assembly Strategy Resolver~~ | `PromptAssemblyStrategyResolver` | ~~Resolve assembly strategy by name~~ **Done in WO-S5-031** |
| ~~Prompt Assembly Strategy Consumption~~ | `BuilderOptions` | ~~Add promptAssemblyStrategyResolver to BuilderOptions~~ **Done in WO-S5-032** |
| ~~Create Prompt Assembly Strategy~~ | `CreatePromptAssemblyStrategy` | ~~First business-specific assembly strategy~~ **Done in WO-S5-033** |
| ~~Create Prompt Assembly Consumption~~ | `DefaultPromptBuilder` | ~~Apply assembly strategy to reorder sections~~ **Done in WO-S5-034** |
| ~~Query Prompt Assembly Strategy~~ | `QueryPromptAssemblyStrategy` | ~~Second business-specific assembly strategy~~ **Done in WO-S5-035** |
| ~~Modify Prompt Assembly Strategy~~ | `ModifyPromptAssemblyStrategy` | ~~Third business-specific assembly strategy~~ **Done in WO-S5-036** |
| ~~Delete Prompt Assembly Strategy~~ | `DeletePromptAssemblyStrategy` | ~~Fourth business-specific assembly strategy~~ **Done in WO-S5-037** |
| ~~Strategy Selection Rendering Foundation~~ | `StrategySelectionRenderer` | ~~Render strategy selection metadata~~ **Done in WO-S5-038** |
| ~~Section Priority Foundation~~ | `PromptAssemblyPlanner` | ~~Plan section priorities for assembly~~ **Done in WO-S5-040** |
| ~~Prompt Assembly Optimizer Foundation~~ | `PromptAssemblyOptimizer` | ~~Identity optimization passthrough~~ **Done in WO-S5-046** |
| ~~Prompt Assembly Plan Diff Foundation~~ | `PromptAssemblyPlanDiffer` | ~~Structured diff of plan changes~~ **Done in WO-S5-048** |
| ~~Prompt Assembly Snapshot Foundation~~ | `PromptAssemblySnapshot` | ~~Unified diagnostics snapshot~~ **Done in WO-S5-050** |
| ~~Snapshot Consumption~~ | `BuilderOptions` | ~~Wire snapshot builder into PromptBuilder pipeline~~ **Done in WO-S5-051** |
| ~~Prompt Inspector Foundation~~ | `PromptInspector` | ~~Domain model for snapshot inspection~~ **Done in WO-S5-052** |
| ~~Prompt Inspector Consumption~~ | `BuilderOptions` | ~~Wire inspector builder into PromptBuilder pipeline~~ **Done in WO-S5-053** |
| ~~Prompt Inspector Rendering Foundation~~ | `PromptInspectorRenderer` | ~~Human-readable inspector report~~ **Done in WO-S5-054** |
| ~~Prompt Inspector Rendering Consumption~~ | `BuilderOptions` | ~~Wire renderer into PromptBuilder pipeline~~ **Done in WO-S5-055** |
| ~~Prompt Inspector Export Foundation~~ | `PromptInspectorExporter` | ~~JSON export of inspector~~ **Done in WO-S5-056** |
| ~~Prompt Inspector Export Consumption~~ | `BuilderOptions` | ~~Wire exporter into PromptBuilder pipeline~~ **Done in WO-S5-057** |
| ~~Prompt Assembly Trace Foundation~~ | `PromptAssemblyTrace` | ~~Unified trace domain model for prompt assembly lifecycle~~ **Done in WO-S5-058** |
| ~~Prompt Assembly Trace Consumption~~ | `BuilderOptions` | ~~Wire trace builder into PromptBuilder pipeline~~ **Done in WO-S5-059** |
| ~~Prompt Assembly Trace Diff Foundation~~ | `PromptAssemblyTraceDiff` | ~~Unified diff model for trace comparison~~ **Done in WO-S5-060** |
| ~~Prompt Assembly Trace Diff Consumption~~ | `BuilderOptions` | ~~Wire trace differ into PromptBuilder pipeline~~ **Done in WO-S5-061** |
| ~~Prompt Assembly Trace Rendering Foundation~~ | `PromptAssemblyTraceRenderer` | ~~Human-readable trace rendering~~ **Done in WO-S5-062** |
| ~~Prompt Assembly Trace Renderer Consumption~~ | `BuilderOptions` | ~~Wire trace renderer into PromptBuilder pipeline~~ **Done in WO-S5-063** |
| ~~Prompt Assembly Trace Export Foundation~~ | `PromptAssemblyTraceExporter` | ~~JSON export of trace~~ **Done in WO-S5-064** |
| ~~Prompt Assembly Trace Export Consumption~~ | `BuilderOptions` | ~~Wire trace exporter into PromptBuilder pipeline~~ **Done in WO-S5-065** |
| ~~Prompt Assembly Timeline Foundation~~ | `PromptAssemblyTimeline` | ~~Timeline model for multi-build trace history~~ **Done in WO-S5-066** |
| ~~Prompt Assembly Timeline Consumption~~ | `BuilderOptions` | ~~Wire timeline builder into PromptBuilder pipeline~~ **Done in WO-S5-067** |
| Multi-Strategy Pipeline | `PromptStrategySelector` | Strategy selection with context routing |
| Strategy Configuration | `PromptStrategy` | Add priority, config fields |
| Trimming Optimizer | `PromptAssemblyOptimizer` | Remove low-priority sections |
| Compressing Optimizer | `PromptAssemblyOptimizer` | Replace sections with compressed variants |
| Optimizer Consumption | `BuilderOptions` | Wire optimizer into PromptBuilder pipeline |
| ~~Diff Consumption~~ | `BuilderOptions` | ~~Wire differ into PromptBuilder pipeline~~ **Done in WO-S5-049** |
| ~~Snapshot Consumption~~ | `BuilderOptions` | ~~Wire snapshot builder into PromptBuilder pipeline~~ **Done in WO-S5-051** |

---

## High-Level Architecture

```
User Natural Language
    ↓
Pipeline.execute(PipelineContext)
    ↓
PromptBuilder.build(context)         ← Prompt Assembly Orchestrator
    ├── ObservationPromptModule         ← reads context.metadata.observations
    ├── SystemPromptModule              ← system instructions, action schema
    ├── UserInputModule                 ← context.input
    ├── MemoryPromptModule              ← conversation history from Memory
    ├── WorldStatePromptModule          ← context.worldState
    └── ReflectionPromptModule          ← reads context.metadata.reflectionResults
    ↓
PromptContext (structured intermediate)
    ↓
IntentAnalyzer.analyze()              ← pure intent analysis (WO-S5-003)
    ↓
IntentRenderer.render()               ← pure intent rendering (WO-S5-004)
    ↓
EntityAnalyzer.analyze()               ← pure entity analysis (WO-S5-008)
    ↓
EntityRenderer.render()                ← pure entity rendering (WO-S5-009)
    ↓
SemanticContextBuilder.build()         ← pure composition (WO-S5-012)
    ↓
SemanticContextRenderer.render()       ← pure rendering (WO-S5-013)
    ↓
PromptStrategySelector.select()        ← context-aware strategy selection (WO-S5-015)
    ↓
PromptStrategyRenderer.render()        ← strategy rendering (WO-S5-017)
    ↓
MemoryRanking.rank()                 ← determines section priority (pure measurement)
    ↓
PromptBudget.calculate()              ← measures section sizes (pure measurement)
    ↓
ProviderBudget.getBudget()            ← looks up provider/model capacity (pure lookup)
    ↓
PromptSelection.select()              ← decides which sections to preserve (consumes ranking + budget + providerBudget)
    ↓
PromptCompression.compress()          ← cleans/strips PromptContext before render
    ↓
PromptRenderer.render()              ← converts PromptContext to string (includes intentRendered section)
    ↓
AIRequest { prompt, metadata }       ← metadata includes intent, ranking, budget, providerBudget & selection results
    ↓
AgentLoop.execute(request, planner)  ← wraps Planner.plan() with iteration control
    ↓
Planner.plan(request)
    ↓
ProviderFactory.create(config)        ← selects from AIConfiguration.provider
    ↓
PlannerProvider.complete(request)     ← calls LLM API
    ↓
StructuredOutputValidator.validate()  ← validates action schema
    ↓
PlannerResult { actions, reasoning? }
    ↓
Runtime.applyActions(actions)         ← dispatches through Action Handlers
    ↓
World
    ↓
Renderer
```

---

## Component Responsibilities

### Pipeline

The **only** AI entry point. Orchestrates the flow from user input to planner result.

```
Pipeline.execute(context: PipelineContext): Promise<PipelineContext>
Pipeline.stream(context: PipelineContext): Promise<PipelineContext>
```

- Receives `PipelineContext` with user input
- Delegates prompt construction to `PromptBuilder`
- Delegates planning to **`AgentLoop`** (which internally calls `Planner.plan()`)
- `DefaultPipeline` creates a `DefaultAgentLoop` internally if none is provided
- Emits lifecycle events through `PipelineEventEmitter`
- `stream()` emits `StreamChunk` events while the provider generates the response
- If the provider supports `StreamingPlannerProvider`, `stream()` uses streaming; otherwise falls back to `AgentLoop.execute()`
- Both methods return enriched `PipelineContext` with `plannerResult`
- `stream()` is visualization only — Runtime executes only after stream completes and validation passes

### PipelineContext

Data object that flows through the pipeline. Stages communicate **only** through this object.

```typescript
interface PipelineContext {
  input: string
  plannerResult?: PlannerResult
  memory?: Memory
  worldState?: string
  metadata?: Record<string, unknown>
}
```

- Carries user input in
- Carries planner result out
- Optionally carries `Memory` for prompt modules
- Optionally carries `worldState` — pre-formatted world snapshot string
- Extensible via `metadata`

### PromptBuilder

The **Prompt Assembly Orchestrator**. Composes the `AIRequest.prompt` string by orchestrating the full Prompt Pipeline:

```typescript
interface PromptBuilder {
  build(context: PipelineContext): Promise<AIRequest>
}
```

- Iterates over `PromptModule[]` and collects structured `PromptContext` via each module's `buildContext()` method
- Merges partial contexts into a unified `PromptContext`
- Executes the Prompt Assembly pipeline in order:
  1. `IntentAnalyzer.analyze()` — extracts user intents (pure analysis, when injected via BuilderOptions)
  2. `IntentRenderer.render()` — formats intents as string (pure rendering, when both IntentAnalyzer and IntentRenderer are injected)
  3. `MemoryRanking.rank()` — determines section priority (pure measurement, does not modify context)
  4. `PromptBudget.calculate()` — measures section sizes (pure measurement, does not modify context)
  5. `PromptSelection.select()` — decides which sections to preserve (pure decision, does not modify context)
  6. `PromptCompression.compress()` — cleans/strips context (returns new PromptContext)
  7. `PromptRenderer.render()` — converts compressed context to string (includes intentRendered section when present)
- Attaches intent, intentRendered, entity, entityRendered, semantic, semanticRendered, ranking, budget, and selection results to `AIRequest.metadata.promptAssembly`
- Also exposes `buildContext(context): Promise<PromptContext>` for structured access (compressed)
- The builder is the **only** component that constructs `AIRequest`
- Cannot render strings — that is the Renderer's sole responsibility

**Constructor:**
```typescript
// Primary form (WO-S4-010, recommended):
constructor(
  modules: PromptModule[],
  options?: BuilderOptions,          // ← single options object (WO-S4-010)
)

// Legacy positional form (backward compatible):
constructor(
  modules: PromptModule[],
  renderer?: PromptRenderer,          // default: DefaultPromptRenderer
  compression?: PromptCompression,    // default: DefaultPromptCompression
  ranking?: MemoryRanking,            // default: DefaultMemoryRanking
  budget?: PromptBudget,              // default: DefaultPromptBudget
  selection?: PromptSelection,        // default: DefaultPromptSelection
  providerBudget?: ProviderBudget,    // default: undefined
  configuration?: AIConfiguration,    // default: undefined (falls back to 'openai' provider)
)
```

All optional parameters are fully backward compatible — existing 1-8 param constructors continue working unchanged.
The `BuilderOptions` form is the recommended way to construct `DefaultPromptBuilder`. It consolidates all optional collaborators into a single object, preventing future constructor parameter growth.

`BuilderOptions` fields:
```typescript
interface BuilderOptions {
  renderer?: PromptRenderer
  compression?: PromptCompression
  ranking?: MemoryRanking
  budget?: PromptBudget
  selection?: PromptSelection
  providerBudget?: ProviderBudget
  configuration?: AIConfiguration
  intentAnalyzer?: IntentAnalyzer       // ← WO-S5-003
  intentRenderer?: IntentRenderer       // ← NEW (WO-S5-004)
  entityAnalyzer?: EntityAnalyzer       // ← WO-S5-008
  entityRenderer?: EntityRenderer       // ← WO-S5-009
  semanticContextBuilder?: SemanticContextBuilder  // ← WO-S5-012
  strategySelector?: PromptStrategySelector          // ← WO-S5-016
  strategies?: readonly PromptStrategy[]               // ← WO-S5-016
  strategyEvaluator?: StrategyEvaluator                // ← WO-S5-029
  strategySelectionRenderer?: StrategySelectionRenderer  // ← WO-S5-038
  promptAssemblyStrategyResolver?: PromptAssemblyStrategyResolver  // ← WO-S5-032
  promptAssemblyTraceDiffer?: PromptAssemblyTraceDiffer  // ← WO-S5-061
  promptAssemblyTraceRenderer?: PromptAssemblyTraceRenderer  // ← WO-S5-063
  promptAssemblyTraceExporter?: PromptAssemblyTraceExporter  // ← WO-S5-065
}
```

### PromptRenderer

The sole component responsible for converting a structured `PromptContext` into a final prompt string.

```typescript
interface PromptRenderer {
  render(context: PromptContext): string
}
```

- `render()` — converts PromptContext to string (default: insertion order = module array order)
- `DefaultPromptRenderer` — default implementation
  - `render()` — insertion order (preserves module array ordering)
  - `renderWithOrder()` — canonical field order (for `serializePromptContext` compatibility)
- Future implementations: XMLPromptRenderer, JSONPromptRenderer, OpenAIPromptRenderer, ClaudePromptRenderer
- All prompt text output must go through a PromptRenderer
- Compression is handled before render by PromptCompression — not by PromptRenderer

### PromptModule

Pluggable prompt fragment generator. Each module contributes a section to the final prompt.

```typescript
interface PromptModule {
  build(context: PipelineContext): Promise<string>
  buildContext?(context: PipelineContext): Promise<Partial<PromptContext>>
}
```

- `build()` — unchanged, returns formatted string fragment (backward compatible)
- `buildContext()` — new, returns structured `Partial<PromptContext>` with only this module's fields
- All 6 built-in modules implement both methods
- Legacy modules (build() only) continue working unchanged — `DefaultPromptBuilder` falls back to `build()`

Current modules (in composition order):

1. **ObservationPromptModule** — reads `context.metadata?.observations` and formats them as a "## Previous Observations" section. This is the canonical formatting — all observation prompt text originates from PromptBuilder.
2. **SystemPromptModule** — returns the system prompt text: "You are a game action planner for Project Genesis..." — defines available actions, JSON output format, and constraints
3. **UserInputModule** — returns `context.input` verbatim
4. **MemoryPromptModule** — reads conversation history from Memory and formats it as context
5. **WorldStatePromptModule** — wraps `context.worldState` in a "Current World:" header section
6. **ReflectionPromptModule** — reads `context.metadata?.reflectionResults` and formats them as a "## Previous Reflection" section. This is the canonical formatting — all reflection prompt text originates from PromptBuilder.

### Prompt Composition Order (via Prompt Assembly)

```
PromptModule[6]
  ├── SystemPromptModule.buildContext()    → { system: "..." }
  ├── UserInputModule.buildContext()       → { userInput: "..." }
  ├── MemoryPromptModule.buildContext()    → { memory: "..." }
  ├── WorldStatePromptModule.buildContext() → { worldState: "..." }
  ├── ObservationPromptModule.buildContext() → { observations: "..." }
  └── ReflectionPromptModule.buildContext() → { reflections: "..." }
                      ↓
            Merge into PromptContext
                      ↓
       [IntentAnalyzer.analyze()]          ← pure analysis → stored in metadata
                      ↓
       [IntentRenderer.render()]          ← pure rendering → stored in metadata + PromptContext (WO-S5-004/005)
                      ↓
       [EntityAnalyzer.analyze()]          ← pure analysis → stored in metadata (WO-S5-008)
                      ↓
       [EntityRenderer.render()]           ← pure rendering → stored in metadata + PromptContext (WO-S5-009)
                      ↓
       [SemanticContextBuilder.build()]    ← pure composition → stored in metadata.promptAssembly.semantic (WO-S5-012)
                      ↓
       [SemanticContextRenderer.render()]  ← pure rendering → stored in metadata.promptAssembly.semanticRendered (WO-S5-013)
                      ↓
       [PromptStrategySelector.select()]  ← strategy selection → stored in metadata.promptAssembly.strategy (WO-S5-016)
                      ↓
       [PromptStrategyRenderer.render()]  ← strategy rendering → stored in metadata.promptAssembly.strategyRendered (WO-S5-017)
                      ↓
       [MemoryRanking.rank()]            ← pure measurement → stored in metadata
                      ↓
       [PromptBudget.calculate()]         ← pure measurement → stored in metadata
                      ↓
       [ProviderBudget.getBudget()]        ← pure lookup → stored in metadata (NEW WO-S4-006)
                      ↓
       [PromptSelection.select(            ← consumes ranking + budget + providerBudget
         context,
         rankingResult,
         budgetResult,
         providerBudgetResult,             ← NEW: provider token capacity
       )]
                      ↓
       [PromptCompression.compress(       ← consumes selection result (WO-S4-003)
         PromptContext,                   removes excluded + undefined + empty
         selectionResult,                 returns new PromptContext
       )]
                      ↓
       [PromptRenderer.render()]          ← converts PromptContext to string
                      ↓
            AIRequest { prompt, metadata.promptAssembly }

PromptContext (structured intermediate representation):
  { system?, userInput?, memory?, worldState?, observations?, reflections? }

DefaultPromptBuilder.buildContext(context) → PromptContext (compressed, pipeline run)
serializePromptContext(ctx: PromptContext) → string (delegates to DefaultPromptRenderer)

DefaultPromptRenderer (implements PromptRenderer):
  render(ctx)     → insertion order (module array order for builder)
  renderWithOrder(ctx) → canonical order (for serializePromptContext)

### PromptCompression

Pluggable compression layer between PromptContext assembly and rendering.
Since WO-S4-003, compression consumes PromptSelectionResult to remove excluded
sections in addition to its existing empty/undefined field stripping.

```typescript
interface PromptCompression {
  compress(
    context: PromptContext,
    selection?: PromptSelectionResult,  // ← NEW (WO-S4-003)
  ): PromptContext
}
```

- Accepts `PromptContext`, returns a new `PromptContext` (never mutates input)
- No dependencies on Planner, Provider, Runtime, or AgentLoop
- Injected into `DefaultPromptBuilder` constructor (optional, defaults to `DefaultPromptCompression`)
- Applies to both `build()` and `buildContext()` outputs

**DefaultPromptCompression** — strips `undefined` and empty string `''` fields, and
removes sections excluded by PromptSelection. Idempotent, non-mutating, deterministic.

**Future implementations** (not implemented):
- RuleBasedCompression — configurable field filtering
- TokenCompression — truncate by token count
- LLMCompression — summarize sections via LLM

### PromptBudget

Standalone budget calculation layer for measuring PromptContext sizes.
Since WO-S4-004, DefaultPromptBudget calculates an estimated token count
using a configurable chars-per-token ratio (default: 4).

```typescript
interface PromptBudget {
  calculate(context: PromptContext): PromptBudgetResult
}
```

- `calculate()` — accepts `PromptContext`, returns `PromptBudgetResult`
- Pure function: reads context, returns measurement — never modifies input
- No dependencies on Planner, Provider, Runtime, or AgentLoop
- Not integrated with PromptBuilder or Compression (deferred to future WOs)

**PromptBudgetResult:**
```typescript
interface PromptBudgetResult {
  totalLength: number             // Total character length across all sections
  sectionLengths: Record<string, number>  // Per-section character lengths
  estimatedTokens?: number        // Optional — undefined by default
}
```

**DefaultPromptBudget** — character-count implementation with rule-based token estimation.
- Iterates known PromptContext fields, records `.length` for each
- Returns `totalLength` and `sectionLengths`
- Calculates `estimatedTokens = Math.ceil(totalLength / charsPerToken)`
- Configurable `charsPerToken` ratio via constructor (default: 4)
- Returns `estimatedTokens` as `undefined` when `totalLength` is 0

**Future implementations** (not implemented):
- TokenBudget — real tokenizer (tiktoken, etc.)
- ModelSpecificBudget — model-aware budget

### ProviderBudget

Standalone configuration component that represents the token capacity of different AI providers and models. Completely independent from PromptBudget — it measures provider capacity, not prompt size.

```typescript
interface ProviderBudget {
  getBudget(provider: string, model?: string): ProviderBudgetResult
}
```

- `getBudget()` — accepts provider name and optional model name, returns capacity limits
- Pure lookup: no side effects, no I/O, no network requests, no SDK calls
- No dependencies on PromptBudget, PromptSelection, PromptCompression, Planner, or Provider
- Not integrated with PromptBuilder — configuration only, wired in future WOs

**ProviderBudgetResult:**
```typescript
interface ProviderBudgetResult {
  maxInputTokens: number             // Maximum input tokens this provider/model supports
  maxOutputTokens?: number            // Optional maximum output tokens
}
```

**DefaultProviderBudget** — static lookup table with conservative defaults:

| Provider | maxInputTokens | maxOutputTokens |
|----------|---------------|-----------------|
| openai (generic) | 8,192 | 4,096 |
| deepseek (generic) | 65,536 | 8,192 |
| anthropic (generic) | 100,000 | 4,096 |
| mock | 4,096 | 1,024 |
| unknown | 4,096 | 1,024 |

Model-specific overrides (e.g., gpt-4o → 128,000 input, 16,384 output) are resolved when a model name is provided.

**Future implementations** (not implemented):
- ProviderBudget → PromptSelection integration (implemented in WO-S4-006)
- Dynamic capability discovery from provider APIs
- Custom provider budgets via configuration

### MemoryRanking

Pluggable ranking layer that determines section priority without modifying PromptContext.

```typescript
interface MemoryRanking {
  rank(context: PromptContext): MemoryRankingResult
}
```

- `rank()` — accepts `PromptContext`, returns `MemoryRankingResult`
- Pure function: reads context, returns priority info — never modifies input
- No dependencies on Planner, Provider, Runtime, or AgentLoop
- Not integrated with PromptBuilder or Compression (deferred to future WOs)

**MemoryRankingResult:**
```typescript
interface MemoryRankingResult {
  rankedSections: string[]            // Section names sorted by priority (highest first)
  priorities: Record<string, number>  // Per-section priority scores
}
```

**DefaultMemoryRanking** — fixed priority rules:

| Section | Priority | Rationale |
|---------|----------|-----------|
| userInput | 100 (Highest) | What the user asked |
| reflections | 80 | Task-specific AI insight |
| observations | 60 | Current tool execution context |
| memory | 40 | Conversation continuity |
| worldState | 20 | Spatial context |
| system | 10 (Lowest) | Static instructions |

- Only populated sections included
- Unknown sections get priority 0
- `DEFAULT_RANKING_PRIORITY` exported as constant
- Provider-agnostic (no OpenAI/DeepSeek binding)

**Future implementations** (not implemented):
- HeuristicRanking — score by recency, length, keyword match
- EmbeddingRanking — semantic similarity via embeddings
- LLMRanking — LLM-based importance evaluation

### PromptSelection

Pluggable selection layer that decides which PromptContext sections should participate in the final prompt, without modifying the context. Since WO-S4-002, PromptSelection consumes MemoryRanking and PromptBudget results for rule-based decisions.

```typescript
interface PromptSelection {
  select(
    context: PromptContext,
    ranking?: MemoryRankingResult,
    budget?: PromptBudgetResult,
    providerBudget?: ProviderBudgetResult,  // ← NEW (WO-S4-006)
  ): PromptSelectionResult
}
```

- `select()` — accepts `PromptContext` with optional `MemoryRankingResult`, `PromptBudgetResult`, and `ProviderBudgetResult`
- Pure function: reads context + ranking + budget + providerBudget, returns decision — never modifies input
- No dependencies on Planner, Provider, Runtime, or AgentLoop
- Slotted between ProviderBudget and Compression in the Prompt Assembly pipeline

**PromptSelectionResult:**
```typescript
interface PromptSelectionResult {
  selectedSections: string[]      // Sections to preserve
  excludedSections: string[]       // Sections to exclude (empty for default)
}
```

**DefaultPromptSelection** — rule-based budget-aware implementation:
- Preserves ALL populated sections when budget is sufficient
- Removes lowest-priority sections (via MemoryRanking priority) when budget is constrained
- Constructor accepts optional `maxBudgetChars` (defaults to `Infinity` — unlimited)
- Constructor accepts optional `charsPerToken` (defaults to 4 — used for ProviderBudget threshold conversion)
- When `ProviderBudgetResult` is passed to `select()`, dynamically calculates threshold as `maxInputTokens * charsPerToken`, overriding `maxBudgetChars`
- Falls back to passthrough when ranking or budget is not provided
- Non-mutating, deterministic, pure, idempotent
- Provider-agnostic (no OpenAI/DeepSeek binding)
- **Guard:** never excludes the last remaining section

**Future implementations** (not implemented):
- EmbeddingSelection — relevance-based section selection
- LLMSelection — LLM-based importance evaluation

### AIRequest

The input model for the Planner. Contains the composed prompt.

```typescript
interface AIRequest {
  prompt: string
  metadata?: Record<string, unknown>
}
```

- Created by PromptBuilder
- Consumed by Planner/PlannerProvider
- Never constructed manually by Pipeline

### Planner

Orchestration layer that delegates planning to a `PlannerProvider`.

```typescript
interface Planner {
  plan(request: AIRequest): Promise<PlannerResult>
}
```

- Does **not** contain planning logic itself
- Delegates to the injected `PlannerProvider`
- Can be extended with retry, validation, or caching without modifying providers
- `RetryPlanner` wraps any `PlannerProvider` with automatic retry logic:
  - Retries on recoverable failures (invalid JSON, schema validation failure, malformed actions)
  - Does not retry non-recoverable errors (auth, rate limits, network failures)
  - Emits `PlannerRetryStarted`/`PlannerRetryFinished` events during retry
  - Tracks `retryCount`, `planningAttempts`, `lastValidationError` in `PlannerResult.metadata`

### PlannerProvider

The interface for concrete AI implementations. Each provider calls a specific LLM API.

```typescript
interface PlannerProvider {
  complete(request: AIRequest): Promise<PlannerResult>
}
```

Current providers:
| Provider | API | SDK Method |
|----------|-----|------------|
| MockPlannerProvider | None (keyword matching) | N/A |
| OpenAIPlannerProvider | OpenAI Responses API | `client.responses.create()` |
| DeepSeekPlannerProvider | DeepSeek via OpenAI-compatible Chat Completions | `client.chat.completions.create()` |

### PlannerResult

The output model returned by the Planner.

```typescript
interface PlannerResult {
  actions: Action[]
  reasoning?: string
  metadata?: Record<string, unknown>
}
```

- `actions` — Runtime-compatible action objects (CreateEntity, MoveEntity)
- `reasoning` — optional explanation of the planning decision
- `metadata` — extensible for future use (token counts, latency, etc.)

### Runtime

Executes actions against the World. **Independent** of the AI pipeline.

```typescript
class Runtime {
  readonly world: World
  readonly query: RuntimeQuery
  applyActions(actions: Action[]): void
}
```

- Owns `World` — only Runtime may mutate it
- Dispatches actions through registered `ActionHandler` instances
- Never knows about AI, Planner, or Pipeline

---

## Provider Hierarchy

```
PlannerProvider (interface)
  ├── MockPlannerProvider       — keyword matching, no API required
  │     "tree" → CreateEntity
  │     "move" → MoveEntity
  │     other  → { actions: [] }
  │
  ├── OpenAIPlannerProvider     — OpenAI Responses API
  │     Uses: client.responses.create()
  │     Requires: apiKey, model
  │     Output: JSON with { actions: [...] }
  │     Also implements: StreamingPlannerProvider (stream via client.responses.create({ stream: true }))
  │
  └── DeepSeekPlannerProvider   — DeepSeek Chat Completions API
        Uses: client.chat.completions.create() (OpenAI-compatible)
        Requires: apiKey, baseURL, model
        Output: JSON with { actions: [...] }
        Also implements: StreamingPlannerProvider (stream via client.chat.completions.create({ stream: true }))

StreamingPlannerProvider (interface, extends PlannerProvider)
  └── MockStreamingProvider     — char-by-char streaming for testing
        OpenAIPlannerProvider    — also implements StreamingPlannerProvider
        DeepSeekPlannerProvider  — also implements StreamingPlannerProvider

RetryPlanner (implements Planner, wraps PlannerProvider)
  └── RetryPolicy              — configurable retry policy
        Works with: MockPlannerProvider, OpenAIPlannerProvider, DeepSeekPlannerProvider
        Retry events: PlannerRetryStarted, PlannerRetryFinished

ToolCallPlanner (implements Planner, wraps PlannerProvider + ToolRegistry)
  └── ToolRegistry              — tool registration and lookup
        └── Tool (interface)     — name, description, execute()
              ├── FindEntityTool          — backed by RuntimeQuery.findEntity()
              ├── FindEntitiesByTypeTool  — backed by RuntimeQuery.findEntities()
              ├── GetWorldSnapshotTool    — backed by RuntimeQuery.getWorldSnapshot()
              └── MockFindEntityTool      — hardcoded mock (for testing)
        Events: ToolCallStarted, ToolCallFinished
```

Provider selection is centralized in `ProviderFactory`:

```typescript
const provider = ProviderFactory.create(config)
// config.provider = "mock"     → MockPlannerProvider
// config.provider = "openai"   → OpenAIPlannerProvider
// config.provider = "deepseek" → DeepSeekPlannerProvider
// unknown                       → throws Error
```

### StructuredOutputValidator

Validates that raw LLM responses conform to the expected action schema before they reach Runtime.

```typescript
class StructuredOutputValidator {
  static validate(parsed: unknown): PlannerResult
}
```

- Checks that `actions` is an array
- Filters out malformed actions (missing `type` field)
- Returns valid `{ actions: [...] }` result
- Used by both `OpenAIPlannerProvider` and `DeepSeekPlannerProvider` in `parseResponse()`

### Environment Configuration

Creates `AIConfiguration` from Vite environment variables, allowing runtime provider selection without code changes.

```typescript
function createAIConfiguration(env?: Record<string, string | undefined>): AIConfiguration
```

- `VITE_AI_PROVIDER` → `provider`
- `VITE_AI_API_KEY` → `apiKey`
- `VITE_AI_MODEL` → `model`
- `VITE_AI_BASE_URL` → `baseURL`
- `VITE_AI_TEMPERATURE` → `temperature`
- `VITE_AI_MAX_TOKENS` → `maxTokens`

Falls back to `DefaultAIConfiguration` (mock provider) when environment variables are not set.

---

## Tool Calling Architecture

The Tool Calling layer provides a provider-independent abstraction for the Planner to invoke tools during planning.

### Tool Interface

```typescript
interface Tool {
  name: string
  description: string
  execute(input: unknown): Promise<unknown>
}
```

- `name` — unique identifier for referencing the tool
- `description` — human-readable description for LLM context
- `execute()` — callable execution that returns any shape of data
- No dependency on Runtime, World, Entity, or any concrete type

### ToolRegistry Interface

```typescript
interface ToolRegistry {
  getTools(): Tool[]
  findTool(name: string): Tool | undefined
}
```

`DefaultToolRegistry` provides a Map-based implementation with O(1) lookup.

### ToolCallPlanner

`ToolCallPlanner` implements `Planner` and wraps a `PlannerProvider` + `ToolRegistry`.

```
ToolCallPlanner.plan(request)
    ↓
Retrieve tools from ToolRegistry
    ↓
Enhance AIRequest with tool descriptions in prompt + metadata
    ↓
Emit ToolCallStarted (payload: { toolNames })
    ↓
Provider.complete(enhancedRequest)
    ↓
Emit ToolCallFinished (payload: { toolNames, success })
    ↓
Return PlannerResult with metadata.tools
```

### Current Tools

| Tool | Name | Description | Backend |
|------|------|-------------|---------|
| FindEntityTool | `find_entity` | Find an entity by unique ID | RuntimeQuery.findEntity() |
| FindEntitiesByTypeTool | `find_entities` | Find entities by type (or all) | RuntimeQuery.findEntities() |
| GetWorldSnapshotTool | `get_world_snapshot` | Get complete world snapshot | RuntimeQuery.getWorldSnapshot() |
| MockFindEntityTool | `find_entity` | Returns hardcoded mock data (testing) | None (mock) |

### Tool Layering

```
Pipeline → ToolCallPlanner → PlannerProvider → Concrete Provider
                ↑
          ToolRegistry → Tool (interface)
                            ├── FindEntityTool → RuntimeQuery (interface, from @genesis/shared)
                            ├── FindEntitiesByTypeTool → RuntimeQuery
                            ├── GetWorldSnapshotTool → RuntimeQuery
                            └── MockFindEntityTool (test only)
```

- The AI layer depends only on `Tool` and `ToolRegistry` abstractions
- Tools depend on `RuntimeQuery` interface (from `@genesis/shared`), not on concrete Runtime
- No provider directly imports Runtime
- ToolCallPlanner is additive — existing planners work unchanged
- `RuntimeQuery` interface is implemented by `@genesis/runtime`

---

## Agent Loop (Multi-Step with Structured Observations)

The Agent Loop provides an abstraction for iterative AI reasoning. Since WO-S3-010, `DefaultAgentLoop` supports true multi-step execution with tool calling. Since WO-S3-011, observations are maintained as structured `Observation[]` objects.

### Architecture

```
AgentLoop.execute(context)
    ↓
AgentLoopContext { request, planner, toolRegistry?, maxIterations }
    ↓
structuredObservations: Observation[] = []
    ↓
Emit: AgentLoopStarted
    ↓
for iteration = 1 to maxIterations:
  ├── Attach observations to request.metadata
  ├── Emit: LoopIterationStarted
  ├── planner.plan(request with metadata.observations) → PlannerResult
  ├── actions.length > 0? → Yes: break (finished = true)
  ├── No → toolCalls in metadata AND toolRegistry?
  │         ├── Yes: for each toolCall:
  │         │       ├── Emit: ToolExecuted
  │         │       ├── tool.execute(input) → output
  │         │       ├── Create Observation { toolName, toolInput, toolOutput, timestamp, iteration }
  │         │       ├── Push to structuredObservations
  │         │       └── Emit: ObservationRecorded
  │         │       Use PromptBuilder.formatObservationsInline() for prompt text
  │         │       Append formatted text to request prompt
  │         └── No: break (finished = false)
  ├── Run reflection (if available):
  │       reflection.execute({ plannerResult, observations, steps, iteration, maxIterations })
  │       → ReflectionResult (recorded, not acted upon)
  └── Emit: LoopIterationFinished
    ↓
AgentLoopResult { plannerResult, steps: [LoopStep with observations], iterations, finished }
    ↓
Emit: AgentLoopFinished
    ↓
Return AgentLoopResult
```

### Key Design Decisions

1. **Pipeline integration** — Since WO-S3-009, `DefaultPipeline.execute()` and `DefaultPipeline.stream()` use `AgentLoop.execute()` internally. Pipeline remains the only AI entry point; AgentLoop is the planning layer beneath it.
2. **Multi-step execution** — Since WO-S3-010, `DefaultAgentLoop` supports true multi-step execution. It calls `planner.plan()` in a loop, checking for final actions, executing tools, and feeding back observations.
3. **Stop conditions** — Two stop conditions: Planner returns non-empty actions, or maxIterations reached.
4. **Tool call detection** — Tool calls are read from `PlannerResult.metadata.toolCalls`. Each tool is executed via `ToolRegistry` and observations are recorded as structured `Observation[]` in `LoopStep`.
5. **Structured Observation Context** — Since WO-S3-011, AgentLoop maintains an `Observation[]` array passed to the Planner via `request.metadata.observations`. LoopStep references Observation objects (no data duplication).
6. **Planner Observation Awareness** — Since WO-S3-012, AgentLoop no longer formats observation prompt text inline. All observation formatting is delegated to PromptBuilder (`formatObservations`/`formatObservationsInline` in `ObservationPromptModule.ts`). AgentLoop only maintains and writes observations.
7. **Reflection Foundation** — Since WO-S3-013, `DefaultAgentLoop` accepts an optional `Reflection` via constructor. After each iteration, it calls `reflection.execute()` with the current state. Results are recorded in `AgentLoopResult.reflectionResults` but do NOT affect loop behavior. See ADR-0030.
6. **Events** — Six events (`AgentLoopStarted`, `LoopIterationStarted`, `ToolExecuted`, `ObservationRecorded`, `LoopIterationFinished`, `AgentLoopFinished`) provide full observability.
6. **No Runtime dependency** — AgentLoopContext accepts `request`, `planner`, and optional `toolRegistry`. It has no reference to Runtime.

### Compatibility

| Component | Compatible | Notes |
|-----------|-----------|-------|
| MockPlanner | ✅ | DefaultAgentLoop accepts any Planner |
| RetryPlanner | ✅ | Retry events fire inside Planner, loop events fire around it |
| ToolCallPlanner | ✅ | Tool events fire inside Planner, loop events fire around it |
| MockStreamingProvider | ✅ | Streaming provider's `complete()` used through Planner |
| OpenAIPlannerProvider | ✅ | Works through MockPlanner wrapper |
| DeepSeekPlannerProvider | ✅ | Works through MockPlanner wrapper |

### Events

| Event | Enhanced Payload | When |
|-------|-----------------|------|
| `AgentLoopStarted` | `{ maxIterations }` | Before any planning |
| `LoopIterationStarted` | `{ iteration, maxIterations }` | Before each iteration |
| `ToolExecuted` | `{ toolName, toolInput, success? }` | After each tool execution |
| `ObservationRecorded` | `{ toolName, toolInput, toolOutput, success? }` | After each observation |
| `LoopIterationFinished` | `{ iteration }` | After each iteration |
| `AgentLoopFinished` | `{ iterations, finished }` | After all iterations |

### Future (Not Yet Implemented)

- LLM-based Reflection (self-critique)
- Auto re-plan from ReflectionResult
- Context compression between iterations
- Replay
- Memory Ranking
- Parallel Tool Calling
- Human Approval

## Prompt Generation Flow

```
PipelineContext { input: "增加一棵树", memory: DefaultMemory, worldState: "Tree\nid: tree-1\nposition: (3,5)", metadata: { reflectionResults: [...] } }
    ↓
DefaultPromptBuilder.build(context)
    ↓
Iterates PromptModule[6] via buildContext() (in order)
    ├── SystemPromptModule.buildContext()     → { system: "You are a game action planner..." }
    ├── UserInputModule.buildContext(context) → { userInput: "增加一棵树" }
    ├── MemoryPromptModule.buildContext()     → { memory: "Previous actions:\n- Applied 1 action(s)" }
    ├── WorldStatePromptModule.buildContext()  → { worldState: "Current World:\n\nTree\nid: tree-1\nposition: (3,5)" }
    └── ReflectionPromptModule.buildContext()  → { reflections: "## Previous Reflection\n\nIteration 1\n\nReasoning:\nActions found\n\nContinue:\nfalse" }
    ↓
Merge into PromptContext
    ↓
Serialize to string via module-order key mapping
    ↓
AIRequest { prompt: "You are a game action planner...\n增加一棵树\nPrevious actions:\n...\nCurrent World:\n..." }
```

---

## Memory Flow

```
User sends input
    ↓
PipelineContext carries DefaultMemory
    ↓
MemoryPromptModule reads "conversation" key
    ↓
Prompt includes conversation history
    ↓
PlannerProvider receives full context
    ↓
After planning, gameStore stores result:
    memory.set("conversation", [...history, { input, summary }])
```

- `DefaultMemory` is a Map-based in-memory store
- Key: `"conversation"` → `Array<{ input: string, summary: string }>`
- Memory is **not** persisted across page refreshes
- Memory integration is optional — `PipelineContext.memory` is nullable

---

## Event Flow

```
Pipeline.execute() with ToolCallPlanner emits:
  1. PipelineStarted
  2. PromptBuilt          (payload: { prompt })
  3. PlannerStarted
  4. ToolCallStarted      (payload: { toolNames })
  5. ToolCallFinished     (payload: { toolNames, success })
  6. [PlannerRetryStarted]   ← only if RetryPlanner wraps ToolCallPlanner (payload: { retryCount, validationReason })
  7. [PlannerRetryFinished]  ← only if RetryPlanner wraps ToolCallPlanner (payload: { retryCount, validationReason })
  8. PlannerFinished
  9. PipelineFinished

Pipeline.stream() emits:
  1. PipelineStarted
  2. PromptBuilt          (payload: { prompt })
  3. PlannerStarted
  4. StreamChunk          (payload: { chunk })  ← one per text chunk from provider
  5. PlannerFinished
  6. PipelineFinished

DefaultAgentLoop.execute() emits (independent of Pipeline):
  1. AgentLoopStarted        (payload: { maxIterations })
  2. LoopIterationStarted    (payload: { iteration, maxIterations })
  3. [ToolExecuted]           (payload: { toolName, toolInput, success? })  ← only if tools executed
  4. [ObservationRecorded]    (payload: { toolName, toolInput, toolOutput, success? })  ← only if tools executed
  5. LoopIterationFinished   (payload: { iteration })
  ... (repeated for each iteration)
  6. AgentLoopFinished       (payload: { iterations, finished })
```

- Events are fire-and-forget — Pipeline never waits for listeners
- `PipelineEventEmitter` supports `subscribe` / `unsubscribe`
- Events carry `timestamp` and optional `payload`
- Useful for logging, debugging, and UI progress indicators

---

## Configuration Flow

```
AIConfiguration
  ├── provider: string           "mock" | "openai" | "deepseek"
  ├── model: string              model identifier
  ├── apiKey?: string            API key (required for openai, deepseek)
  ├── baseURL?: string           custom endpoint (required for deepseek)
  ├── temperature: number        response randomness (0.0–2.0)
  ├── maxTokens: number          max output tokens (deprecated — use maxOutputTokens)
  ├── maxOutputTokens?: number   max output tokens (preferred)
  ├── streaming?: boolean        enable streaming response mode
  ├── toolCalling?: boolean      enable native tool calling support
  └── allowBrowser?: boolean     allow browser API key usage (dev only)

DefaultAIConfiguration:
  provider="mock", model="mock", temperature=0, maxTokens=0,
  streaming=false, toolCalling=false,
  maxOutputTokens=undefined, apiKey=undefined, baseURL=undefined, allowBrowser=undefined

Usage:
  const config: AIConfiguration = { ... }
  const provider = ProviderFactory.create(config)
  const planner = new MockPlanner(provider)
  const pipeline = new DefaultPipeline(planner, promptBuilder)
```

---

## Dependency Rules

1. **Pipeline depends on Planner and PromptBuilder** — never on concrete providers
2. **Planner depends on PlannerProvider interface** — never on concrete providers
3. **ProviderFactory depends on all concrete providers** — it is the only place that knows them
4. **Concrete providers depend on AIConfiguration and PlannerProvider interface** — nothing else
5. **Runtime is independent** — never imports from `@genesis/ai`
6. **Memory is optional** — PipelineContext.memory is nullable
7. **WorldState is optional** — PipelineContext.worldState is nullable
8. **Events are fire-and-forget** — no component knows its listeners

Dependency direction (must never be violated):

```
Pipeline → Planner → PlannerProvider → Concrete Provider
                                         ↑
                                    AIConfiguration

RetryPlanner (implements Planner)
  ├── wraps PlannerProvider
  ├── uses RetryPolicy
  └── emits retry events via PipelineEventEmitter

ToolCallPlanner (implements Planner)
  ├── wraps PlannerProvider
  ├── uses ToolRegistry → Tool → RuntimeQuery (interface from @genesis/shared)
  ├── detects ToolCallingProvider (native tool calling)
  │     └── routes to completeWithTools() when available
  │     └── falls back to prompt-based injection for non-native providers
  └── emits tool events via PipelineEventEmitter

### Provider Native Tool Calling

When a provider implements `ToolCallingProvider` (extends `PlannerProvider`), the tool calling lifecycle shifts from the Planner level into the Provider level:

```
ToolCallPlanner.plan()
    ↓
Detects ToolCallingProvider
    ↓
Calls provider.completeWithTools(request, tools)
    ↓
Provider converts Tool[] → Provider-specific schema
    ↓
Sends prompt + tool schemas to LLM
    ↓
LLM returns function calls
    ↓
Provider executes Tool instances
    ↓
Provider sends results back to LLM
    ↓
LLM returns final response
    ↓
Provider parses → PlannerResult
```

For providers that do NOT implement `ToolCallingProvider`, the existing prompt-based tool description flow remains unchanged.

### ProviderToolSchemas

`ProviderToolSchemas` provides schema definitions for known tools, enabling providers to translate the generic `Tool` interface into provider-native function/tool schemas:

```typescript
// Tool (unchanged — no schema field)
interface Tool {
  name: string
  description: string
  execute(input: unknown): Promise<unknown>
}

// Provider-side schema (new — not in Tool interface)
interface ToolInputSchema {
  type: 'object'
  properties: Record<string, { type: string; description?: string }>
  required: string[]
}

// Utility functions
getToolInputSchema(tool: Tool): ToolInputSchema | undefined
hasToolSchema(tool: Tool): boolean
getSchemaTools(tools: Tool[]): ToolSchemaDescriptor[]
```

Provider translation:
```
Tool → ToolInputSchema → Provider-native schema
                           ├── OpenAI: { type: 'function', name, description, parameters, strict }
                           └── DeepSeek: { type: 'function', function: { name, description, parameters } }
```

### Event Enhancements

Tool events now carry richer payloads:

| Event | Enhanced Payload Fields |
|-------|----------------------|
| `ToolCallStarted` | `toolNames`, `tools?: [{ name, description }]`, `native: boolean` |
| `ToolCallFinished` | `toolNames`, `success`, `native: boolean`, `toolResults?: [{ name, duration, success, error? }]`, `duration`, `totalToolCallDuration?` |

### Tool Calling Provider Hierarchy

```
PlannerProvider (interface)
  └── complete(request: AIRequest): Promise<PlannerResult>

ToolCallingProvider (interface, extends PlannerProvider)
  └── completeWithTools(request: AIRequest, tools: Tool[]): Promise<PlannerResult>

PlannerProvider implementations:
  ├── MockPlannerProvider          — NO native tool calling (prompt-based only)
  ├── OpenAIPlannerProvider        — YES, implements ToolCallingProvider
  │     Uses: OpenAI Responses API function calling
  │     Schema: { type, name, description, parameters, strict }
  │     Flow: send → function_call → execute → previous_response_id → final
  └── DeepSeekPlannerProvider      — YES, implements ToolCallingProvider
        Uses: Chat Completions API tool calling
        Schema: { type, function: { name, description, parameters } }
        Flow: send → tool_calls → execute → tool messages → final

ToolCallPlanner routing:
  provider is ToolCallingProvider? → completeWithTools(request, tools)
  otherwise                        → enhanceWithTools(request) + complete(request)
```

Pipeline → PromptBuilder → PromptModule[]
                              ├── SystemPromptModule (no deps)
                              ├── UserInputModule (no deps)
                              ├── MemoryPromptModule → Memory
                              ├── WorldStatePromptModule (no deps — reads string)
                              ├── ObservationPromptModule (no deps — reads metadata)
                              └── ReflectionPromptModule (no deps — reads metadata)

StructuredOutputValidator (used by OpenAIPlannerProvider, DeepSeekPlannerProvider)

Runtime (independent)
```

**Key constraint**: PromptModules must never import Runtime, World, or entity types. World state information flows through `PipelineContext.worldState` as a pre-formatted string, serialized by the application layer.

---

## Extension Points

### Adding a new Provider

1. Create `packages/ai/src/provider/<Name>PlannerProvider.ts`
2. Implement `PlannerProvider` interface
3. Add a case to `ProviderFactory.create()`
4. Export from `provider/index.ts` and `src/index.ts`

See [PROVIDER_GUIDE.md](./PROVIDER_GUIDE.md) for step-by-step instructions.

### Adding a new PromptModule

1. Create `packages/ai/src/prompt/modules/<Name>PromptModule.ts`
2. Implement `PromptModule` interface (both `build()` and optional `buildContext()`)
3. Add to `modules/index.ts`
4. Wire into `DefaultPromptBuilder` at the composition root (e.g., `gameStore.ts`)

Modules are added to the constructor array of `DefaultPromptBuilder`:
```typescript
new DefaultPromptBuilder([
  new SystemPromptModule(),
  new UserInputModule(),
  new MemoryPromptModule(),
  new WorldStatePromptModule(),
  new ObservationPromptModule(),
  new ReflectionPromptModule(),
])
```

If the module implements `buildContext()`, it automatically contributes structured data to `PromptContext`.
Legacy modules (build() only) are fully supported — the builder falls back to `build()` for string fragments.

Order matters — modules appear in the prompt in array order.

### Adding a new Action Type

1. Define action type in `@genesis/shared`
2. Create `ActionHandler` in `@genesis/runtime`
3. Register handler in `Runtime` constructor
4. Update system prompt in providers (or PromptModule)

### Adding a new Memory Implementation

1. Create class implementing `Memory` interface
2. Replace `DefaultMemory` at the composition root
3. No other code changes needed

---

## Sprint 4 Final Architecture (v0.28)

The complete architecture at the end of Sprint 4:

```
User Input
    ↓
Pipeline.execute() / .stream()
    ↓
┌──────────────────────────────────────────────────────────────┐
│                  Prompt Assembly (PromptBuilder)              │
│  PromptModules → PromptContext → MemoryRanking → PromptBudget │
│  → PromptSelection → PromptCompression → PromptRenderer → AIRequest │
└──────────────────────────────────────────────────────────────┘
    ↓
AgentLoop.execute()
    ├── Planner.plan()
    │     ├── RetryPlanner (decorator, wraps PlannerProvider)
    │     │     └── RetryPolicy (configurable retry with backoff)
    │     └── ToolCallPlanner (decorator, wraps PlannerProvider)
    │           └── Detects ToolCallingProvider → native routing
    ├── Tool Execution
    │     └── ToolRegistry → Tool
    │           ├── FindEntityTool          → RuntimeQuery.findEntity()
    │           ├── FindEntitiesByTypeTool  → RuntimeQuery.findEntities()
    │           ├── GetWorldSnapshotTool    → RuntimeQuery.getWorldSnapshot()
    │           └── MockFindEntityTool      (testing only)
    └── Reflection.evaluate()
          └── DefaultReflection (rule-based: actions? → stop)
    ↓
PlannerProvider.complete() / completeWithTools()
    ├── MockPlannerProvider
    ├── OpenAIPlannerProvider (Streaming + ToolCalling)
    └── DeepSeekPlannerProvider (Streaming + ToolCalling)
    ↓
StructuredOutputValidator.validate()
    ↓
PlannerResult { actions, reasoning?, metadata? }
    ↓
Runtime.applyActions()
    ↓
ActionHandler[]
    ├── CreateEntityHandler
    └── MoveEntityHandler
    ↓
World
    ↓
Renderer (Canvas)
    ↓
UI
```

### Layer Summary

| Layer | Components | Responsibility |
|-------|-----------|---------------|
| **Pipeline** | `Pipeline.execute/stream`, `PipelineContext`, `PipelineEventEmitter` | AI entry point, lifecycle events |
| **Prompt Assembly** | `PromptModule[6]`, `PromptContext`, `MemoryRanking`, `PromptBudget`, `PromptSelection`, `PromptCompression`, `PromptRenderer` | Build prompt from modular sections |
| **Agent** | `AgentLoop`, `LoopStep`, `Observation`, `Reflection` | Multi-step iteration, tool calling, self-evaluation |
| **Planning** | `Planner`, `PlannerResult`, `RetryPlanner`, `ToolCallPlanner` | Orchestrate provider calls with retry and tools |
| **Provider** | `PlannerProvider`, `StreamingPlannerProvider`, `ToolCallingProvider`, `ProviderFactory` | LLM API abstraction |
| **Validation** | `StructuredOutputValidator` | Response schema validation |
| **Runtime** | `Runtime`, `ActionHandler`, `RuntimeQuery` | World state management |
| **Rendering** | Entity renderers, Canvas | Visual output |

---

## See Also

- [PROVIDER_GUIDE.md](./PROVIDER_GUIDE.md) — Step-by-step provider development guide
- [AI_INTEGRATION.md](./AI_INTEGRATION.md) — How to configure and switch AI providers
