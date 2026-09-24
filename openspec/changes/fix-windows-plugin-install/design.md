# Design: fix-windows-plugin-install

## Context

opencode 1.18.32 `opencode plugin <github-spec>` installs git deps through a
bundled pacote whose `#prepareDir` short-circuits only when the dependency
manifest declares none of: `preinstall`, `install`, `postinstall`, `prepack`,
`prepare`, `build`. Our manifest declared `postinstall` (skill copy) and
`build` (dist build), so every github-spec install attempted git dep
preparation — an inner `npm install --force` spawned with `npmBin='npm'`,
which fails on Windows inside the compiled opencode binary (`npm` is
`npm.cmd`; no shell resolution) and surfaces as
`Could not install "github:ChengZiiii/opencode-vision-bridge" / git dep
preparation failed`.

Evidence trail (2026-09-25):

- Marker scan of the real runtime exe
  (`.../opencode-windows-x64/bin/opencode.exe`, 180 MB) found
  `git dep preparation failed` and `_PACOTE_NO_PREPARE_` but NOT
  `Fetching packages of type` — the bundled pacote predates the allow-git
  canUse gate, which is why `allow-git=all` in `~/.npmrc` changed nothing.
- Probe branch `probe/noscripts` (package.json minus `postinstall`/`build`
  only, dist untouched): `opencode plugin
  "github:ChengZiiii/opencode-vision-bridge#probe/noscripts" --global` →
  Done; `vision-agent` registered; `opencode run` smoke passed. Same spec on
  `main` fails. Branch deleted after the test.

## Goals / Non-Goals

- Goals: make `opencode plugin github:<owner>/<repo>` the working primary
  install mode on any machine (Windows included); keep skill discovery
  working with zero installer machinery; codify the no-trigger-scripts rule
  so it is not reintroduced later.
- Non-Goals: fixing pacote/opencode upstream (tracked as a separate report);
  `npm publish` (separate user decision); changing runtime plugin behavior
  (dist stays behavior-identical).

## Decisions

1. **Remove the trigger scripts instead of working around the prepare step.**
   Alternatives considered: (a) `allow-git=all` in user npmrc — irrelevant,
   the bundled pacote has no such gate; (b) keep `build`, drop only
   `postinstall` — fails, `build` alone still triggers preparation;
   (c) ship a tarball-only flow (npm publish) — orthogonal, and git-spec
   install would still break for anyone using it; (d) empty-string scripts —
   pacote checks key presence semantics on truthy callables, and empty
   scripts are indistinguishable from declared. Only removing ALL six trigger
   names (and never declaring `workspaces`, a seventh trigger per
   anomalyco/opencode#49704) makes `#prepareDir` return before spawning npm.
   Independent corroboration: the tracker issue #49704 (opencode 2.0.7,
   macOS — not Windows-specific; `process.execPath` is the opencode binary
   itself, so the spawned bundled `npm-cli.js` prints help and dies)
   prescribes exactly this author-side workaround: avoid the six script
   names and ship build output pre-built/committed. The `ignoreScripts`
   early-exit inside pacote's `#prepareDir` only exists from pacote 22.0.0
   (npm/pacote PR #486, 2026-06) — opencode's bundle predates it (dev pins
   21.5.0 + a local patch without that fix), so `ignoreScripts: true` cannot
   suppress git dep preparation today; the open fix PR anomalyco/opencode
   #49795 (resolve real npm from PATH for preparation) is unmerged. Our fix
   is correct under both old and fixed hosts.
2. **One `bundle` script replacing `prebuild`+`build`.** The dist-clean step
   folds into a single command; name chosen from outside the trigger list.
   `test`/`typecheck` keep their names (not triggers).
3. **Delete `scripts/install-skill.mjs` entirely** rather than keeping it as
   a manual helper: the config hook already covers every package mode
   (npm/github/file://), the single-file mode is documented as a manual copy,
   and a shipped-but-unwired script invites accidental rewiring. Dropping
   `scripts` from `files` also shrinks the published package.
4. **README gains the uninstall procedure** (config entry → store dir →
   stale skill copy → optional agent knob). opencode has no `plugin remove`
   command in 1.18.32; the manual steps were executed and verified on
   2026-09-25 (agent list count dropped to 0).
5. **Ecosystem alignment (from the 2026-09-25 investigation subagent):** the
   8/8 surveyed opencode plugins distribute via the npm registry and
   recommend the npm-name spec; registry tarballs never enter
   `#prepareDir`, so `opencode plugin opencode-vision-bridge` is the most
   robust install path. `npm publish` stays a separate user decision; the
   README keeps the npm spec primary and documents the github spec as the
   verified git-source alternative, with the upstream issue linked for
   context. Tarball-URL specs are rejected by `opencode plugin add` (v2
   docs), so registry publication is the only non-git sidestep.

## Risks / Trade-offs

- [Fresh `npm install` of the package no longer copies the skill for users
  who relied on the postinstall mirror] → Mitigation: RB-9 scenario already
  guarantees package-path discovery with no mirror; README documents the
  single-file manual copy; stale mirrors keep working because opencode scans
  config skills paths anyway.
- [A future contributor re-adds `build` or `postinstall`] → Mitigation:
  RB-1 forbids trigger names, AGENTS.md records the reason, and the
  install-mode regression is now part of the verification story (github-spec
  install is the canary).
- [opencode later bundles a newer pacote that fixes Windows prepare] → no
  conflict: fewer scripts remain installable under both old and new pacote.

## Migration Plan

Apply → rebuild dist (`bun run bundle`) → tests + typecheck → commit/push →
real-env reinstall via `opencode plugin
github:ChengZiiii/opencode-vision-bridge --global` (removes the need for the
`file://` entry) → verify agent/skill/smoke → restore the
`agent.vision-agent` model knob. Rollback = revert the commit (the old
`file://` mode keeps working regardless).

## Open Questions

None.
