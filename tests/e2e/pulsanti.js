// Livello 2, punto 2 — premere i pulsanti di generazione nella pagina vera e
// raccogliere ciò che producono, per confrontarlo con i dati attesi.
// Usato da pulsanti-m*.spec.js.
// - Modali: titolo e testo di ogni finestra che si apre (textarea).
// - PDF: non vengono salvati; si registra il testo che la pagina passa a jsPDF.
// - DOCX: il file scaricato viene aperto e se ne legge il testo, paragrafo per paragrafo.
// - Mail: il link mailto: che la pagina apre (destinatario, copia, oggetto, corpo).
// - Stampa della Sintesi: l'HTML scritto nella finestra nuova (window.open finto).
// - Avvisi (alert/confirm), errori in console ed eccezioni nati dal pulsante.

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { expect } = require('./ambiente');

// Gira nella pagina, una volta dopo l'apertura.
function predisponiRegistrazione() {
  window.__registro = { pdf: [], finestre: [] };
  const Originale = window.jspdf.jsPDF;
  window.jspdf.jsPDF = function(...a) {
    const d = new Originale(...a);
    const testi = [];
    const text = d.text.bind(d);
    d.text = (t, ...r) => { testi.push(Array.isArray(t) ? t.join(' ') : String(t)); return text(t, ...r); };
    d.save = nome => { window.__registro.pdf.push({ nome, testo: testi.join('\n') }); };
    return d;
  };
  window.open = () => {
    const html = [];
    window.__registro.finestre.push(html);
    return { document: { write: s => html.push(s), close() {} }, focus() {}, print() {} };
  };
}

async function predisponi(page) {
  const stato = { mail: [], download: [] };
  page.on('request', r => { if (r.url().startsWith('mailto:')) stato.mail.push(r.url()); });
  page.on('download', d => stato.download.push(d));
  await page.evaluate(predisponiRegistrazione);
  return stato;
}

function leggiMail(url) {
  const [indirizzo, query] = url.slice('mailto:'.length).split('?');
  const p = new URLSearchParams(query.replace(/\+/g, '%2B'));
  return { a: decodeURIComponent(indirizzo), cc: p.get('cc') || '', oggetto: p.get('subject') || '', corpo: p.get('body') || '' };
}

async function testoDocx(download) {
  const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
  const xml = await zip.file('word/document.xml').async('string');
  const decodifica = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  return xml.split('</w:p>').map(p => decodifica((p.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')))
    .filter((p, i, a) => p || (i > 0 && a[i - 1])).join('\n').trim();
}

// Preme il pulsante con quell'onclick (il n-esimo, se ce ne sono più d'uno) e
// restituisce ciò che ha prodotto. Il pulsante deve esistere nella pagina.
// Le finestre rimaste aperte vengono chiuse prima di tornare.
async function premi(page, ambiente, stato, onclick, { indice = 0, attendiDownload = /^generaDOCX/.test(onclick) } = {}) {
  const prima = { dialoghi: ambiente.dialoghi.length, errori: ambiente.erroriConsole.length, eccezioni: ambiente.eccezioni.length, mail: stato.mail.length, download: stato.download.length };
  const trovato = await page.evaluate(([oc, i]) => {
    const b = [...document.querySelectorAll('button[onclick]')].filter(b => b.getAttribute('onclick') === oc)[i];
    if (!b) return false;
    b.click();
    return true;
  }, [onclick, indice]);
  expect(trovato, 'pulsante ' + onclick + ' presente nella pagina').toBe(true);
  if (attendiDownload) await expect.poll(() => stato.download.length, { message: 'file scaricato da ' + onclick, timeout: 10000 }).toBeGreaterThan(prima.download);
  await page.waitForTimeout(400);
  const inPagina = await page.evaluate(() => {
    const modali = {};
    document.querySelectorAll('.modal, [id^="modal-"]').forEach(m => {
      if (getComputedStyle(m).display === 'none') return;
      const titolo = (m.querySelector('h2, h3, [id^="titolo-modal"]') || {}).textContent || '';
      modali[m.id] = { titolo: titolo.trim(), testo: [...m.querySelectorAll('textarea')].map(t => t.value).join('\n') };
    });
    const pdf = window.__registro.pdf.splice(0);
    const finestre = window.__registro.finestre.splice(0).map(h => h.join(''));
    return { modali, pdf, finestre };
  });
  const docx = [];
  for (const d of stato.download.slice(prima.download)) docx.push({ nome: d.suggestedFilename(), testo: await testoDocx(d) });
  return {
    ...inPagina,
    docx,
    mail: stato.mail.slice(prima.mail).map(leggiMail),
    dialoghi: ambiente.dialoghi.slice(prima.dialoghi),
    errori: ambiente.erroriConsole.slice(prima.errori),
    eccezioni: ambiente.eccezioni.slice(prima.eccezioni)
  };
}

// Chiude le finestre aperte come farebbe l'utente (la crocetta/Chiudi della finestra).
async function chiudiFinestre(page) {
  await page.evaluate(() => document.querySelectorAll('.modal, [id^="modal-"]').forEach(m => { if (getComputedStyle(m).display !== 'none') m.style.display = 'none'; }));
}

// Testi attesi (registrati e riletti a mano): tests/e2e/attesi/<nome>.json, una voce per documento.
// AGGIORNA_ATTESI=1 li riscrive (solo per cambiamenti voluti e verificati).
const DIR_ATTESI = path.join(__dirname, 'attesi');
function confrontaConAttesi(nomeFile, voce, valore) {
  const file = path.join(DIR_ATTESI, nomeFile + '.json');
  if (process.env.AGGIORNA_ATTESI) {
    const tutti = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    tutti[voce] = valore;
    const ordinati = Object.fromEntries(Object.keys(tutti).sort().map(k => [k, tutti[k]]));
    fs.writeFileSync(file, JSON.stringify(ordinati, null, 2) + '\n');
  }
  const attesi = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(valore, voce + ' (testo registrato in attesi/' + nomeFile + '.json)').toEqual(attesi[voce]);
}

// DOCX di una Determina = testo della bozza, a spazi normalizzati. Fa eccezione
// solo il blocco firme (dalla prima riga con la tabulazione, o dal "Per la copertura
// finanziaria" scritto da solo subito prima, all'ultima con la tabulazione): nel Word
// è una tabella a due colonne e si legge colonna per colonna, quindi lì si controlla
// che ci siano gli stessi pezzi, interi, in qualunque ordine.
function stessoTestoDellaBozza(testoDocx, bozza, nome) {
  const spazi = s => s.replace(/\s+/g, ' ').trim();
  const righe = bozza.split('\n');
  const primaTab = righe.findIndex(r => r.includes('\t'));
  if (primaTab === -1) {
    expect(spazi(testoDocx), nome + ': stesso testo della bozza').toBe(spazi(bozza));
    return;
  }
  let inizio = primaTab;
  for (let k = primaTab - 1; k >= 0 && (righe[k].trim() === '' || righe[k].trim() === 'Per la copertura finanziaria'); k--) {
    if (righe[k].trim()) { inizio = k; break; }
  }
  let fine = primaTab;
  for (let j = primaTab + 1; j < righe.length && (righe[j].includes('\t') || righe[j].trim() === ''); j++) if (righe[j].includes('\t')) fine = j;
  const prima = spazi(righe.slice(0, inizio).join('\n'));
  const dopo = spazi(righe.slice(fine + 1).join('\n'));
  const tutto = spazi(testoDocx);
  expect(tutto.startsWith(prima), nome + ': stesso testo della bozza fino alle firme').toBe(true);
  expect(tutto.endsWith(dopo), nome + ': stesso testo della bozza dopo le firme').toBe(true);
  let firme = ' ' + tutto.slice(prima.length, tutto.length - dopo.length).trim() + ' ';
  const pezzi = righe.slice(inizio, fine + 1).join('\t').split('\t').map(spazi).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const p of pezzi) {
    expect(firme.includes(' ' + p + ' '), nome + ': firma "' + p + '" nel Word').toBe(true);
    firme = firme.replace(' ' + p + ' ', ' ');
  }
  expect(firme.trim(), nome + ': nel blocco firme del Word nient\'altro').toBe('');
}

module.exports = { predisponi, premi, chiudiFinestre, confrontaConAttesi, stessoTestoDellaBozza };
