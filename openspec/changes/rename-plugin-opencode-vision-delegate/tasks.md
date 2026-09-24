# Tasks: rename-plugin-opencode-vision-delegate

## 1. Code and docs rename

- [ ] 1.1 `package.json`: `name` → `opencode-vision-delegate`;
  `repository.url` / `homepage` / `bugs.url` →
  `ChengZiiii/opencode-vision-delegate`.
- [ ] 1.2 `plugin.ts`: `IMAGE_TMP_DIR` leaf → `opencode-vision-delegate`;
  adjacent comment updated.
- [ ] 1.3 `SKILL.md`: Source D temp-subdir name + example path.
- [ ] 1.4 `README.md`: title, install commands (npm name + github spec),
  `--force` example, uninstall store-path examples, temp-dir mention, new
  rename-migration note (RB-7 delta scenario).
- [ ] 1.5 `AGENTS.md`: temp dir, official-mode install command, publish
  section references.
- [ ] 1.6 `opencode-plugin-dev-pitfalls.md` (workspace): name/path
  references.

## 2. Build & verify

- [ ] 2.1 `bun run bundle`; `npm run typecheck`; `node --test tests/` all
  green (38 tests).
- [ ] 2.2 `npm pack --dry-run` reflects the new package name and unchanged
  file set.

## 3. Git / GitHub / real environment

- [ ] 3.1 Commit (`chore: rename to opencode-vision-delegate`) in the plugin
  repo; `gh repo rename opencode-vision-delegate`; push.
- [ ] 3.2 Rename the source directory in the workspace
  (`opencode_plugin_dev/opencode-vision-bridge` → `opencode_plugin_dev/
  opencode-vision-delegate`).
- [ ] 3.3 Real env: switch `~/.config/opencode/opencode.jsonc` plugin entry
  to `github:ChengZiiii/opencode-vision-delegate`; official-mode install
  (`--global --force`); delete the OLD store dir
  `~/.cache/opencode/packages/github_ChengZiiii_opencode-vision-bridge`;
  restart-clean smoke: agent list has `vision-agent`, `vision` skill
  discoverable, `vision_analyze` tool present, temp writes go to
  `<tmp>/opencode-vision-delegate/`.

## 4. Close-out

- [ ] 4.1 `openspec validate rename-plugin-opencode-vision-delegate
  --strict` green; validate the other pending change still passes.
