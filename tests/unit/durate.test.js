// Lettura della durata scritta a mano nel campo "durata" (es. "90 minuti, con intervallo").
// Bug B: estraiDurataMinuti prendeva solo il primo numero ("2 ore" = 2 minuti); la usano
//        la tabella Trasporti e gli orari di occupazione degli Spazi.
// Bug C: calcolaOraFineDaDurata leggeva "1,5 ore" come 5 ore (Calendario PDF).
// Ora un'unica lettura in durate.js. Ogni test gira su tutte le pagine che usano la funzione.

const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGINE, leggi, funzioniDelFile, caricaFile } = require('../helpers/estrai-funzioni');
const { funzioneDellaPagina } = require('../helpers/copie');

// Modi di scrivere la durata e minuti attesi (null = nessuna durata riconoscibile)
const DURATE = [
  ['90 minuti', 90], ['90 min', 90], ["90'", 90], ['90 minuti, con intervallo', 90], ['90', 90],
  ['2 ore', 120], ['2 ora', 120], ['2h', 120], ['2 H', 120],
  ['1 ora e 30 minuti', 90], ['1 ora e 30', 90], ['1h30', 90], ["1 h 30'", 90], ['1h 30 min', 90],
  ['1,5 ore', 90], ['circa 1,5 ore', 90], ['1.5 ore', 90], ['2,25 ore', 135],
  ['1:30', 90], ['2:00', 120],
  ["un'ora", 60], ["un'ora e mezza", 90], ['un’ora e mezza', 90], ["mezz'ora", 30], ["un'ora e 15 minuti", 75],
  ['', null], ['da definire', null], [null, null]
];

// Pagine che usano ciascuna funzione (copia interna oggi, durate.js dopo la correzione)
const USANO_ESTRAI = ['M1', 'M2', 'M3'];
const USANO_FINE = ['M1', 'M2', 'M4'];

for (const sigla of USANO_ESTRAI) {
  test(sigla + ' — estraiDurataMinuti: durata in minuti, in ore o mista', () => {
    const estraiDurataMinuti = funzioneDellaPagina(PAGINE[sigla], 'estraiDurataMinuti', ['durate.js']);
    for (const [testo, minuti] of DURATE) assert.equal(estraiDurataMinuti(testo), minuti, JSON.stringify(testo));
  });
}

for (const sigla of USANO_FINE) {
  test(sigla + ' — calcolaOraFineDaDurata: ora di fine coerente con la durata', () => {
    const calcolaOraFineDaDurata = funzioneDellaPagina(PAGINE[sigla], 'calcolaOraFineDaDurata', ['durate.js']);
    const casi = [['20:30', '90 minuti', '22:00'], ['20:30', '90 minuti, con intervallo', '22:00'], ['20:30', '2 ore', '22:30'],
      ['20:30', '1 ora e 30 minuti', '22:00'], ['20:30', 'circa 1,5 ore', '22:00'], ['20:30', '1h30', '22:00'],
      ['20:30', "75'", '21:45'], ['23:00', '2 ore', '01:00'], ['ore 21:00', '90 minuti', '22:30'],
      ['', '90 minuti', ''], ['20:30', 'da definire', ''], ['20:30', '', '']];
    for (const [inizio, durata, atteso] of casi) assert.equal(calcolaOraFineDaDurata(inizio, durata), atteso, inizio + ' + ' + durata);
  });
}

test('Le due letture della durata danno lo stesso risultato', () => {
  const ctx = caricaFile('durate.js');
  for (const [testo, minuti] of DURATE) {
    if (minuti === null) continue;
    const fine = ctx.calcolaOraFineDaDurata('10:00', testo);
    const daMinuti = String(Math.floor((600 + minuti) / 60)).padStart(2, '0') + ':' + String((600 + minuti) % 60).padStart(2, '0');
    assert.equal(fine, daMinuti, JSON.stringify(testo));
  }
});

test('Una sola copia: i Mod. 1-4 caricano durate.js e nessuna pagina definisce più le funzioni delle durate', () => {
  for (const [sigla, file] of Object.entries(PAGINE)) {
    if (sigla !== 'D') assert.ok(leggi(file).includes('<script src="durate.js"></script>'), sigla + ': durate.js non caricato');
    const f = funzioniDelFile(file);
    assert.deepEqual(['estraiDurataMinuti', 'calcolaOraFineDaDurata', 'leggiDurataMinuti'].filter(n => f[n]), [], sigla + ': copia interna rimasta');
  }
});
