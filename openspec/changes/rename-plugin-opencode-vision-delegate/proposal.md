# Proposal: rename-plugin-opencode-vision-delegate

## Why

The npm name `opencode-vision-bridge` is taken (martinmose, since 2026-07-02)
by a package with a different architecture (pre-captioning transform; no
tool/subagent/skill delegation, no catalog-based routing). Publishing under
the same name is impossible and would confuse users comparing the two. User
decision (2026-09-25): rename the plugin everywhere — npm package name and
GitHub repository — to `opencode-vision-delegate`, which states the domain
(vision) and the mechanism (delegation) and was verified available on both
npm and github.com/ChengZiiii.

## What Changes

- `package.json`: `name`, `repository.url`, `homepage`, `bugs.url` →
  `opencode-vision-delegate` / `ChengZiiii/opencode-vision-delegate`.
- `plugin.ts`: `IMAGE_TMP_DIR` leaf `opencode-vision-bridge` →
  `opencode-vision-delegate` (file-ledger Source C dir follows the plugin
  name; RB-6 scenario path updates accordingly).
- `SKILL.md`: temp-subdirectory name in the Source D contract and example.
- `README.md`: title, npm/github install commands, store-path examples,
  temp-dir mention, plus a short rename note (users of the old github spec:
  switch the `plugin` entry, delete the old
  `~/.cache/opencode/packages/github_ChengZiiii_opencode-vision-bridge`
  store dir).
- `AGENTS.md` (in-repo): temp dir, install commands, publish section refs.
- `opencode-plugin-dev-pitfalls.md` (workspace doc): path/name references.
- Source directory renamed:
  `opencode_plugin_dev/opencode-vision-bridge` → `opencode_plugin_dev/opencode-vision-delegate`.
- GitHub repository renamed via `gh repo rename` (old URL redirects);
  local remote follows.
- Real environment: config `plugin` entry switches to
  `github:ChengZiiii/opencode-vision-delegate`, official-mode reinstall,
  old store dir deleted.
- NOT changed: historical openspec change artifacts
  (`fix-windows-plugin-install`, written during the old-name era) stay
  verbatim; the `vision` skill id, `vision_analyze` tool name, and
  `vision-agent` subagent id are unaffected; npm publish itself remains
  deferred (blocked on `npm login`) — the name is claimed by this rename and
  verified free.

## Capabilities

- **Modified Capabilities**: `vision-bridge`
  - `RB-6`: the temporary image subdirectory is `opencode-vision-delegate`.
  - `RB-7`: README documents `opencode-vision-delegate` (title, install
    commands, store paths).

## Impact

- Code/docs only; no routing, registration, permission, or protocol change.
- Users installing from the renamed github spec get a NEW sanitized store
  dir; the old one is garbage and its deletion is documented.
- File ledger Source C dir name changes (old `<tmp>/opencode-vision-bridge/`
  contents are transient; a stale leftover after upgrade is harmless and can
  be deleted).
- Version stays 0.1.0 (never published under either name).
