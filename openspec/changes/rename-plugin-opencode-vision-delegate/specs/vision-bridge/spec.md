# Delta Spec: vision-bridge

## MODIFIED Requirements

### Requirement: RB-6: SKILL.md is opencode-ized

**Requirement:** `SKILL.md` `SHALL` use opencode terminology throughout, name
`opencode-vision-delegate` as the temporary image subdirectory, and `SHALL
NOT` reference any model discovery script or picker flow — the
`vision-agent` model is configured by the user through the agent model
override in opencode config. The skill's documented tool-call contract
(argument names, error-category prefixes, fallback routing) `SHALL` match the
plugin's tool definition exactly.

#### Scenario: Skill docs match plugin behavior

Given the plugin materializes dropped images under
`<system-temp>/opencode-vision-delegate/`,
when the skill describes Source D,
then it documents `[vision:dropped-image]` with `path` under
`opencode-vision-delegate`.

### Requirement: RB-7: README documents opencode-vision-bridge

**Requirement:** `README.md` `SHALL` describe the plugin's purpose under the
name `opencode-vision-delegate`, the verified installation methods for
opencode 1.18.32 (`opencode plugin opencode-vision-delegate [--global]
[--force]` npm install, `opencode plugin
github:ChengZiiii/opencode-vision-delegate --global` git-spec install,
`file://` config path, single-file `~/.config/opencode/plugin/`), the dual
v1/v2 entry explanation, the single `vision-agent` subagent registered
WITHOUT a default model, the agent model override as the single vision model
knob for both the `vision_analyze` tool and the subagent, the request tuning
knobs (VT-7), the auto-allowed `vision_analyze` permission (explicit user
`deny` wins), the tool-first / subagent-fallback routing, the disable option
(`disable: true` disables both paths), per-model vision routing (multimodal
models receive image parts natively and do not delegate; text-only models
receive `[vision:dropped-image]` markers and delegate), skill discovery
(`skills.paths` package scan; manual copy for single-file installs), manual
uninstall (remove the `plugin` entry from the opencode config, delete the
`~/.cache/opencode/packages/` store dir for the installed spec — e.g.
`opencode_vision_delegate` for the npm name or
`github_ChengZiiii_opencode-vision-delegate` for the git spec), the
`<system-temp>/opencode-vision-delegate/` image temp dir, a rename note for
users of the pre-rename `github:ChengZiiii/opencode-vision-bridge` spec
(switch the config entry, delete the old store dir), troubleshooting, and
attribution to the upstream MIT projects.

#### Scenario: Installation method verified

Given the README lists the loading methods,
then each method reflects the on-machine verification performed during the
port (works on opencode 1.18.32 sandbox).

#### Scenario: Rename migration documented

Given a user installed the plugin under the pre-rename github spec
`github:ChengZiiii/opencode-vision-bridge`,
when they read the README rename note,
then they know to switch the `plugin` entry to
`github:ChengZiiii/opencode-vision-delegate`, reinstall via `opencode
plugin`, and delete the old store dir
`~/.cache/opencode/packages/github_ChengZiiii_opencode-vision-bridge`.
