// simple-static-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const baseDir = path.resolve(__dirname); // serve files relative to this script

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  // prevent directory traversal attacks
  const safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(baseDir, safeSuffix);

  // default to index.html for directories or root
  if (filePath.endsWith(path.sep)) filePath += 'index.html';
  if (filePath === baseDir + path.sep) filePath += 'index.html';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => {
      res.statusCode = 500;
      res.end('500 Internal Server Error');
    });
  });
}).listen(port, () => {
  console.log(`Static server running at http://localhost:${port}/`);
});

