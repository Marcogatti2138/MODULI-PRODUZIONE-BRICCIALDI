// Ambiente comune dei test end-to-end.
// - Blocco rete SEMPRE attivo: ogni richiesta verso googleapis.com,
//   firebaseio.com o firebaseapp.com viene annullata e fa fallire il test.
// - Gli script Firebase di gstatic.com sono sostituiti dal finto Firestore.
// - jsPDF e docx arrivano dalle copie locali in node_modules (stesse versioni
//   delle pagine), così i test non dipendono dalle CDN.
// - Qualsiasi altra richiesta esterna viene annullata e annotata.
// - Errori in console, eccezioni e finestre alert/confirm vengono raccolti.

const path = require('path');
const fs = require('fs');
const base = require('@playwright/test');

const DIR_TEST = path.resolve(__dirname, '..');
const FINTO_FIRESTORE = fs.readFileSync(path.join(__dirname, 'finto-firestore.js'), 'utf8');
const LOCALI = {
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': path.join(DIR_TEST, 'node_modules/jspdf/dist/jspdf.umd.min.js'),
  'https://unpkg.com/docx@7.1.0/build/index.js': path.join(DIR_TEST, 'node_modules/docx/build/index.js')
};
const FIREBASE_VIETATO = /(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com)$/i;

const test = base.test.extend({
  // Dati iniziali del finto Firestore: { progetti: { id: {...} } }. Solo dati inventati.
  datiIniziali: [{}, { option: true }],

  ambiente: [async ({ page, datiIniziali }, use) => {
    const stato = { firebaseBloccate: [], esterneBloccate: [], erroriConsole: [], eccezioni: [], dialoghi: [] };

    await page.addInitScript(dati => { window.__FINTO_DB_INIZIALE = dati; }, datiIniziali);

    await page.route('**/*', async route => {
      const url = route.request().url();
      const host = new URL(url).hostname;
      // Google Fonts (fonts.googleapis.com / fonts.gstatic.com) non è Firebase:
      // riceve un foglio di stile vuoto, senza uscire in rete.
      if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
        return route.fulfill({ status: 200, contentType: host === 'fonts.googleapis.com' ? 'text/css' : 'font/woff2', body: '' });
      }
      if (FIREBASE_VIETATO.test(host)) { stato.firebaseBloccate.push(url); return route.abort('blockedbyclient'); }
      if (host === 'www.gstatic.com' && url.includes('/firebasejs/')) {
        return route.fulfill({ status: 200, contentType: 'text/javascript', body: FINTO_FIRESTORE });
      }
      if (LOCALI[url]) return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(LOCALI[url], 'utf8') });
      if (host === '127.0.0.1' || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      stato.esterneBloccate.push(url);
      return route.abort('blockedbyclient');
    });

    page.on('console', msg => { if (msg.type() === 'error') stato.erroriConsole.push(msg.text()); });
    page.on('pageerror', err => stato.eccezioni.push(String(err && err.stack || err)));
    page.on('dialog', async dialog => { stato.dialoghi.push(dialog.type() + ': ' + dialog.message()); await dialog.dismiss(); });

    await use(stato);

    // Controllo finale, sempre: nessun tentativo di contattare Firebase vero.
    base.expect(stato.firebaseBloccate, 'richieste verso Firebase di produzione').toEqual([]);
  }, { auto: true }]
});

module.exports = { test, expect: base.expect };
