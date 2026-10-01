// Livello 1 — Determine: clausole concordate per ogni finalità, RUP, dati del fornitore.
// Decisioni di Marco (29/09/2026): Consip, RUP-DEC e clausola risolutiva restano dove
// sono; per il Personale Esterno niente Consip e niente link TRASPARE di pubblicazione
// (la piattaforma TRASPARE invece è citata). Tutti i dati sono inventati.

const test = require('node:test');
const assert = require('node:assert/strict');
const { funzioniDelFile, caricaFile } = require('../helpers/estrai-funzioni');

const importi = caricaFile('importi.js');
const legale = caricaFile('determina-legale.js', {
  parseImportoIt: importi.parseImportoIt, formattaImportoIt: importi.formattaImportoIt, calcolaIva22: importi.calcolaIva22,
  metadati: { id: '9601', titolo: 'Progetto di prova', delibera: '00', data_delibera: '01/01/2030' }
});

const FORNITORE = { ditta: 'Ditta Prova Uno', importo: '850,00', prot: '0001', data: '01/01/2030', indirizzo: 'Via Inventata 1, Paese Prova', piva: '00000000000' };

function testo(costruttore, scelto, altri) {
  scelto = Object.assign({}, FORNITORE, scelto);
  return legale[costruttore]({
    scelto, preventivi: [scelto].concat(altri || []), protRichiesta: '0000', scadenzaDataRichiesta: '01/01/2030', scadenzaOraRichiesta: '12:00',
    fraseOggetto: 'del progetto "Progetto di prova"', frasePremesso: '"Progetto di prova"', eventoRichiamatoTxt: 'dell\'evento richiamato',
    realizzazioneEventoTxt: 'dell\'evento', approvazioneEventoTxt: 'dell\'evento', fraseDeterminaFinale: '', fraseFornitura: '',
    messaggioNessunaTappa: 'nessuna tappa', calendarioLines: ['– 01/02/2030: prova — da Conservatorio a Sala Prova;'],
    elencoNoleggio: ['10 sedie pieghevoli di prova'], elencoPersonale: ['Violino: Esecutore Prova'], capitolo: '0000',
    iban: 'IT00X0000000000000000000000', applicaDeroga: false, dataEventoTesto: '01/02/2030', luogoEventoTesto: 'Sala Prova'
  }).join('\n');
}

const CLAUSOLE = {
  'RUP-DEC': /le funzioni di Direttore dell'Esecuzione del Contratto sono svolte dalla medesima Dott\.ssa/,
  'clausola risolutiva': /il contratto si debba considerare sciolto nel caso il Responsabile Unico del Progetto rilevi la carenza del possesso dei prescritti requisiti/,
  'Consip': /non risulta essere presente in alcuna convenzione di Consip S\.p\.A\./,
  'piattaforma TRASPARE': /piattaforma (?:di )?(?:certificata )?e-procurement TRASPARE/,
  'link TRASPARE': /https:\/\/briccialditerni\.traspare\.com/
};

const FINALITA = [
  { nome: 'Trasporti', costruttore: 'costruisciTestoDeterminaTrasporti', clausole: { 'RUP-DEC': true, 'clausola risolutiva': true, 'Consip': true, 'piattaforma TRASPARE': true, 'link TRASPARE': true }, rupPerImporto: true },
  { nome: 'Noleggio', costruttore: 'costruisciTestoDeterminaNoleggio', clausole: { 'RUP-DEC': true, 'clausola risolutiva': true, 'Consip': true, 'piattaforma TRASPARE': true, 'link TRASPARE': true }, rupPerImporto: true },
  { nome: 'Personale Esterno', costruttore: 'costruisciTestoDeterminaPersonaleEsterno', clausole: { 'RUP-DEC': true, 'clausola risolutiva': true, 'Consip': false, 'piattaforma TRASPARE': true, 'link TRASPARE': false }, rupPerImporto: false }
];

const RUP = t => { const m = /di nominare (Dott\.ssa \S+ \S+) quale Responsabile Unico del Progetto/i.exec(t); return m && m[1]; };
const RUP_DEC = t => { const m = /svolte dalla medesima (Dott\.ssa \S+ \S+) in qualità di RUP/.exec(t); return m && m[1]; };

for (const f of FINALITA) {
  test(f.nome + ' — clausole concordate presenti/assenti', () => {
    const t = testo(f.costruttore);
    for (const [nome, presente] of Object.entries(f.clausole)) {
      assert.equal(CLAUSOLE[nome].test(t), presente, nome + (presente ? ' mancante' : ' non dovrebbe esserci'));
    }
    assert.doesNotMatch(t, /dal medesimo/, '"dalla medesima", non "dal medesimo"');
  });

  test(f.nome + ' — RUP nominato e RUP-DEC sono la stessa persona', () => {
    for (const importo of ['850,00', '4.999,99', '5.000,00', '12.000']) {
      const t = testo(f.costruttore, { importo });
      assert.ok(RUP(t), 'nomina RUP assente con ' + importo);
      assert.equal(RUP_DEC(t), RUP(t), importo);
    }
  });

  test(f.nome + ' — dati del fornitore scelto nel testo', () => {
    const t = testo(f.costruttore);
    for (const dato of ['Ditta Prova Uno', 'Via Inventata 1, Paese Prova', '00000000000', '0001']) assert.ok(t.includes(dato), dato);
    const vuoti = testo(f.costruttore, { indirizzo: '', piva: '' });
    assert.match(vuoti, /\[___ indirizzo[^\]]*___\]/, 'segnaposto indirizzo');
    assert.match(vuoti, /\[___ P\.IVA\/C\.F\. ___\]/, 'segnaposto P.IVA');
  });
}

for (const f of FINALITA.filter(x => x.rupPerImporto)) {
  test(f.nome + ' — RUP: Angelucci sotto i 5.000 €, Fanizza da 5.000 € in su o se l\'importo non è leggibile', () => {
    assert.equal(RUP(testo(f.costruttore, { importo: '4.999,99' })), 'Dott.ssa Alessandra Angelucci');
    assert.equal(RUP(testo(f.costruttore, { importo: '5.000,00' })), 'Dott.ssa Susanna Fanizza');
    assert.equal(RUP(testo(f.costruttore, { importo: '12.000' })), 'Dott.ssa Susanna Fanizza');
    const illeggibile = testo(f.costruttore, { importo: 'da definire' });
    assert.equal(RUP(illeggibile), 'Dott.ssa Susanna Fanizza');
    assert.match(illeggibile, /⚠ Importo non riconosciuto/);
  });

  test(f.nome + ' — avviso da 140.000 € in su (affidamento diretto non gestito)', () => {
    assert.match(testo(f.costruttore, { importo: '140.000,00' }), /⚠ ATTENZIONE: importo pari o superiore a € 140\.000/);
    assert.doesNotMatch(testo(f.costruttore, { importo: '139.999,99' }), /⚠ ATTENZIONE/);
  });

  test(f.nome + ' — tutte le offerte pervenute sono elencate', () => {
    const t = testo(f.costruttore, {}, [{ ditta: 'Ditta Prova Due', importo: '900,00', prot: '0002', data: '02/01/2030', indirizzo: 'Via Inventata 2', piva: '11111111111' }]);
    assert.match(t, /sono pervenute n\. 2 offerta\/e/);
    assert.ok(t.includes('ditta Ditta Prova Due'));
  });
}

test('Personale Esterno — RUP sempre Fanizza, IBAN del fornitore per la tracciabilità', () => {
  for (const importo of ['850,00', '12.000']) assert.equal(RUP(testo('costruisciTestoDeterminaPersonaleEsterno', { importo })), 'Dott.ssa Susanna Fanizza');
  assert.match(testo('costruisciTestoDeterminaPersonaleEsterno'), /Tracciabilità \(L\. 136\/2010\): IBAN IT00X0000000000000000000000/);
});

test('Trasporti — motivazione "sotto i 5.000 €" solo quando l\'importo è davvero sotto', () => {
  assert.match(testo('costruisciTestoDeterminaTrasporti', { importo: '4.999,99' }), /importo inferiore a € 5\.000,00/);
  assert.doesNotMatch(testo('costruisciTestoDeterminaTrasporti', { importo: '5.000,00' }), /importo inferiore a € 5\.000,00/);
});

// Copie che leggono la pagina (non eseguibili senza browser): devono contenere le
// stesse frasi delle clausole. Così una correzione non riportata qui si vede subito.
const COPIE_LOCALI = [
  ['Mod. 4 — Trasporti', 'Modulo_4_EventoIstituzionale.html', 'generaBozzaDeterminaTrasporti'],
  ['Mod. 1 — Trasferta Persone', 'Modulo_1_SinfonicoCORALE.html', 'generaBozzaDeterminaTrasportoPersone'],
  ['Mod. 2 — Trasferta Persone', 'Modulo_2_PiccoloConcerto.html', 'generaBozzaDeterminaTrasportoPersone'],
  ['Mod. 3 — Trasferta Persone', 'Modulo_3_Masterclass.html', 'generaBozzaDeterminaTrasportoPersone'],
  ['Mod. 4 — Trasferta Persone', 'Modulo_4_EventoIstituzionale.html', 'generaBozzaDeterminaTrasportoPersone']
];
const FRASI = [
  'le funzioni di Direttore dell\'Esecuzione del Contratto sono svolte dalla medesima ',
  'che il contratto si debba considerare sciolto nel caso il Responsabile Unico del Progetto rilevi la carenza del possesso dei prescritti requisiti.',
  'ACCERTATO che la citata tipologia di servizio non risulta essere presente in alcuna convenzione di Consip S.p.A.;',
  'https://briccialditerni.traspare.com',
  '(!isNaN(importoScelto) && importoScelto < 5000) ? \'Dott.ssa Alessandra Angelucci\' : \'Dott.ssa Susanna Fanizza\'',
  'calcolaIva22(importoScelto)'
];
for (const [nome, file, funzione] of COPIE_LOCALI) {
  test(nome + ' (copia locale) — stesse clausole, stessa regola RUP, IVA da importi.js', () => {
    const sorgente = funzioniDelFile(file)[funzione].replace(/\\'/g, '\'');
    for (const frase of FRASI) assert.ok(sorgente.includes(frase.replace(/\\'/g, '\'')), 'manca: ' + frase.slice(0, 70));
  });
}
