import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function load(name) {
  const source = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`);
}

const variants = await load("media-variants");
const asset = { id: "track", kind: "AUDIO", url: "https://example.test/a.mp3", variantIds: ["foreign", "video"] };
const sources = [
  { id: "foreign", mediaAssetId: "another", kind: "VIDEO", url: "https://example.test/wrong.mp4" },
  { id: "video", mediaAssetId: "track", kind: "VIDEO", url: "https://example.test/right.mp4" },
  { id: "standard", mediaAssetId: "track", kind: "AUDIO", quality: "STANDARD", url: asset.url },
];
assert.equal(variants.mediaUrlForKind(asset, sources, "VIDEO"), sources[1].url);
assert.equal(variants.siblingMediaVariants(asset, sources).length, 2);
assert.equal(variants.preferredMediaVariant(asset, sources, "high").id, "standard");
assert.equal(variants.mediaUrlForKind(asset, sources.slice(0, 1), "VIDEO"), undefined);
assert.equal(variants.preserveMediaPosition(-100, 3000), 0);
assert.equal(variants.preserveMediaPosition(9000, 3000), 3000);
assert.equal(variants.preserveMediaPosition(NaN), 0);

const handlers = new Map();
const session = { metadata: null, playbackState: "none", setActionHandler(action, handler) { handlers.set(action, handler); }, setPositionState(state) { this.position = state; } };
Object.defineProperty(globalThis, "navigator", { value: { mediaSession: session }, configurable: true });
globalThis.MediaMetadata = class { constructor(options) { Object.assign(this, options); } };
const media = await load("media-session");
const quran = media.createMediaSessionOwner("quran");
const spoken = media.createMediaSessionOwner("spoken");
media.setMediaSessionMetadata({ owner: quran, title: "Quran", artist: "Reciter", album: "RIHLA", actions: { play() {} } });
media.setMediaSessionMetadata({ owner: spoken, title: "Spoken", artist: "Author", album: "RIHLA", actions: { play() {} } });
media.clearMediaSession(["play"], quran);
assert.equal(session.metadata.title, "Spoken");
assert.equal(typeof handlers.get("play"), "function");
media.setMediaSessionPlayback({ owner: quran, state: "playing", duration: 10, position: 2 });
assert.equal(session.playbackState, "none");
media.setMediaSessionPlayback({ owner: spoken, state: "playing", duration: 10, position: 12 });
assert.equal(session.position.position, 10);
media.clearMediaSession(["play"], spoken);
assert.equal(session.metadata, null);
assert.equal(handlers.get("play"), null);
console.log("Player: variant ownership, quality fallback, timestamp bounds and MediaSession handover passed.");
