# Proposal: fix-keyless-provider-vision-routing

## Why

User report (2026-09-25, screenshot + session forensics): with the multimodal
model `opencode/space-bunny-free` active in a `build`-agent session, the
orchestrator still called the vision skill and `vision_analyze` instead of
reading the attached image natively — diverging from the kilo original's
multimodal behavior.

Evidence chain (all verified from the local session database
`~/.local/share/opencode/opencode.db`, session
`ses_f2b0ce04cfferTp2P17ZkCzk3C` "图片内容含义解析"):

- The user message carries `model: {providerID: "opencode", modelID:
  "space-bunny-free", variant: "max"}`; the session model is the same.
- The catalog (`~/.cache/opencode/models.json`) marks that model genuinely
  multimodal: `attachment: true`, `modalities.input: ["text","image","video"]`.
- The assistant's recorded reasoning says the image "is a local path
  attachment" — it never received the image bytes.

Root cause: `visionModelKeys` (the capability key set consulted by BOTH
`experimental.chat.messages.transform` chain step (1) and
`experimental.chat.system.transform`) is built from `discoverVisionModels()`,
which only iterates providers returned by `configuredProviderIDs()`. That
provider-availability gate resolves providers from `enabled_providers`,
config `provider(s)` blocks, env keys (`OPENCODE_API_KEY` unset — Zen is
keyless), and `auth.json` (absent — keyless Zen stores no credential). The
`opencode` (Zen) provider is therefore excluded, `opencode/space-bunny-free`
is missing from `visionModelKeys`, both transforms judge the session
text-only, the image FilePart is rewritten to a `[vision:dropped-image]`
marker, no `[vision:native]` instruction is injected, and the skill +
tool descriptions drive delegation. The model obeyed its instructions
correctly; the plugin misjudged capability.

The kilo original has the same gating, but the hole is latent there: kilo
users run BYOK providers whose credentials sit in kilo's secure store, so
`authConfigured` always includes them. opencode Zen is a keyless first-class
provider, so the port must deliberately diverge.

## What Changes

- `plugin.ts`: build `visionModelKeys` from the FULL cached models catalog
  (every catalog provider, merged with config `provider(s).<id>.models`
  overrides) filtered by `isVisionModel()` — provider availability
  (`enabled_providers` / config blocks / env / auth) no longer participates
  in capability RESOLUTION. `discoverVisionModels()` / `registeredModels`
  keep their availability + deprecated gating (suggestion-path behavior,
  governed by RB-4/RB-5, unchanged).
- New `tests/routing.test.mjs`: drives the real plugin module through the
  config hook + both transforms using the existing env seams
  (`OPENCODE_MODELS_PATH`, `OPENCODE_AUTH_CONTENT`): keyless multimodal
  session keeps image parts untouched + receives `[vision:native]`; keyless
  text-only session still gets the `[vision:dropped-image]` marker path;
  mixed-case ids still fold.
- `dist/index.js` rebuilt; full suite + typecheck stay green.
- `README.md` troubleshooting note (multimodal session still delegating →
  capability is now resolved from the full catalog, update the plugin).
- `opencode-plugin-dev-pitfalls.md` §9: keyless providers are invisible to
  availability-gated discovery — resolve capability from the full catalog.

## Capabilities

- **Modified Capabilities**: `vision-bridge`
  - `RV-1`: capability chain step (1) resolves against a key set built from
    the full catalog + config model overrides, ungated by provider
    availability; new scenario for a keyless multimodal session.
  - `RV-2`: the system transform consults the same ungated key set; new
    scenario for a keyless multimodal session receiving `[vision:native]`.

## Impact

- Code: `plugin.ts` (key-set construction + comments), `tests/routing.test.mjs`
  (new), `dist/index.js` (rebuilt), `README.md`, `opencode-plugin-dev-pitfalls.md`
  (workspace doc, outside the package).
- Behavior: sessions on keyless providers (Zen `opencode/*`) flip from
  "images dropped + delegate" to "images native + `[vision:native]`" when the
  active model is multimodal; every gated-provider session is unaffected
  (their providers were already in the key set).
- No config, storage, or permission surface changes; RV-2's "no model-choice
  state" guarantee is preserved (pure function of catalog + config).
- Verification: unit tests via env seams, then a real-env replay of the exact
  bug scenario (space-bunny-free session + attached image) through the
  official install mode per AGENTS.md 终验 (git+file or local .tgz).
- Out of scope: `npm publish` (blocked on name/login, separate decision);
  upstream kilo divergence backport; hiding the vision skill/tool per-session
  (impossible in opencode v1 hooks — global registration only; `[vision:native]`
  instruction remains the suppression mechanism, same ceiling as kilo).
