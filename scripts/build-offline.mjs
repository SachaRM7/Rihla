import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const nextBuild = process.env.VERCEL === "1";
const output = join(root, nextBuild ? "public" : "dist/client");
const staticRoot = join(root, nextBuild ? ".next/static" : "dist/client/_next");
const hash = createHash("sha256");
const assets = ["/favicon.svg", "/manifest.webmanifest"];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(?:js|css|woff2?|png|svg|webp)$/.test(entry.name)) {
      const url = nextBuild ? `/_next/static/${relative(staticRoot, path).replaceAll("\\", "/")}` : `/${relative(output, path).replaceAll("\\", "/")}`;
      assets.push(url);
      hash.update(url).update(await readFile(path));
    }
  }
}

await stat(staticRoot);
await walk(staticRoot);
for (const file of ["sw.js", "offline-worker.js", "favicon.svg", "manifest.webmanifest"]) hash.update(await readFile(join(root, "public", file)));
const manifest = { version: hash.digest("hex").slice(0, 20), assets: assets.sort() };
await writeFile(join(output, "offline-precache.js"), `self.RIHLA_PRECACHE=${JSON.stringify(manifest)};\n`);
if (!nextBuild) {
  const headersPath = join(output, "_headers");
  const existing = await readFile(headersPath, "utf8").catch(() => "");
  const rules = ["/sw.js", "/offline-precache.js", "/offline-worker.js"].map((path) => `${path}\n  Cache-Control: no-cache\n`).join("\n");
  await writeFile(headersPath, `${existing}\n${rules}`);
}
console.log(`Offline shell: ${assets.length} assets, version ${manifest.version}`);
