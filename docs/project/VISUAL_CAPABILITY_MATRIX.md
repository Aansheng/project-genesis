# Visual Capability Matrix

Architecture version: v1.125

This matrix distinguishes semantic intent from asset and renderer realization.

| Capability | Semantically represented | Asset specified | Asset resolved | Renderer realized |
| --- | --- | --- | --- | --- |
| Art direction | YES | NO | NO | NO |
| Theme refinement | YES | NO | NO | NO |
| Palette semantics | YES | NO | NO | NO |
| Environment / terrain semantics | YES | NO | NO | NO |
| Background semantics | YES | NO | NO | NO |
| Player visual role | YES | NO | NO | primitive fallback |
| Generic enemy visual role | YES | NO | NO | primitive fallback |
| Boss visual role | YES | NO | NO | primitive fallback |
| Checkpoint / goal visual role | YES | NO | NO | primitive fallback |

The semantic layer is compiled deterministically from
`GameDesignSpecification`. No image provider, manifest, texture, sprite, or
renderer theme binding exists yet. Existing primitive geometry is the truthful
fallback for entities that can be rendered today.
