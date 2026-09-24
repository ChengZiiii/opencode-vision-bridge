# Delta Spec: vision-bridge

## MODIFIED Requirements

### Requirement: RV-1: Image parts are rewritten only for text-only models

**Requirement:** The `experimental.chat.messages.transform` hook `SHALL`
rewrite image `FilePart`s into `[vision:dropped-image]` text markers only for
user messages whose handling model is NOT vision-capable. For user messages
whose handling model IS vision-capable, image parts `SHALL` pass through
unchanged so the multimodal model receives them natively. Capability `SHALL`
be resolved per message in this order: (1) the message's `info.model`
(`providerID`/`modelID`) looked up case-insensitively against the
vision-capable key set; (2) the message's `info.agent` looked up in the
agent→capability map built at config time; (3) the top-level config `model`
capability as final fallback. The vision-capable key set `SHALL` be built
from the FULL cached models catalog (`~/.cache/opencode/models.json`) merged
with config provider model overrides (`provider(s).<id>.models`), filtered by
image-input capability, and `SHALL NOT` be gated by provider-availability
heuristics (`enabled_providers`, config provider blocks, environment keys, or
stored credentials) — an already-active request model resolves against
catalog metadata alone. The key set includes deprecated models (capability
resolution reflects the model serving the request; the deprecated-status
filter applies only to the discovery/suggestion path, RB-5).

#### Scenario: Multimodal agent keeps native image input

Given a session on an agent whose model is vision-capable and a user message
containing an image FilePart,
when the messages transform runs,
then the FilePart is left untouched (no `[vision:dropped-image]` marker, no
temp file written).

#### Scenario: Text-only agent gets the marker

Given a session on an agent whose model is text-only and a user message
containing an image FilePart,
when the messages transform runs,
then the image bytes are materialized under the plugin temp dir and the part
is rewritten to `[vision:dropped-image]` with the resulting path.

#### Scenario: Capability resolved from message model before agent name

Given a message whose `info.model` is a vision model while `info.agent` maps
to a text-only agent,
when the transform runs,
then the image part is NOT rewritten (message model wins over agent map).

#### Scenario: Keyless provider session keeps native image input

Given a provider that is present in the cached catalog with a multimodal
model (image input modality) but is NOT availability-configured (no
`enabled_providers` entry, no config provider block, no environment key set,
no stored credential — e.g. keyless Zen `opencode/space-bunny-free`), and a
user message whose `info.model` names that model and contains an image
FilePart,
when the messages transform runs,
then the FilePart is left untouched (no `[vision:dropped-image]` marker, no
temp file written).

### Requirement: RV-2: System prompt instructions are model-appropriate

**Requirement:** The `experimental.chat.system.transform` hook `SHALL`
inspect `input.model` (the `Model` shape with `providerID`/`id`) against the
same vision-capable key set as RV-1 (full cached models catalog merged with
config provider model overrides, case-insensitively, NOT gated by provider
availability) and, for a vision-capable model, push a single
`[vision:native]` instruction stating the model sees images natively and
MUST NOT use the vision skill, call `vision_analyze`, or spawn a `vision-*`
subagent. For a text-only model the transform `SHALL` inject nothing —
delegation guidance comes from the vision skill (RV-4), and the plugin
`SHALL` maintain no model-choice state of any kind.

#### Scenario: Multimodal model instructed to use native vision

Given a request whose `input.model` is vision-capable,
when the system transform runs,
then `output.system` contains a `[vision:native]` instruction.

#### Scenario: Text-only model gets no injected instruction

Given a request whose `input.model` is text-only,
when the system transform runs,
then `output.system` receives no vision-related injection.

#### Scenario: No persisted state

Given the plugin is installed,
when the config hook runs and the system transform executes,
then no model-choice file is read or written and no
`[vision:model-choice]`-style instruction is injected.

#### Scenario: Keyless multimodal session gets the native instruction

Given a provider that is present in the cached catalog with a multimodal
model but is NOT availability-configured (no `enabled_providers` entry, no
config provider block, no environment key set, no stored credential), and a
request whose `input.model` names that model,
when the system transform runs,
then `output.system` contains a `[vision:native]` instruction and the
session's images route natively instead of delegating to the vision skill
or `vision_analyze`.
