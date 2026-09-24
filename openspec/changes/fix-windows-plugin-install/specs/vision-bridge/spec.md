# Delta Spec: vision-bridge

## MODIFIED Requirements

### Requirement: RB-1: Package manifest targets the opencode plugin SDK

**Requirement:** The package `SHALL` declare `@opencode-ai/plugin` `^1.18.0`
in both `peerDependencies` and `devDependencies`, expose the built
`dist/index.js` through both `exports["."]` and `exports["./server"]` (the
latter is what `opencode plugin`'s manifest reader detects), and declare an
`engines.opencode` range of `^1.18.0` so incompatible opencode versions skip
loading with a warning. The manifest `scripts` `SHALL NOT` declare any of the
pacote prepare-trigger names — `preinstall`, `install`, `postinstall`,
`prepack`, `prepare`, `build` — and the manifest `SHALL NOT` declare a
`workspaces` field (a seventh trigger; see anomalyco/opencode issue #49704),
because opencode 1.18.32's bundled pacote forces git-dep preparation (an
inner `npm install` in the cloned repo) for git/github-spec installs whenever
ANY of those triggers is present, and that preparation fails inside the
compiled opencode binary (the spawned `npm-cli.js` runs under the opencode
executable itself). The build task `SHALL` use a non-trigger script name
(`bundle`).

#### Scenario: Install resolves the 1.18.x SDK

Given the package manifest declares `@opencode-ai/plugin` `^1.18.0` in
`peerDependencies` and `devDependencies`,
when `bun install` runs,
then `bun.lock` is regenerated and contains `@opencode-ai/plugin` 1.x
and the build (`bun run bundle`) produces a self-contained `dist/index.js`.

#### Scenario: CLI compatibility range

Given `package.json` declares `"engines": { "opencode": "^1.18.0" }`,
when an opencode CLI outside that range loads the plugin,
then the plugin is skipped with a warning instead of failing the load.

#### Scenario: Git-spec plugin install skips preparation

Given the manifest declares no prepare-trigger script,
when `opencode plugin github:<owner>/<repo> [--global]` installs the plugin
(opencode 1.18.32, Windows host),
then the install completes without git dep preparation (no inner
`npm install`) and the plugin registers on the next launch.

### Requirement: RB-7: README documents opencode-vision-bridge

**Requirement:** `README.md` `SHALL` describe the plugin's purpose, the
verified installation methods for opencode 1.18.32 (`opencode plugin <pkg>
[--global] [--force]` npm/github install, `file://` config path, single-file
`~/.config/opencode/plugin/`), the dual v1/v2 entry explanation, the single
`vision-agent` subagent registered WITHOUT a default model, the agent model
override as the single vision model knob for both the `vision_analyze` tool
and the subagent, the request tuning knobs (VT-7), the auto-allowed
`vision_analyze` permission (explicit user `deny` wins), the tool-first /
subagent-fallback routing, the disable option (`disable: true` disables both
paths), per-model vision routing (multimodal models receive image parts
natively and do not delegate; text-only models receive
`[vision:dropped-image]` markers and delegate), skill discovery
(`skills.paths` package scan; manual copy for single-file installs), manual
uninstall (remove the `plugin` entry from the opencode config, delete the
`~/.cache/opencode/packages/<sanitized-spec>` store directory, delete a stale
`~/.config/opencode/skills/vision/` if present, optionally remove the
`agent.vision-agent` model knob), troubleshooting, and attribution to the
upstream MIT projects.

#### Scenario: Installation method verified

Given the README lists the loading methods,
then each method reflects the on-machine verification performed during the
port (works on opencode 1.18.32 sandbox; the github-spec method additionally
verified on 2026-09-25 after the trigger-script removal).

### Requirement: RB-9: Skill discovery is package-path based

**Requirement:** The plugin `SHALL` register the vision skill for discovery
by pushing the package data dir (the directory containing `SKILL.md`) onto
`config.skills.paths` in the `config` hook; opencode scans `**/SKILL.md`
under each path from the live merged config with absolute paths allowed and
no trust gating (opencode has no `skill_path_origins` mechanism). The plugin
`SHALL NOT` write, copy, or sync `SKILL.md` (or any mirror of it) into the
opencode config skills directory (`~/.config/opencode/skills/` or
equivalent) at module load or at any other time — this mirrors the kilo
upstream spec decision (remove-skill-mirror-sync). Skill discovery `SHALL`
come from the installed package directory, which resolves from the plugin's
own location (`import.meta.url`) so it follows package upgrades
automatically. The package `SHALL NOT` ship a skill installer script (no
postinstall copy); single-file `~/.config/opencode/plugin/` installs `SHALL`
rely on the documented manual `SKILL.md` copy.

#### Scenario: Package install discovers the skill without a mirror

Given a package install (`file://` path, npm, or github spec) with NO
`~/.config/opencode/skills/vision/SKILL.md` file present,
when the plugin loads and skills are scanned,
then the `vision` skill is discoverable from the installed package
directory via `skills.paths`.

#### Scenario: Module load performs no config-dir writes

Given the plugin loads,
when module evaluation runs,
then no file is written under the opencode config skills directory
(`~/.config/opencode/skills/` or equivalent).

## REMOVED Requirements

### Requirement: RB-3: Skill installer targets the opencode config dir

**Reason:** The installer (`scripts/install-skill.mjs`, wired as npm
`postinstall`) is the direct cause of the official-mode install failure:
opencode 1.18.32's bundled pacote forces git-dep preparation for
git/github-spec installs whenever `postinstall` (or any other prepare-trigger
script) is declared, and that preparation fails on Windows. The copy was also
redundant: the config hook already registers the package data dir on
`config.skills.paths`, so package installs discover the skill without any
mirror.

**Migration:** Package installs (`opencode plugin <pkg|github:...>`,
`file://`) need nothing — discovery is package-path based (RB-9). Single-file
`~/.config/opencode/plugin/` installs copy `SKILL.md` manually as documented
in the README. A stale `~/.config/opencode/skills/vision/` from an earlier
install keeps working (opencode scans config skills paths) and can be deleted
safely once the plugin is installed via a package mode.
