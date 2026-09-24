# Tasks: fix-keyless-provider-vision-routing

## 1. Implementation

- [ ] 1.1 `plugin.ts`: add `buildVisionModelKeys(catalog, config)` — iterate
  every catalog provider, merge config provider model overrides via
  `providerModels()`, filter with `isVisionModel()`, fold to lowercase; wire
  it into the config hook so `visionModelKeys` comes from it (discovery /
  `registeredModels` untouched). Update the chain comments (RV-1 step 1,
  RV-2) to state the full-catalog, availability-ungated source.
- [ ] 1.2 New `tests/routing.test.mjs` importing `../plugin.ts` (node type
  stripping), driving the config hook + both transforms via the env seams
  (`OPENCODE_MODELS_PATH` fixture catalog, `OPENCODE_AUTH_CONTENT={}`):
  (a) keyless multimodal model (`attachment: true` / image input modality,
  provider absent from all availability sources) + user message
  `info.model` → image FilePart untouched AND `[vision:native]` pushed;
  (b) same fixture, text-only model (input modalities `["text"]`,
  `attachment: false`) → `[vision:dropped-image]` marker with temp path,
  no `[vision:native]`;
  (c) mixed-case provider/model ids still resolve (fold guard);
  (d) config `provider(s).<id>.models` override declaring image input on a
  custom model resolves capable.
- [ ] 1.3 `bun run bundle` rebuild; `npm run typecheck`; full
  `node --test tests/` suite green (existing 38 + new routing tests).

## 2. Real-env verification (official install mode per AGENTS.md 终验)

- [ ] 2.1 Reinstall the fixed build through the official mode (git+file spec
  or local `.tgz`), then replay the bug scenario in a fresh session: switch
  to `opencode/space-bunny-free` (or the same fixture via a config model),
  attach an image, ask what it shows — confirm the model answers directly:
  no `Skill "vision"` call, no `vision_analyze` call, no
  `[vision:dropped-image]` marker in storage; image input present in the
  request (message tokens reflect the image).
- [ ] 2.2 Regression spot-check: a text-only model session (e.g.
  `big-pickle`) with an image still routes via the vision skill /
  `vision_analyze` tool-first path.

## 3. Docs

- [ ] 3.1 `README.md` troubleshooting: "multimodal session still delegates"
  entry — capability resolves from the full model catalog as of this fix;
  update the plugin.
- [ ] 3.2 `opencode-plugin-dev-pitfalls.md` §9: keyless providers are
  invisible to availability-gated discovery; resolve per-request capability
  from the full catalog (kilo parity caveat).

## 4. Close-out

- [ ] 4.1 `openspec validate fix-keyless-provider-vision-routing --strict`
  green; commits follow AGENTS.md conventions (`plugin:` / `tests:` /
  `docs:`).
