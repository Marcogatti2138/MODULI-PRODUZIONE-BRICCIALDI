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
