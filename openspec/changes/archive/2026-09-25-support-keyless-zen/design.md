# Design: support-keyless-zen

## Context

See proposal.md — Why. Today `resolveVisionApiKey` returns an error when no
key resolves, and `buildVisionRequest` always takes a required key string.
The opencode Zen gateway (`provider id "opencode"`, base
`https://opencode.ai/zen/v1`) serves free models anonymously (live-probed:
anonymous 200 / `"cost":"0"`, invalid `Authorization` 401), so "no key"
there is a valid state, not a configuration error.

## Goals / Non-Goals

- Goals: make Zen free models usable as `vision-agent`'s model with zero
  setup; keep the strict error contract for every other provider.
- Non-Goals: no general "keyless for anyone" mode; no Zen account/token
  management (a configured key, if present, is simply used); no endpoint
  allowlist beyond the Zen gateway.

## Decisions

1. **Identify the gateway by provider id, not by endpoint URL.**
   `resolveVisionApiKey` already receives the provider id; matching
   `provider.toLowerCase() === "opencode"` is one fold against the existing
   case-insensitive convention (RB-4) and survives `options.baseURL`
   overrides pointing Zen at a custom domain.
   *Alternative considered:* match the resolved endpoint host
   (`opencode.ai/zen`) — catches exotic configs but couples the allowance to
   endpoint resolution order and invites accidental keyless sends to
   unrelated gateways on the same host. Rejected.
2. **Key becomes optional only at the two existing seams.**
   `resolveVisionApiKey` gains an internal keyless allowance: for the Zen
   provider id, "nothing resolved" returns `{ ok: true, key: undefined }`
   instead of an error. `buildVisionRequest`'s key parameter becomes
   optional and omits `Authorization` / `x-api-key` when absent. No new
   knobs, no plugin.ts logic changes — the call site stays identical.
   *Alternative considered:* a config flag (`"auth": "none"`) per provider —
   more general, but invents a knob for one known gateway and shifts the
   cost to every user. Rejected; revisit if a second keyless gateway
   appears.
3. **401 stays a `provider error`.** If Zen later requires auth for a model,
   the plain HTTP 401 flows through the existing error classification and
   the skill's subagent fallback (VT-4) applies. No special-casing.
4. **Tests at the same level as existing key tests** (stub fetch / direct
   function calls): (a) Zen id + no auth → ok with undefined key; (b) Zen id
   + env key → key used; (c) non-Zen id + no auth → unchanged error text;
   (d) `buildVisionRequest` omits auth headers when key is undefined (both
   shapes), keeps them when present.

## Risks / Trade-offs

- [Zen starts demanding auth for free models someday] → surfaces as HTTP
  401 `provider error`; message already tells the user how to authenticate.
  Acceptable.
- [A user's private gateway happens to be named provider id `opencode`] →
  their no-key call is sent without auth and likely 401s — same observable
  outcome as today's pre-flight error, minus the actionable message.
  Narrow enough to accept; a configured key always wins anyway.

## Migration Plan

Single release: ship code + tests + README note together; rebuild `dist`.
Rollback = revert the commit — no persisted state involved.
