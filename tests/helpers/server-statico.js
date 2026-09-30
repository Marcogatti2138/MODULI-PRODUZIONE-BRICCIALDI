// Server locale minimo che serve i file del repo ai test end-to-end
// (le pagine aperte come file:// mostrano l'avviso "apertura locale").
const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const PORTA = Number(process.env.PORTA_TEST || 8765);
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg' };

http.createServer(function(req, res) {
  const percorso = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(REPO, percorso === '/' ? 'Dashboard_Briccialdi.html' : percorso);
  if (!file.startsWith(REPO + path.sep) || file.includes(path.sep + 'node_modules' + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, function(err, dati) {
    if (err) { res.writeHead(404); res.end('non trovato'); return; }
    res.writeHead(200, { 'Content-Type': TIPI[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(dati);
  });
}).listen(PORTA, '127.0.0.1', function() { console.log('Server di test su http://127.0.0.1:' + PORTA); });
