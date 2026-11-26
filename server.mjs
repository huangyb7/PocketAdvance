/**
 * 掌机口袋 · 本地静态服务器
 * WebAssembly / Worker 不允许 file:// 加载，所以用这个脚本起一个本地服务。
 *
 *   node server.mjs          → http://127.0.0.1:8123
 *   node server.mjs 9000     → 指定端口
 *   node server.mjs --no-open
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".gba": "application/octet-stream",
  ".gz": "application/gzip",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const args = process.argv.slice(2);
const noOpen = args.includes("--no-open");
const portArg = args.find((a) => /^\d+$/.test(a));
let port = portArg ? Number(portArg) : 8123;

function serve(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  if (pathname === "/") pathname = "/index.html";

  const target = path.normalize(path.join(ROOT, pathname));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404 Not Found: " + pathname);
      return;
    }

    const type = MIME[path.extname(target).toLowerCase()] || "application/octet-stream";
    const headers = {
      "content-type": type,
      "content-length": stat.size,
      "cache-control": "no-store",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-resource-policy": "same-origin"
    };

    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        const start = m[1] ? Number(m[1]) : 0;
        const end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
        if (start >= stat.size || start > end) {
          res.writeHead(416, { "content-range": `bytes */${stat.size}` }).end();
          return;
        }
        res.writeHead(206, {
          ...headers,
          "content-length": end - start + 1,
          "content-range": `bytes ${start}-${end}/${stat.size}`,
          "accept-ranges": "bytes"
        });
        fs.createReadStream(target, { start, end }).pipe(res);
        return;
      }
    }

    headers["accept-ranges"] = "bytes";
    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(target).pipe(res);
  });
}

const server = http.createServer(serve);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`端口 ${port} 被占用，试试 ${port + 1}…`);
    port += 1;
    server.listen(port, "127.0.0.1");
  } else {
    console.error(err);
    process.exit(1);
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log("");
  console.log("  ┌──────────────────────────────────────────┐");
  console.log("  │  掌机口袋 POCKET ADVANCE                 │");
  console.log("  └──────────────────────────────────────────┘");
  console.log(`  已启动： ${url}`);
  console.log("  按 Ctrl + C 停止服务");
  console.log("");
  if (!noOpen && process.platform === "win32") {
    exec(`start "" "${url}"`);
  }
});
