const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const root = __dirname;
const port = Number(process.env.PORT || process.argv[2] || 5500);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    const parsed = url.parse(req.url || "/");
    let reqPath = decodeURIComponent(parsed.pathname || "/");
    if (reqPath === "/") reqPath = "/index.html";
    const normalized = path.normalize(reqPath).replace(/^(\.\.[\\/])+/, "");
    const absolute = path.join(root, normalized);

    if (!absolute.startsWith(root)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.stat(absolute, (err, stat) => {
      if (!err && stat.isFile()) {
        sendFile(res, absolute);
        return;
      }
      if (!err && stat.isDirectory()) {
        const indexFile = path.join(absolute, "index.html");
        fs.stat(indexFile, (idxErr, idxStat) => {
          if (!idxErr && idxStat.isFile()) {
            sendFile(res, indexFile);
            return;
          }
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not Found");
        });
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    });
  })
  .listen(port, () => {
    console.log(`VLERA frontend running on http://localhost:${port}`);
  });

