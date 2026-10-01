// Bug 1 — lettura degli importi scritti all'italiana nei preventivi.
// "12.000" (punto delle migliaia, senza decimali) veniva letto come 12:
// la Determina impegnava € 14,64 e nominava il RUP sbagliato.

const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGINE, leggi, funzioniDelFile, caricaFunzioni, caricaFile } = require('../helpers/estrai-funzioni');

// La parseImportoIt che una pagina usa davvero: la sua copia interna se c'è,
// altrimenti quella del file condiviso importi.js, se la pagina lo carica.
function parseImportoItDellaPagina(file) {
  if (funzioniDelFile(file).parseImportoIt) return caricaFunzioni(file, ['parseImportoIt']).parseImportoIt;
  if (/<script src="importi\.js"><\/script>/.test(leggi(file))) return caricaFile('importi.js').parseImportoIt;
  throw new Error(file + ': nessuna parseImportoIt disponibile');
}

const CASI = [
  ['850,00', 850],
  ['850', 850],
  ['1500', 1500],
  ['1.500', 1500],
  ['12.000', 12000],
  ['1.234.567', 1234567],
  ['1.500,00', 1500],
  ['4.999,99', 4999.99],
  ['€ 12.000', 12000],
  ['12.000 €', 12000],
  ['12,5', 12.5],
  ['1.50', 1.5],          // non è un numero con le migliaia: resta decimale
  ['0,99', 0.99]
];

for (const [sigla, file] of Object.entries(PAGINE)) {
  test(sigla + ' — parseImportoIt legge gli importi all\'italiana', () => {
    const parseImportoIt = parseImportoItDellaPagina(file);
    for (const [testo, atteso] of CASI) {
      assert.equal(parseImportoIt(testo), atteso, JSON.stringify(testo));
    }
    assert.ok(Number.isNaN(parseImportoIt('')), 'vuoto');
    assert.ok(Number.isNaN(parseImportoIt(null)), 'null');
    assert.ok(Number.isNaN(parseImportoIt('da definire')), 'testo');
  });
}

test('Determina Trasporti con preventivo "12.000": importo, IVA e RUP corretti', () => {
  const parseImportoIt = parseImportoItDellaPagina(PAGINE.M1);
  const formattaImportoIt = funzioneDellaPagina(PAGINE.M1, 'formattaImportoIt');
  const ctx = caricaFile('determina-legale.js', { parseImportoIt, formattaImportoIt, calcolaIva22: caricaFile('importi.js').calcolaIva22 });
  const scelto = { ditta: 'Ditta Prova Uno', importo: '12.000', prot: '0001', data: '01/01/2030', indirizzo: 'Via Inventata 1, Paese Prova', piva: '00000000000' };
  const righe = ctx.costruisciTestoDeterminaTrasporti({
    scelto: scelto,
    preventivi: [scelto],
    protRichiesta: '0000',
    scadenzaDataRichiesta: '01/01/2030',
    scadenzaOraRichiesta: '12:00',
    fraseOggetto: 'del progetto "Progetto di prova"',
    frasePremesso: '"Progetto di prova"',
    eventoRichiamatoTxt: 'dell\'evento richiamato',
    realizzazioneEventoTxt: 'dell\'evento',
    fraseDeterminaFinale: '',
    messaggioNessunaTappa: 'nessuna tappa',
    calendarioLines: ['– 01/02/2030: prova — da Conservatorio a Sala Prova;']
  });
  const testo = righe.join('\n');
  assert.match(testo, /somma complessiva di € 14\.640,00, di cui € 2\.640,00 per IVA/);
  assert.match(testo, /di nominare Dott\.ssa Susanna Fanizza quale Responsabile Unico del Progetto/);
  assert.doesNotMatch(testo, /di nominare Dott\.ssa Alessandra Angelucci/);
  assert.doesNotMatch(testo, /importo inferiore a € 5\.000,00/);
});

// ── Bug A: arrotondamento dei centesimi e IVA nelle Determine ────────────────
// formattaImportoIt arrotondava per difetto i valori come 0,495 (IVA di 2,25 € = 0,49
// invece di 0,50). Nelle Determine l'IVA si arrotonda al centesimo una volta sola e il
// totale è imponibile + IVA arrotondata, così i numeri scritti tornano sempre.

function funzioneDellaPagina(file, nome) {
  if (funzioniDelFile(file)[nome]) return caricaFunzioni(file, [nome])[nome];
  if (/<script src="importi\.js"><\/script>/.test(leggi(file))) {
    const f = caricaFile('importi.js')[nome];
    if (f) return f;
  }
  throw new Error(file + ': nessuna ' + nome + ' disponibile');
}

// Formato italiano scritto a partire dai centesimi interi (riferimento indipendente).
function daCentesimi(c) {
  const euro = String(Math.floor(Math.abs(c) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (c < 0 ? '-' : '') + euro + ',' + String(Math.abs(c) % 100).padStart(2, '0');
}

for (const [sigla, file] of Object.entries(PAGINE)) {
  test(sigla + ' — formattaImportoIt: migliaia, decimali e arrotondamento al centesimo', () => {
    const formattaImportoIt = funzioneDellaPagina(file, 'formattaImportoIt');
    const casi = [[0, '0,00'], [5, '5,00'], [850, '850,00'], [1464, '1.464,00'], [12000, '12.000,00'],
      [14640, '14.640,00'], [1234567.89, '1.234.567,89'], [0.5, '0,50'], [-1500, '-1.500,00'],
      [0.495, '0,50'], [2.25 * 0.22, '0,50'], [1.25 * 1.22, '1,53'], [1.005, '1,01'], [2.675, '2,68'], [0.004, '0,00']];
    for (const [n, atteso] of casi) assert.equal(formattaImportoIt(n), atteso, String(n));
    assert.equal(formattaImportoIt(NaN), '[___ importo ___]');
  });
}

test('calcolaIva22: IVA arrotondata una volta, totale = imponibile + IVA', () => {
  const { calcolaIva22 } = caricaFile('importi.js');
  assert.equal(typeof calcolaIva22, 'function', 'calcolaIva22 assente in importi.js');
  assert.deepEqual({ ...calcolaIva22(2.25) }, { imponibile: 2.25, iva: 0.5, totale: 2.75 });
  assert.deepEqual({ ...calcolaIva22(12000) }, { imponibile: 12000, iva: 2640, totale: 14640 });
  const nan = calcolaIva22(NaN);
  assert.ok(Number.isNaN(nan.iva) && Number.isNaN(nan.totale));
});

test('calcolaIva22 + formattaImportoIt: corretti per ogni importo da 0,01 a 20.000,00 €', () => {
  const { calcolaIva22, formattaImportoIt } = caricaFile('importi.js');
  const errori = [];
  for (let c = 1; c <= 2000000 && errori.length < 5; c++) {
    const r = calcolaIva22(c / 100);
    const ivaCent = Math.round(c * 22 / 100);   // metà per eccesso, su interi
    if (formattaImportoIt(r.iva) !== daCentesimi(ivaCent)) errori.push(daCentesimi(c) + ': IVA ' + formattaImportoIt(r.iva));
    if (formattaImportoIt(r.totale) !== daCentesimi(c + ivaCent)) errori.push(daCentesimi(c) + ': totale ' + formattaImportoIt(r.totale));
  }
  assert.deepEqual(errori, []);
});

test('Determine: nessun calcolo dell\'IVA fuori da importi.js', () => {
  const file = ['determina-legale.js', 'coerenza-date.js', 'righe-dinamiche.js', ...Object.values(PAGINE)];
  const trovati = file.filter(f => /\*\s*(0\.22|1\.22)\b/.test(leggi(f)));
  assert.deepEqual(trovati, []);
});

function determina(costruttore, cfgExtra) {
  const formattaImportoIt = funzioneDellaPagina(PAGINE.M1, 'formattaImportoIt');
  const parseImportoIt = funzioneDellaPagina(PAGINE.M1, 'parseImportoIt');
  const importi = caricaFile('importi.js');
  const ctx = caricaFile('determina-legale.js', { parseImportoIt, formattaImportoIt, calcolaIva22: importi.calcolaIva22,
    metadati: { id: '9401', titolo: 'Progetto di prova', delibera: '00', data_delibera: '01/01/2030' } });
  const scelto = { ditta: 'Ditta Prova Uno', importo: '2,25', prot: '0001', data: '01/01/2030', indirizzo: 'Via Inventata 1, Paese Prova', piva: '00000000000' };
  return ctx[costruttore](Object.assign({
    scelto, preventivi: [scelto], protRichiesta: '0000', scadenzaDataRichiesta: '01/01/2030', scadenzaOraRichiesta: '12:00',
    fraseOggetto: 'del progetto "Progetto di prova"', frasePremesso: '"Progetto di prova"', eventoRichiamatoTxt: 'dell\'evento richiamato',
    realizzazioneEventoTxt: 'dell\'evento', approvazioneEventoTxt: 'dell\'evento', fraseDeterminaFinale: '', fraseFornitura: '',
    messaggioNessunaTappa: 'nessuna tappa', calendarioLines: ['– 01/02/2030: prova — da Conservatorio a Sala Prova;'],
    elencoNoleggio: ['10 sedie pieghevoli di prova'], elencoPersonale: ['Violino: Esecutore Prova'], capitolo: '0000', iban: '', applicaDeroga: false,
    dataEventoTesto: '01/02/2030', luogoEventoTesto: 'Sala Prova'
  }, cfgExtra)).join('\n');
}

test('Determina Trasporti con imponibile 2,25: IVA 0,50 e totale 2,75', () => {
  assert.match(determina('costruisciTestoDeterminaTrasporti'), /somma complessiva di € 2,75, di cui € 0,50 per IVA/);
});
test('Determina Noleggio con imponibile 2,25: IVA 0,50 e totale 2,75', () => {
  assert.match(determina('costruisciTestoDeterminaNoleggio'), /somma complessiva di € 2,75, di cui € 0,50 per IVA/);
});
test('Determina Personale Esterno con imponibile 2,25: IVA 0,50 e totale 2,75', () => {
  const testo = determina('costruisciTestoDeterminaPersonaleEsterno');
  assert.match(testo, /Importo del contratto: € 2,25 oltre IVA = € 2,75 totale/);
  assert.match(testo, /somma complessiva di € 2,75 \(di cui € 2,25 per imponibile ed € 0,50 per IVA/);
});
