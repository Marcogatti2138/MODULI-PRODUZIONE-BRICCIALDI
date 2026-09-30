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
  const { formattaImportoIt } = caricaFunzioni(PAGINE.M1, ['formattaImportoIt']);
  const ctx = caricaFile('determina-legale.js', { parseImportoIt, formattaImportoIt });
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
