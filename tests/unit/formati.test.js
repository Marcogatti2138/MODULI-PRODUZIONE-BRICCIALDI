// Livello 1 — importi, date e orari: funzioni che producono testi e numeri
// usati in Determine, richieste e PDF. Ogni test gira su tutte le copie.
// I test marcati "todo" documentano un bug segnalato a Marco e non ancora corretto.

const assert = require('node:assert/strict');
const { suOgniCopia, dataFissa, campo } = require('../helpers/copie');

// Importi: formattaImportoIt e calcolaIva22 sono provati in importi.test.js.

// ── Orari ────────────────────────────────────────────────────────────────────

suOgniCopia('normalizzaOra: riconosce i modi comuni di scrivere un orario', ['normalizzaOra'], f => {
  const casi = [['21', '21:00'], ['9', '09:00'], ['9.30', '09:30'], ['9,30', '09:30'], ['9 30', '09:30'],
    ['930', '09:30'], ['1430', '14:30'], ['14:30', '14:30'], [' 08:05 ', '08:05'], ['0', '00:00']];
  for (const [testo, atteso] of casi) assert.equal(f.normalizzaOra(testo), atteso, testo);
  for (const testo of ['', null, '24:00', '12:60', '25', 'sera', '1:2:3', '12345']) assert.equal(f.normalizzaOra(testo), null, String(testo));
});

suOgniCopia('formattaOraItaliana: corregge il campo solo se l\'orario è riconosciuto', ['formattaOraItaliana', 'normalizzaOra'], f => {
  const a = campo('930'); f.formattaOraItaliana(a); assert.equal(a.value, '09:30');
  const b = campo('dopo cena'); f.formattaOraItaliana(b); assert.equal(b.value, 'dopo cena');
});

suOgniCopia('formattaOrarioRange: intervalli scritti in vari modi', ['formattaOrarioRange', 'normalizzaOra'], f => {
  const casi = [['14-19', '14:00 – 19:00'], ['14:00–19:00', '14:00 – 19:00'], ['9.30 alle 13', '09:30 – 13:00'],
    ['15 a 18', '15:00 – 18:00'], ['10', '10:00'], ['tutto il giorno', 'tutto il giorno']];
  for (const [testo, atteso] of casi) { const c = campo(testo); f.formattaOrarioRange(c); assert.equal(c.value, atteso, testo); }
});

suOgniCopia('oraAMinuti / minutiAOra', ['oraAMinuti', 'minutiAOra'], f => {
  assert.equal(f.oraAMinuti('20:30'), 1230);
  assert.equal(f.oraAMinuti('ore 9:05'), 545);
  assert.equal(f.oraAMinuti('sera'), null);
  assert.equal(f.minutiAOra(1230), '20:30');
  assert.equal(f.minutiAOra(1440 + 30), '00:30');   // oltre la mezzanotte
  assert.equal(f.minutiAOra(-30), '23:30');          // prima della mezzanotte
});

suOgniCopia('estraiMinutiOra: orario singolo o primo orario di un intervallo', ['estraiMinutiOra', 'normalizzaOra'], f => {
  assert.equal(f.estraiMinutiOra('21:00'), 1260);
  assert.equal(f.estraiMinutiOra('21'), 1260);
  assert.equal(f.estraiMinutiOra('1430'), 870);
  assert.equal(f.estraiMinutiOra('15:00 – 19:00'), 900);
  assert.equal(f.estraiMinutiOra(''), null);
});

suOgniCopia('estraiMinutiOra (Dashboard): orari senza i due punti', ['estraiMinutiOra'], f => {
  assert.equal(f.estraiMinutiOra('21'), 1260);
  assert.equal(f.estraiMinutiOra('1430'), 870);
}, null, { solo: ['D'], todo: 'Differenza segnalata 01/10/2026: la copia della Dashboard non riconosce "21" o "1430" (i moduli sì); impatto basso, i moduli salvano già "21:00"' });

// ── Durata ───────────────────────────────────────────────────────────────────

suOgniCopia('calcolaOraFineDaDurata: ora di fine dalla durata scritta in ore e minuti', ['calcolaOraFineDaDurata'], f => {
  assert.equal(f.calcolaOraFineDaDurata('20:30', '90 minuti'), '22:00');
  assert.equal(f.calcolaOraFineDaDurata('20:30', '90 minuti, con intervallo'), '22:00');
  assert.equal(f.calcolaOraFineDaDurata('20:30', '2 ore'), '22:30');
  assert.equal(f.calcolaOraFineDaDurata('20:30', '1 ora e 30 minuti'), '22:00');
  assert.equal(f.calcolaOraFineDaDurata('23:00', '2 ore'), '01:00');
  assert.equal(f.calcolaOraFineDaDurata('', '90 minuti'), '');
  assert.equal(f.calcolaOraFineDaDurata('20:30', 'da definire'), '');
});

suOgniCopia('calcolaOraFineDaDurata: ore con i decimali', ['calcolaOraFineDaDurata'], f => {
  assert.equal(f.calcolaOraFineDaDurata('20:30', 'circa 1,5 ore'), '22:00');
}, null, { todo: 'BUG segnalato 01/10/2026: "1,5 ore" viene letto come 5 ore (fine alle 01:30)' });

suOgniCopia('estraiDurataMinuti: durata in minuti, anche se scritta in ore', ['estraiDurataMinuti'], f => {
  assert.equal(f.estraiDurataMinuti('90 minuti'), 90);
  assert.equal(f.estraiDurataMinuti('2 ore'), 120);
  assert.equal(f.estraiDurataMinuti('1 ora e 30 minuti'), 90);
}, null, { todo: 'BUG segnalato 01/10/2026: prende solo il primo numero ("2 ore" = 2 minuti); usata da tabella Trasporti e orari Spazi' });

// ── Date ─────────────────────────────────────────────────────────────────────

suOgniCopia('formattaDataItaliana: corregge il campo data', ['formattaDataItaliana'], f => {
  const casi = [['1/3/2031', '01/03/2031'], ['01-03-2031', '01/03/2031'], ['1.3.31', '01/03/2031'],
    ['15/03/31', '15/03/2031'], ['32/01/2031', '32/01/2031'], ['da definire', 'da definire'], ['', '']];
  for (const [testo, atteso] of casi) { const c = campo(testo); f.formattaDataItaliana(c); assert.equal(c.value, atteso, testo); }
});

suOgniCopia('parseDataGGMMAAAA: date valide', ['parseDataGGMMAAAA'], f => {
  const d = f.parseDataGGMMAAAA('15/03/2031');
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate()], [2031, 3, 15]);
  assert.equal(f.parseDataGGMMAAAA(' 01/01/2031 ').getDate(), 1);
  for (const t of ['', null, 'da definire', '15/03', '15-03-2031']) assert.equal(f.parseDataGGMMAAAA(t), null, String(t));
});

suOgniCopia('parseDataGGMMAAAA: date inesistenti', ['parseDataGGMMAAAA'], f => {
  assert.equal(f.parseDataGGMMAAAA('31/02/2031'), null);
  assert.equal(f.parseDataGGMMAAAA('29/02/2031'), null);
}, null, { todo: 'Segnalato 01/10/2026: "31/02/2031" diventa 03/03/2031 senza avviso (coerenza-date.js invece la rifiuta come data non valida)' });

suOgniCopia('formattaIntervalloDate', ['formattaIntervalloDate'], f => {
  assert.equal(f.formattaIntervalloDate('10/03/2031', '12/03/2031'), '10–12/03/2031');
  assert.equal(f.formattaIntervalloDate('30/03/2031', '02/04/2031'), '30/03/2031–02/04/2031');
});

suOgniCopia('scadenzaSuperata: vale fino a fine giornata', ['scadenzaSuperata'], f => {
  assert.equal(f.scadenzaSuperata('15/03/2031'), false);   // oggi è il 15/03/2031
  assert.equal(f.scadenzaSuperata('14/03/2031'), true);
  assert.equal(f.scadenzaSuperata('16/03/2031'), false);
  assert.equal(f.scadenzaSuperata('da definire'), false);
}, () => ({ Date: dataFissa(2031, 3, 15, 23) }));

suOgniCopia('ordinaRigheCronologicamente: per data, poi per ora; righe senza data in fondo', ['ordinaRigheCronologicamente', 'parseDataGGMMAAAA', 'estraiMinutiOra', 'normalizzaOra'], f => {
  const righe = [
    { tipo: 'Concerto', data: '15/03/2031', ora: '20:30' },
    { tipo: 'Senza data', data: '', ora: '' },
    { tipo: 'Prova pomeriggio', data: '15/03/2031', ora: '15:00 – 18:00' },
    { tipo: 'Prova', data: '10/03/2031', ora: '' }
  ];
  assert.deepEqual(f.ordinaRigheCronologicamente(righe).map(r => r.tipo), ['Prova', 'Prova pomeriggio', 'Concerto', 'Senza data']);
});

suOgniCopia('slugPersona: chiave stabile senza accenti né simboli', ['slugPersona'], f => {
  assert.equal(f.slugPersona('Niccolò D\'Àmico'), 'niccolo_d_amico');
  assert.equal(f.slugPersona(''), 'persona');
  assert.equal(f.slugPersona('A'.repeat(60)).length, 40);
});

suOgniCopia('convertiTimestampFirestore', ['convertiTimestampFirestore'], f => {
  assert.equal(f.convertiTimestampFirestore({ toDate: () => 'data' }), 'data');
  assert.equal(f.convertiTimestampFirestore({ seconds: 1900000000 }).getTime(), 1900000000000);
  assert.equal(f.convertiTimestampFirestore(null), null);
});
