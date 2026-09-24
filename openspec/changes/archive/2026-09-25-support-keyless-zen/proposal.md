# Proposal: support-keyless-zen

## Why

opencode ships free, no-authentication models through its Zen gateway
(provider id `opencode`, endpoint `https://opencode.ai/zen/v1`, e.g.
`opencode/space-bunny-free` with image input). The plugin's `vision_analyze`
tool currently refuses to call any provider without a resolved API key, so
free Zen models — the zero-setup default on a fresh opencode install — cannot
serve as the vision model. Verified live: anonymous `POST
https://opencode.ai/zen/v1/chat/completions` with `space-bunny-free` returns
HTTP 200 (`"cost":"0"`), while an invalid `Authorization` header returns 401.

## What Changes

- `resolveVisionApiKey` treats the API key as OPTIONAL for the opencode Zen
  gateway (provider id `opencode`, case-insensitive): when no key resolves,
  it returns success with no key instead of the current "no API key" error.
- `buildVisionRequest` omits the `Authorization` / `x-api-key` headers when
  no key is present (all other request shape rules unchanged).
- All non-Zen providers keep the current contract: a missing key is a
  `provider error` naming the fix, and no request is made.
- README gains a note that free Zen models work as the vision model with
  zero provider setup.

## Capabilities

- **New Capabilities**: none.
- **Modified Capabilities**:
  - `vision-bridge` — requirement VT-5 (endpoint and credentials resolution)
    gains keyless Zen semantics; all existing VT-5 scenarios are carried
    into the delta unchanged plus new keyless scenarios.

## Impact

- `src/vision-http.ts` (`resolveVisionApiKey`, `buildVisionRequest`,
  `postVisionRequest` key plumbing), `plugin.ts` (no logic change expected —
  the resolver call site stays as-is), `tests/vision-http.test.mjs` (new
  cases), `README.md` (free-model note). No public API signatures change
  beyond `buildVisionRequest`'s key argument becoming optional.
