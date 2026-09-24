# Tasks: rename-plugin-opencode-vision-delegate

## 1. Code and docs rename

- [x] 1.1 `package.json`: `name` → `opencode-vision-delegate`;
  `repository.url` / `homepage` / `bugs.url` →
  `ChengZiiii/opencode-vision-delegate`.
- [x] 1.2 `plugin.ts`: `IMAGE_TMP_DIR` leaf → `opencode-vision-delegate`;
  adjacent comment updated.
- [x] 1.3 `SKILL.md`: Source D temp-subdir name + example path.
- [x] 1.4 `README.md`: title, install commands (npm name + github spec),
  `--force` example, uninstall store-path examples, temp-dir mention, new
  rename-migration note (RB-7 delta scenario).
- [x] 1.5 `AGENTS.md`: temp dir, official-mode install command, publish
  section references.
- [x] 1.6 `opencode-plugin-dev-pitfalls.md` (workspace): name/path
  references.

## 2. Build & verify

- [x] 2.1 `bun run bundle`; `npm run typecheck`; `node --test tests/` all
  green (38 tests).
- [x] 2.2 `npm pack --dry-run` reflects the new package name and unchanged
  file set.

## 3. Git / GitHub / real environment

- [ ] 3.1 (partial: commit d8c0356 + 7ccfd21 pushed; gh keyring token invalid — repo rename awaits user re-auth) Commit (`chore: rename to opencode-vision-delegate`) in the plugin
  repo; `gh repo rename opencode-vision-delegate`; push.
- [ ] 3.2 (deferred: local folder locked by the ZCode workspace watcher since 2026-08-30; cosmetic only) Rename the source directory in the workspace
  (`opencode_plugin_dev/opencode-vision-bridge` → `opencode_plugin_dev/
  opencode-vision-delegate`).
- [ ] 3.3 (partial: fixed code verified in real env via official-mode --force reinstall under the pre-rename github spec + stale store-dir surgery; config switch to the renamed spec awaits 3.1) Real env: switch `~/.config/opencode/opencode.jsonc` plugin entry
  to `github:ChengZiiii/opencode-vision-delegate`; official-mode install
  (`--global --force`); delete the OLD store dir
  `~/.cache/opencode/packages/github_ChengZiiii_opencode-vision-bridge`;
  restart-clean smoke: agent list has `vision-agent`, `vision` skill
  discoverable, `vision_analyze` tool present, temp writes go to
  `<tmp>/opencode-vision-delegate/`.

## 4. Close-out

- [x] 4.1 `openspec validate rename-plugin-opencode-vision-delegate
  --strict` green; validate the other pending change still passes.
