# Design: fix-keyless-provider-vision-routing

## Context

The routing contract (RV-1/RV-2) is a pair of experimental transforms that
must agree on whether the CURRENT request's model sees images natively:

- `experimental.chat.messages.transform` — input is `{}`; per message it sees
  `info.model` (user messages stamped by the TUI carry
  `{providerID, modelID, variant}`), `info.agent`, and `info.sessionID`.
  Vision-capable → image FileParts pass through; text-only → rewritten to
  `[vision:dropped-image]` markers with a materialized temp path.
- `experimental.chat.system.transform` — input carries the request's `Model`
  (`providerID`/`id`). Vision-capable → pushes `[vision:native]` (do NOT use
  the vision skill / `vision_analyze` / subagent); text-only → injects
  nothing.

Both consult the same `visionModelKeys` set. That set is derived from
`discoverVisionModels()`, which iterates only `configuredProviderIDs()`:
`enabled_providers` ∪ config `provider(s)` keys ∪ providers whose catalog env
vars are set ∪ `auth.json` entries. Keyless Zen (`opencode` provider,
`OPENCODE_API_KEY` unset, no `auth.json`) fails all four tests, so its
multimodal models are invisible to capability resolution even while the user
is actively chatting on one. This is exactly the reported bug: session model
`opencode/space-bunny-free` (catalog: `attachment: true`, input modalities
`["text","image","video"]`) was judged text-only, its images were dropped to
markers, and the skill/tool drove delegation.

The kilo original carries the identical gate; in kilo the hole is latent
because providers are BYOK with credentials in kilo's secure store.

## Goals / Non-Goals

- Goal: capability RESOLUTION for an already-active request model must be a
  pure function of (catalog, config overrides) — never of provider
  availability heuristics.
- Goal: the two transforms reach the same verdict for the same model id.
- Non-Goal: changing the suggestion/discovery path (`discoverVisionModels`,
  `registeredModels` — availability + deprecated gated, RB-4/RB-5 unchanged).
- Non-Goal: hiding the vision skill or `vision_analyze` tool per session —
  opencode v1 hooks register tools/skills globally; instruction-only
  suppression via `[vision:native]` is the ceiling, matching kilo.

## Decisions

### D1: dedicated full-catalog key-set builder for capability resolution

Add `buildVisionModelKeys(catalog, config)`:

- iterate EVERY provider key in the cached catalog;
- merge config `provider(s).<id>.models` overrides via the existing
  `providerModels()` (which already folds and merges) so custom/config-only
  models keep working;
- filter with `isVisionModel()` (`modalities.input` includes `"image"`, or
  empty input modalities + `attachment === true`);
- fold keys to lowercase into `visionModelKeys` (same set variable both
  transforms read — single source of truth, no second lookup path to skew).

`configuredProviderIDs()` / `discoverVisionModels()` / `registeredModels`
stay untouched: no behavior consumer depends on their gating today, and
RB-4/RB-5 wording governs them as-is.

### D2: deprecated models ARE resolvable capabilities

The capability key set does not filter `status` (RB-5's deprecated filter
governs the discovery/suggestion path only). Rationale: resolution answers
"can the model that is ALREADY serving this request see images?" — a
deprecated-but-active multimodal model must not have its images dropped.
This boundary is stated in the RV-1 delta.

### D3: intentional divergence from kilo upstream

Kilo's equivalent set is availability-gated. We keep kilo's structure but
swap the key-set SOURCE, because opencode's flagship provider is keyless.
Recorded in `opencode-plugin-dev-pitfalls.md` §9 so future ports check the
host's provider-availability model instead of copying kilo's gate.

### D4: rejected alternatives

- `chat.params` (has `sessionID` + `model`) stashing a session→capability map
  for `messages.transform` to consume: hook ordering between the two is
  undocumented, introduces plugin-held state, and RV-2 promises no
  model-choice state of any kind. Rejected.
- Restricting the fix to "always include the `opencode` provider": whack-a-
  mole; any future keyless provider (or a config-only custom provider with
  declared modalities) would hit the same hole. The full-catalog build fixes
  the class.
- Per-session tool/skill hiding: not expressible in v1 hooks.

## Risks / Trade-offs

- Key-set size: the catalog holds ~8k models across ~all providers; the
  vision-capable subset is a few hundred keys — negligible build cost at
  config-hook time.
- A catalog entry mis-marked as image-capable would now pass images natively
  for sessions on it (previously: dropped + delegated when the provider was
  ungated). This trusts opencode's own catalog metadata — the same metadata
  its model picker uses to offer image input; acceptable and aligned.
- No migration concern: the set is rebuilt on every config hook run.

## Migration Plan

Single release; no persisted state; no config changes. Sessions on keyless
multimodal models flip from delegation to native on plugin update.

## Open Questions

None — the fix direction is fully determined by the forensics.
