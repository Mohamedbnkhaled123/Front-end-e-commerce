const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = Number(process.env.PORT) || 8081;

const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'dist', 'build-prod', 'browser'))
  ? path.join(__dirname, 'dist', 'build-prod', 'browser')
  : path.join(__dirname, 'dist', 'velora-frontend', 'browser');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  reqPath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, reqPath);

  // If path is directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback for client-side Angular routing
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  let cacheControl = 'no-cache';
  const fileName = path.basename(filePath);
  const isHashedAsset = /-[A-Z0-9]{6,}\.(js|css)$/i.test(fileName);
  const isLongLivedAsset = /\.(woff2|ttf|png|jpg|jpeg|webp|svg|ico)$/i.test(fileName);

  if (isHashedAsset || isLongLivedAsset) {
    cacheControl = 'public, max-age=31536000, immutable';
  } else if (ext === '.js' || ext === '.css') {
    cacheControl = 'public, max-age=3600, must-revalidate';
  }

  const responseHeaders = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': cacheControl,
    'Vary': 'Accept-Encoding',
    'X-Served-By': 'serve-prod'
  };

  const fileStream = fs.createReadStream(filePath);
  
  fileStream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  const shouldCompress = !['.png', '.jpg', '.jpeg', '.webp', '.woff2', '.ttf', '.ico', '.zip'].includes(ext);

  if (shouldCompress && acceptEncoding.match(/\bbr\b/)) {
    responseHeaders['Content-Encoding'] = 'br';
    res.writeHead(200, responseHeaders);
    if (req.method === 'HEAD') return res.end();
    fileStream.pipe(zlib.createBrotliCompress()).pipe(res);
  } else if (shouldCompress && acceptEncoding.match(/\bgzip\b/)) {
    responseHeaders['Content-Encoding'] = 'gzip';
    res.writeHead(200, responseHeaders);
    if (req.method === 'HEAD') return res.end();
    fileStream.pipe(zlib.createGzip()).pipe(res);
  } else {
    res.writeHead(200, responseHeaders);
    if (req.method === 'HEAD') return res.end();
    fileStream.pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Production Bundle Server running on http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
