const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT;
const DIST_DIR = path.join(__dirname, 'dist');
const API_TARGET = 'http://127.0.0.1:9380';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

// Proxy function for API requests
const proxyRequest = (req, res) => {
  const targetUrl = url.parse(API_TARGET + req.url);
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host,
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy Error');
  });

  req.pipe(proxy, { end: true });
};

// Serve static files
const serveStaticFile = (req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Remove query parameters
  filePath = filePath.split('?')[0];

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // For SPA, serve index.html for all routes
        fs.readFile(path.join(DIST_DIR, 'index.html'), (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
};

const server = http.createServer((req, res) => {
  // Check if it's an API request
  if (req.url.startsWith('/api') || req.url.startsWith('/v1')) {
    proxyRequest(req, res);
  } else {
    serveStaticFile(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}, PID: ${process.pid}`);
  console.log(`Proxying API requests to ${API_TARGET}`);
});
