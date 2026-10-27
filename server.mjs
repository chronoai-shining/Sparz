import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const root = await realpath(new URL('./dist', import.meta.url).pathname);
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const legacyRoutes = new Set(['/kol-marketing-singapore', '/social-media-marketing-singapore', '/rednote-marketing-singapore', '/seo-services-singapore', '/content-creation-singapore', '/paid-advertising-singapore', '/digital-marketing-strategy-singapore', '/marketing-analytics-singapore', '/dianping-marketing-singapore', '/about-singapore-marketing-agency', '/case-studies-singapore', '/contact-digital-marketing-agency', '/free-consultation']);

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'; object-src 'none'");
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : '{"status":"ok","app":"Sparz"}');
      return;
    }
    if (pathname.includes('\0') || pathname.split('/').some(segment => segment.startsWith('.') && segment !== '')) {
      response.writeHead(404).end('Not found');
      return;
    }
    const route = pathname.replace(/\/$/, '');
    const filename = !route || legacyRoutes.has(route) ? '/index.html' : pathname;
    const resolved = await realpath(path.join(root, filename));
    if (!resolved.startsWith(root + path.sep)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const info = await stat(resolved);
    if (!info.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const extension = path.extname(resolved);
    response.setHeader('Content-Type', types[extension] || 'application/octet-stream');
    response.setHeader('Cache-Control', extension === '.html' ? 'no-cache' : pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');
    response.setHeader('Vary', 'Accept-Encoding');
    const compress = /\bgzip\b/.test(request.headers['accept-encoding'] || '') && ['.html', '.css', '.js', '.svg', '.xml'].includes(extension);
    if (compress) response.setHeader('Content-Encoding', 'gzip');
    else response.setHeader('Content-Length', info.size);
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(resolved);
    if (compress) await pipeline(stream, createGzip(), response);
    else await pipeline(stream, response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
    else response.destroy();
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Sparz listening on ${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
