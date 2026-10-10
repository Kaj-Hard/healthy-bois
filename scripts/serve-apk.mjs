// Serves release/healthy-bois.apk on the local network so a phone can download it.
// Usage: npm run serve:apk  (then open the printed URL on the phone)
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const apk = join(root, 'release', 'healthy-bois.apk');
const port = Number(process.env.PORT ?? 8080);

if (!existsSync(apk)) {
  console.error('No APK yet. Run `npm run android:apk` first.');
  process.exit(1);
}

const page = () => {
  const { size, mtime } = statSync(apk);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Healthy Bois</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4efff;font-family:system-ui,sans-serif;color:#2d2547;text-align:center;padding:24px;box-sizing:border-box}
h1{font-size:36px;margin:8px 0}p{color:#7a7194;font-weight:600;line-height:1.5}
a{display:inline-block;margin-top:18px;padding:18px 34px;border-radius:18px;background:#9b7bff;color:#fff;font-weight:900;font-size:20px;text-decoration:none;box-shadow:0 5px 0 #6e4fd6;letter-spacing:.03em}
small{display:block;margin-top:22px;color:#a49cb5}</style></head><body><div>
<div style="font-size:72px">💪</div><h1>Healthy Bois</h1>
<p>Tap download, then open the file and allow<br>“Install unknown apps” for your browser if asked.</p>
<a href="/healthy-bois.apk" download>DOWNLOAD APP</a>
<small>${(size / 1024 / 1024).toFixed(1)} MB · built ${mtime.toLocaleString()}</small></div></body></html>`;
};

createServer((req, res) => {
  if (req.url?.startsWith('/healthy-bois.apk')) {
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': statSync(apk).size,
      'Content-Disposition': 'attachment; filename="healthy-bois.apk"',
    });
    createReadStream(apk).pipe(res);
    console.log(`📲 APK downloaded by ${req.socket.remoteAddress}`);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page());
}).listen(port, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  console.log('Open one of these on your phone (same Wi-Fi):');
  for (const ip of ips) console.log(`  http://${ip}:${port}`);
});
