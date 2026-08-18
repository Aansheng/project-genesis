# Visual Capability Matrix

Architecture version: v1.129

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
| Asset requirement representation | YES | YES | NO | NO |
| Asset identity | YES | YES | NO | NO |
| Entity → asset binding | YES | YES | NO | NO |
| Asset generated | NO | YES | NO | NO |
| Asset manifest | YES | YES | YES | NO |
| Partial resolution representation | YES | YES | YES | NO |
| Actual asset store | NO | NO | NO | NO |
| Asset resolver | YES | YES | YES | NO |
| Asset store | YES | YES | YES | NO |
| Static URI resolution | YES | YES | YES | NO |
| Binary/image decode | NO | NO | NO | NO |
| Pixi sprite rendering | NO | NO | YES | YES |
| Pixi texture adapter | NO | NO | YES | YES |
| Primitive fallback | YES | YES | YES | YES |
| Mixed sprite + primitive world | NO | NO | YES | YES |
| Production static asset wiring | NO | NO | NO | NOT YET |
| Background asset rendering | NO | NO | NO | NOT YET |
| Tileset rendering | NO | NO | NO | NOT YET |
| Animation | NO | NO | NO | NOT YET |
| AI image generation | NO | NO | NO | NO |

The visual and asset layers are compiled deterministically from
`GameDesignSpecification`. No image provider, `AssetManifest`, resolved
resource, texture, sprite, or renderer theme binding exists yet. Existing
primitive geometry is the truthful fallback for entities that can be rendered
today. Unresolved and failed manifest entries are intended to retain the future
primitive fallback path; no manifest entry is rendered yet.
