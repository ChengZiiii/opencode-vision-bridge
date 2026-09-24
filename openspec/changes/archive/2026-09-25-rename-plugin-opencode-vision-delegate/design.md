# Design: rename-plugin-opencode-vision-delegate

## Context

Two packages, one name. `opencode-vision-bridge` on npm belongs to
martinmose (pre-captioning architecture, provider-name-list gating, stale
since 2026-07-02). Ours is the kilo-aligned delegation bridge. The user
chose `opencode-vision-delegate` (verified free on npm and GitHub
2026-09-25): domain + mechanism, maximal contrast with the pre-captioning
package.

## Decisions

### D1: temp dir follows the plugin name

`IMAGE_TMP_DIR = join(tmpdir(), "opencode-vision-bridge")` becomes
`"opencode-vision-delegate"`. The file ledger (pitfalls §6) names Source C
after the plugin; keeping them in sync keeps uninstall docs accurate. Old
`<tmp>/opencode-vision-bridge/` leftovers are transient images; no
migration code, no read-back of the old dir (delegations re-materialize on
demand).

### D2: spec delta touches only surviving requirements, headers stay verbatim

The unarchived `fix-windows-plugin-install` change already carries
REMOVED RB-3; renaming inside a requirement slated for removal would
collide at archive time. The rename delta therefore MODIFIES only RB-6
(temp subdir) and RB-7 (README identity/commands). RB-3's old-name mention
disappears with RB-3 when that change archives. Additionally, openspec
matches MODIFIED requirements against the baseline by verbatim header, so
the RB-7 header keeps its baseline text ("...documents
opencode-vision-bridge") while the BODY carries the new name and store
paths — retitling the header would make archive refuse the delta. Note for
archive time: `fix-windows-plugin-install` also modifies RB-7's body; when
the two changes archive, the second one must be reconciled against the
first-archived text (its wording here already folds in that change's
github-spec + no-postinstall content plus the rename additions, so either
order converges).

### D3: historical change artifacts stay verbatim

`fix-windows-plugin-install`'s proposal/design/tasks/delta record the
old-name era (including the verified `github:ChengZiiii/opencode-vision-bridge`
install). Rewriting them would falsify the verification record. They keep
the old name; the archive-time merge only applies requirement deltas, and
those requirements (RB-1/RB-7/RB-9) carry no stale name text beyond what
this change's RB-7 delta already handles — checked: the RB-7 delta in
fix-windows-plugin-install describes install methods generically (npm /
github spec) without re-stating the package name, so no conflict.

### D4: identity bits NOT renamed

Skill id `vision`, tool name `vision_analyze`, subagent id `vision-agent`,
permission contract, `[vision:*]` markers: all unchanged. Renaming any of
them would be a behavior change (breaking user configs and muscle memory)
with zero naming-collision benefit.

### D5: store migration is documented deletion, not code

opencode keys its package store on the sanitized install spec. Renaming the
repo changes the spec string (`github:ChengZiiii/opencode-vision-bridge` →
`github:ChengZiiii/opencode-vision-delegate`), so the reinstall creates a
new store dir and the old one becomes garbage. Documented in the README
rename note + executed in this machine's real env during verification
(official-mode reinstall + old-dir deletion per the 4-step uninstall
discipline).

## Risks / Trade-offs

- GitHub redirects keep old clone URLs and links working; the opencode
  `plugin` config entry with the OLD github spec would still resolve via
  redirect but keep installing the OLD store key — the README rename note
  tells users to switch the entry (and this machine's config is switched
  during verification).
- npm name remains unclaimed until first publish; `npm publish` is blocked
  on login (separate, tracked). Risk of the name being taken in the window
  is accepted (checked free 2026-09-25).

## Open Questions

None.
