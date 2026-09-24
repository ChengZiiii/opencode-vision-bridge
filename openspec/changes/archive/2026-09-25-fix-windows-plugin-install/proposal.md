# Proposal: fix-windows-plugin-install

## Why

`opencode plugin github:ChengZiiii/opencode-vision-bridge --global` fails on
Windows with `git dep preparation failed`. Root cause (verified empirically on
2026-09-25): opencode 1.18.32's bundled pacote skips git-dep preparation only
when the dependency manifest declares NONE of the trigger scripts
(`preinstall`, `install`, `postinstall`, `prepack`, `prepare`, `build`); our
`package.json` declares `postinstall` and `build`, so the installer spawns an
inner `npm install` in the cloned repo, which fails inside the compiled
opencode binary (upstream corroboration: anomalyco/opencode#49704, which
prescribes exactly this author-side workaround; a `workspaces` field is a
seventh trigger we must also never declare). A probe branch that only removed those two scripts
installed successfully via the official mode (agent registered, smoke run OK),
proving the package is otherwise installable on any machine. The primary
install mode must work everywhere, so the trigger scripts have to go.

## What Changes

- `package.json`: remove `postinstall`; replace `prebuild` + `build` with a
  single non-trigger `bundle` script (`rm dist` + `bun build` in one command).
  `test` / `typecheck` stay (not trigger names).
- Delete `scripts/install-skill.mjs` and drop `scripts` from the `files`
  allowlist. Skill delivery relies solely on the existing config-hook
  `config.skills.paths` injection (RB-9 package-path discovery); single-file
  `~/.config/opencode/plugin/` installs keep the documented manual `SKILL.md`
  copy. The postinstall copy was redundant belt-and-braces for package
  installs and is the direct cause of the official-mode failure.
- **BREAKING** (packaging only, no runtime behavior change): npm installs no
  longer copy `SKILL.md` to `~/.config/opencode/skills/vision/`. No spec'd
  behavior depends on that copy for package installs (RB-9 scenario "Package
  install discovers the skill without a mirror" already covers it).
- `plugin.ts`: comment updates only (drop postinstall references).
- `README.md`: verify + document the official `opencode plugin
  github:<owner>/<repo>` install, document manual uninstall steps (config
  entry, `~/.cache/opencode/packages/<sanitized-spec>` store dir, stale
  `~/.config/opencode/skills/vision/`, optional `agent.vision-agent` knob),
  drop postinstall wording.
- `AGENTS.md`: update the dev rules (build script is `bun run bundle`; no
  lifecycle/prepare-trigger scripts may be (re)added — with the reason).

## Capabilities

- **Modified Capabilities**: `vision-bridge`
  - `RB-1` gains the manifest constraint: `scripts` SHALL NOT declare any
    prepare-trigger name; build uses `bundle`.
  - `RB-3` (skill installer script) is **REMOVED** — the script is deleted.
  - `RB-7` README requirement: skill-discovery wording drops the postinstall
    fallback; adds the github-spec install method and uninstall docs.
  - `RB-9`: drops the postinstall fallback sentence; discovery is
    package-path only.

## Impact

- Code: `package.json`, `scripts/install-skill.mjs` (deleted), `plugin.ts`
  (comments only), `README.md`, `AGENTS.md`; `dist/index.js` rebuilt (comment
  deltas only, no behavior change — test suite and typecheck must stay green).
- Installers: registry installs (`opencode plugin opencode-vision-bridge`) are
  unaffected (opencode already sets `ignoreScripts: true` there); git/github
  spec installs go from "fails on Windows" to working.
- Out of scope: upstream bug report to sst/opencode (tracked separately);
  `npm publish` (separate user decision).
