const fs = require('fs');
const path = require('path');

const root = __dirname;
const output = path.join(root, 'dist');
const serverOutput = path.join(output, 'server');
const allowedExtensions = new Set(['.html', '.svg', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);
const files = {};

for (const name of fs.readdirSync(root)) {
  const filePath = path.join(root, name);
  if (!fs.statSync(filePath).isFile() || !allowedExtensions.has(path.extname(name).toLowerCase())) continue;
  files[name] = fs.readFileSync(filePath).toString('base64');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(serverOutput, { recursive: true });

const worker = `const files = ${JSON.stringify(files)};
const mime = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon' };
export default { fetch(request) { const url = new URL(request.url); let name = decodeURIComponent(url.pathname).replace(/^\\/+/, '') || 'couponint.html'; if (name === '') name = 'couponint.html'; const data = files[name] || (files[name + '.html']); if (!data) return new Response('Not found', { status: 404 }); const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : '.html'; const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0)); return new Response(bytes, { headers: { 'content-type': mime[ext] || 'application/octet-stream', 'cache-control': 'no-cache' } }); } };
`;
fs.writeFileSync(path.join(serverOutput, 'index.js'), worker);
