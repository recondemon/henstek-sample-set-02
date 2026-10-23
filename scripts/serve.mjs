import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import "./build.mjs";
const root = resolve(import.meta.dirname, "../docs");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
};
createServer(async (req, res) => {
  try {
    let path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(4332, "127.0.0.1", () => console.log("Local: http://127.0.0.1:4332"));
