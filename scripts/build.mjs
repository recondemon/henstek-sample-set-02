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

// Browser companions are published alongside the native source and desktop renderer.
const previewFs = await import('node:fs/promises');
await previewFs.cp(resolve(root, 'samples/mobile-preview'), resolve(root, 'docs/mobile'), {recursive: true});
for (const name of ['sample-viewer.js', 'sample-viewer.css', 'preview-bridge.js'])
  await previewFs.copyFile(resolve(root, 'public', name), resolve(root, 'docs', name));
for (const platform of ['web', 'desktop', 'mobile']) {
  const file = resolve(root, 'docs', platform, 'index.html');
  const html = await previewFs.readFile(file, 'utf8');
  await previewFs.writeFile(file, html.replace('</body>', '<script src="../preview-bridge.js" defer></script></body>'));
}
