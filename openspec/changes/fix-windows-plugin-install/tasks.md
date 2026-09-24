# Tasks: fix-windows-plugin-install

## 1. Manifest and packaging

- [ ] 1.1 `package.json`: delete `scripts.postinstall`; replace `prebuild` +
  `build` with one `bundle` script (`rm -rf dist` + `bun build` in a single
  command); remove `scripts` from `files`. Verify: `node -e` dump of
  `scripts`/`files` shows no trigger names (`preinstall|install|postinstall|
  prepack|prepare|build`) and no `scripts` dir in `files`.
- [ ] 1.2 Delete `scripts/install-skill.mjs`. Verify: `scripts/` directory no
  longer exists in the repo.

## 2. Docs and comments

- [ ] 2.1 `plugin.ts`: update the comments that reference the npm postinstall
  copy (dataDir resolution note near the top, config-hook skills note) to
  state package-path discovery only. Verify: `grep -n postinstall plugin.ts`
  returns nothing.
- [ ] 2.2 `README.md`: drop postinstall wording; document the official
  `opencode plugin github:<owner>/<repo>` install as verified; add the
  manual uninstall section (config entry, store dir, stale skill copy,
  optional `agent.vision-agent` knob). Verify: uninstall section lists all
  three filesystem/config locations.
- [ ] 2.3 `AGENTS.md`: update dev rules — build is `bun run bundle`;
  lifecycle/prepare-trigger scripts must never be (re)added, with the
  git-dep-preparation reason. Verify: `grep -n "bundle" AGENTS.md` and the
  no-trigger rule both present.

## 3. Build and verify

- [ ] 3.1 Rebuild: `bun run bundle` produces `dist/index.js`. Verify: dist
  exists and imports cleanly (`node -e "import('./dist/index.js').then(m =>
  console.log(typeof m.default))"` prints `object`).
- [ ] 3.2 `npm test` (38 tests) and `npm run typecheck` pass. Verify: fresh
  command output with exit 0.
- [ ] 3.3 Commit + push to `main`. Verify: `git log --oneline -1` shows the
  commit on `origin/main`.

## 4. Real-env official-mode validation

- [ ] 4.1 Install: `opencode plugin
  github:ChengZiiii/opencode-vision-bridge --global` completes (Done).
- [ ] 4.2 Registration: `opencode agent list` shows `vision-agent
  (subagent)`; restore the `agent.vision-agent` → `opencode/space-bunny-free`
  knob in `~/.config/opencode/opencode.jsonc`.
- [ ] 4.3 Smoke: `opencode run` loads without plugin errors and the free
  model responds (free-model keyless path).
