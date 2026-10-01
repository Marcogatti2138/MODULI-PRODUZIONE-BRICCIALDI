// ═══ IMPORTI IN FORMATO ITALIANO — condiviso da Dashboard e Moduli 1-4 ═══
// Caricato prima di determina-legale.js, che lo usa per le Determine.

// Converte un importo scritto all'italiana in numero JS:
//   "1.037,40" → 1037.4    "1037,4" → 1037.4    "€ 850" → 850
//   "12.000"   → 12000     (punti delle migliaia senza decimali)
//   "1.50"     → 1.5       (non ha gruppi di tre cifre: il punto resta decimale)
// Restituisce NaN se il testo è vuoto o non è un importo.
function parseImportoIt(s) {
  if (!s) return NaN;
  var pulito = String(s).trim().replace(/[€\s]/g, '');
  if (pulito.indexOf(',') !== -1) pulito = pulito.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(pulito)) pulito = pulito.replace(/\./g, '');
  return parseFloat(pulito);
}

// Arrotonda al centesimo, metà per eccesso (0,495 → 0,50), senza gli errori della
// rappresentazione binaria: nel calcolatore 2,25 × 0,22 vale 0,4949999…, e un
// arrotondamento diretto darebbe 0,49.
function arrotondaCentesimi(n) {
  if (isNaN(n)) return NaN;
  var segno = n < 0 ? -1 : 1;
  var pulito = Number(Math.abs(n).toPrecision(15)); // toglie il "rumore" oltre la 15ª cifra
  var testo = String(pulito);
  var cent = testo.indexOf('e') === -1 ? Math.round(Number(testo + 'e2')) : Math.round(pulito * 100);
  return segno * cent / 100;
}

// Converte un numero (es. 1037.4) nel formato italiano "1.037,40", arrotondato al centesimo.
// Separatore delle migliaia fatto a mano: toLocaleString('it-IT') in Chrome non lo
// mette sotto i 10.000 (es. "1464,00" invece di "1.464,00").
function formattaImportoIt(n) {
  if (isNaN(n)) return '[___ importo ___]';
  var arrotondato = arrotondaCentesimi(n);
  var parti = Math.abs(arrotondato).toFixed(2).split('.');
  return (arrotondato < 0 ? '-' : '') + parti[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parti[1];
}

// IVA al 22% per le Determine: imponibile e IVA arrotondati al centesimo una volta sola,
// totale = imponibile + IVA arrotondata, così i numeri scritti nel testo tornano sempre.
function calcolaIva22(imponibile) {
  if (isNaN(imponibile)) return { imponibile: NaN, iva: NaN, totale: NaN };
  var imp = arrotondaCentesimi(imponibile);
  var iva = arrotondaCentesimi(imp * 0.22);
  return { imponibile: imp, iva: iva, totale: arrotondaCentesimi(imp + iva) };
}
