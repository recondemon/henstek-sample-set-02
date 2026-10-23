import { mkdir, copyFile, rm, cp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
await rm(resolve(root, "docs"), { recursive: true, force: true });
await mkdir(resolve(root, "docs"), { recursive: true });
for (const file of ["index.html", "catalog.css"])
  await copyFile(resolve(root, "public", file), resolve(root, "docs", file));
for (const [source, target, files] of [
  ["samples/website", "web", ["index.html", "styles.css", "app.js", "catalog.mjs"]],
  ["samples/desktop", "desktop", ["index.html", "styles.css", "renderer.js", "model.js"]],
]) {
  await mkdir(resolve(root, "docs", target), { recursive: true });
  for (const f of files) await copyFile(resolve(root, source, f), resolve(root, "docs", target, f));
  await cp(resolve(root, source, "assets"), resolve(root, "docs", target, "assets"), {
    recursive: true,
  });
}
await cp(resolve(root, "public/previews"), resolve(root, "docs/previews"), { recursive: true });
await writeFile(resolve(root, "docs/.nojekyll"), "");
console.log("Built Side A catalog, website and desktop preview in docs/.");
