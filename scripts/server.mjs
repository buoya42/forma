import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => { const i=process.argv.indexOf(name); return i>=0?process.argv[i+1]||fallback:fallback; };
const dir = resolve(here, arg('--dir','.'));
const port = Number(arg('--port','4173'));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/markdown; charset=utf-8','.ico':'image/x-icon'};
const server = http.createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(dir, `.${pathname}`);
    if (!file.startsWith(dir + sep) && file !== resolve(dir,'index.html')) { res.writeHead(403);res.end('Forbidden');return; }
    let info;
    try { info=await stat(file); } catch { res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return; }
    if (!info.isFile()) { res.writeHead(404);res.end('Not found');return; }
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    createReadStream(file).pipe(res);
  } catch { res.writeHead(400);res.end('Bad request'); }
});
server.listen(port,'0.0.0.0',()=>console.log(`FORMA server: http://localhost:${port}/ (root: ${dir})`));
