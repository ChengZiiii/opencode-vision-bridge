# Tasks: support-keyless-zen

## 1. Pure-core keyless semantics

- [x] 1.1 In `src/vision-http.ts`, make `resolveVisionApiKey` return success with no key for provider id `opencode` (case-insensitive) when no auth.json entry and no env key resolves; all other provider ids keep the exact current error text. Verify with new unit tests: `opencode` + empty auth/env → ok/undefined; `opencode` + env key → key used; `minimax-cn-coding-plan` + empty → unchanged error.
- [x] 1.2 Make `buildVisionRequest`'s key argument optional: omit `Authorization` (OpenAI shape) / `x-api-key` (Anthropic shape) when the key is undefined; keep headers byte-identical when a key is present. Verify with unit tests asserting header presence/absence for both shapes.

## 2. Wiring and build

- [x] 2.1 Adjust the `plugin.ts` tool call site and type plumbing if the optional-key signatures require it (behavior unchanged for keyed providers). Verify `bun run typecheck` is clean.
- [x] 2.2 Run the full suite `node --test tests/*.test.mjs` — all pre-existing tests pass unchanged (keyed paths are untouched) and the new keyless tests pass.
- [x] 2.3 Rebuild `bun run build` and confirm dist is fresh (timestamp after source edits).

## 3. End-to-end verification

- [x] 3.1 Real-env contract run: with `agent["vision-agent"].model = "opencode/space-bunny-free"` and NO authentication configured, `opencode debug agent vision-agent --tool vision_analyze` on a local PNG returns a template-shaped JSON from the free model (no `Authorization` header sent — verified by success without any auth).
- [x] 3.2 README: add a short "Free models" note (zero-setup vision via `opencode/space-bunny-free`, no provider auth needed; other providers unchanged). Verify the note matches the shipped behavior.
