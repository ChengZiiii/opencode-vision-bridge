// Routing tests for RV-1/RV-2 capability resolution
// (change: fix-keyless-provider-vision-routing). Drives the real plugin
// module through the config hook + both experimental transforms using the
// OPENCODE_MODELS_PATH / OPENCODE_AUTH_CONTENT env seams. The fixture
// provider is keyless: no enabled_providers, no config provider block,
// OPENCODE_API_KEY unset, empty auth — exactly the availability hole that
// used to drop multimodal Zen sessions' images into delegation markers.
// Run with: node --test tests/*.test.mjs (node >= 22.6 type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CATALOG = {
  opencode: {
    id: "opencode",
    env: ["OPENCODE_API_KEY"],
    api: "https://opencode.ai/zen/v1",
    name: "Zen",
    models: {
      "space-bunny-free": {
        id: "space-bunny-free",
        name: "SB Free",
        attachment: true,
        modalities: { input: ["text", "image", "video"], output: ["text"] },
      },
      "big-pickle": {
        id: "big-pickle",
        name: "Big Pickle",
        attachment: false,
        modalities: { input: ["text"], output: ["text"] },
      },
    },
  },
}

// 1x1 transparent PNG as a data URL (saveImagePart base64-decodes it).
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

let hooks
let scratchDir

async function setup(config) {
  scratchDir = mkdtempSync(join(tmpdir(), "vision-routing-test-"))
  writeFileSync(join(scratchDir, "models.json"), JSON.stringify(CATALOG))
  process.env.OPENCODE_MODELS_PATH = join(scratchDir, "models.json")
  process.env.OPENCODE_AUTH_CONTENT = "{}"
  delete process.env.OPENCODE_API_KEY
  const mod = await import("../plugin.ts")
  hooks = await mod.default.server()
  const cfg = structuredClone(config)
  await hooks.config(cfg)
  return cfg
}

function userMessage(providerID, modelID) {
  return {
    info: {
      role: "user",
      sessionID: "test-session",
      agent: "build",
      model: { providerID, modelID },
    },
    parts: [
      {
        type: "file",
        mime: "image/png",
        url: PNG_DATA_URL,
        id: "part-1",
        filename: "shot.png",
      },
    ],
  }
}

async function transformMessages(messages) {
  const output = { messages }
  await hooks["experimental.chat.messages.transform"]({}, output)
  return output.messages
}

async function transformSystem(providerID, id) {
  const output = { system: [] }
  await hooks["experimental.chat.system.transform"](
    { model: { providerID, id } },
    output,
  )
  return output.system.join("\n")
}

test("keyless multimodal session keeps native image input (RV-1/RV-2)", async () => {
  await setup({})
  const [message] = await transformMessages([userMessage("opencode", "space-bunny-free")])
  assert.equal(message.parts[0].type, "file", "image FilePart must pass through untouched")
  assert.equal(message.parts[0].url, PNG_DATA_URL)
  const system = await transformSystem("opencode", "space-bunny-free")
  assert.match(system, /\[vision:native\]/)
  assert.match(system, /do NOT use the vision skill/i)
})

test("keyless text-only session still drops to the marker path", async () => {
  await setup({})
  const [message] = await transformMessages([userMessage("opencode", "big-pickle")])
  assert.equal(message.parts[0].type, "text")
  const marker = JSON.parse(
    message.parts[0].text.replace(/^\[vision:dropped-image\] /, ""),
  )
  assert.equal(marker.mime, "image/png")
  assert.equal(marker.originalFilename, "shot.png")
  assert.ok(existsSync(marker.path), "dropped image must be materialized to disk")
  const system = await transformSystem("opencode", "big-pickle")
  assert.doesNotMatch(system, /\[vision:native\]/)
})

test("mixed-case provider/model ids still fold to the catalog entry", async () => {
  await setup({})
  const [message] = await transformMessages([userMessage("OpenCode", "Space-Bunny-Free")])
  assert.equal(message.parts[0].type, "file", "folded lookup must recognize mixed-case ids")
  const system = await transformSystem("OpenCode", "Space-Bunny-Free")
  assert.match(system, /\[vision:native\]/)
})

test("config-only custom provider with image modality resolves capable", async () => {
  await setup({
    providers: {
      myprov: {
        models: {
          mymodel: {
            name: "My Model",
            modalities: { input: ["text", "image"] },
          },
        },
      },
    },
  })
  const [message] = await transformMessages([userMessage("myprov", "mymodel")])
  assert.equal(message.parts[0].type, "file")
  const system = await transformSystem("myprov", "mymodel")
  assert.match(system, /\[vision:native\]/)
})

test.after(() => {
  if (scratchDir) rmSync(scratchDir, { recursive: true, force: true })
})
