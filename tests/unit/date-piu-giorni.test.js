// Intervento C (convegno di più giorni) — determina-legale.js: elencoConE e
// dateEventoPiuGiorni, usate dalla Determina Acquisti (comune ai Mod. 1-4) e dai
// documenti del Mod. 4. Senza giorniEventoPerDocumenti (Mod. 1-3) o con una sola
// data il risultato è null: i testi restano quelli della data unica.
// Tutti i dati sono inventati.

const test = require('node:test');
const assert = require('node:assert/strict');
const { caricaFile } = require('../helpers/estrai-funzioni');

const importi = caricaFile('importi.js');
function legale(giorni) {
  const ctx = { parseImportoIt: importi.parseImportoIt, formattaImportoIt: importi.formattaImportoIt, calcolaIva22: importi.calcolaIva22 };
  if (giorni) ctx.giorniEventoPerDocumenti = () => giorni;
  return caricaFile('determina-legale.js', ctx);
}

test('elencoConE: nessuna, una, due, tre voci', () => {
  const { elencoConE } = legale();
  assert.equal(elencoConE([]), '');
  assert.equal(elencoConE(['15/03/2031']), '15/03/2031');
  assert.equal(elencoConE(['15/03/2031', '16/03/2031']), '15/03/2031 e 16/03/2031');
  assert.equal(elencoConE(['15/03/2031', '16/03/2031', '17/03/2031']), '15/03/2031, 16/03/2031 e 17/03/2031');
});

test('dateEventoPiuGiorni: null nei moduli senza giorniEventoPerDocumenti (Mod. 1-3)', () => {
  assert.equal(legale().dateEventoPiuGiorni(), null);
});

test('dateEventoPiuGiorni: null con una sola data, anche se ripetuta (sessione e concerto lo stesso giorno)', () => {
  assert.equal(legale([{ data: '15/03/2031', luogo: 'Sala Prova' }]).dateEventoPiuGiorni(), null);
  assert.equal(legale([{ data: '15/03/2031', luogo: 'Sala Prova' }, { data: '15/03/2031', luogo: 'Teatro Prova' }]).dateEventoPiuGiorni(), null);
});

test('dateEventoPiuGiorni: date e luoghi senza ripetizioni, nell\'ordine ricevuto', () => {
  const r = legale([
    { data: '15/03/2031', luogo: 'Sala Prova' },
    { data: '15/03/2031', luogo: 'Teatro Prova' },
    { data: '16/03/2031', luogo: 'Sala Prova' },
    { data: '17/03/2031', luogo: '' }
  ]).dateEventoPiuGiorni();
  assert.equal(r.date, '15/03/2031, 16/03/2031 e 17/03/2031');
  assert.equal(r.luoghi, 'Sala Prova e Teatro Prova');
  assert.equal(r.dateConLuoghi, '15/03/2031 e 16/03/2031 presso Sala Prova; 15/03/2031 presso Teatro Prova; 17/03/2031');
});

test('dateConLuoghi: G1 in un luogo, G2 e G3 in un altro', () => {
  const r = legale([
    { data: '15/03/2031', luogo: 'Sala Prova' },
    { data: '16/03/2031', luogo: 'Teatro Prova' },
    { data: '17/03/2031', luogo: 'Teatro Prova' }
  ]).dateEventoPiuGiorni();
  assert.equal(r.dateConLuoghi, '15/03/2031 presso Sala Prova; 16/03/2031 e 17/03/2031 presso Teatro Prova');
});

test('dateConLuoghi: un solo luogo per tutti i giorni → un solo "presso"', () => {
  const r = legale([{ data: '15/03/2031', luogo: 'Sala Prova' }, { data: '16/03/2031', luogo: 'Sala Prova' }]).dateEventoPiuGiorni();
  assert.equal(r.dateConLuoghi, '15/03/2031 e 16/03/2031 presso Sala Prova');
});

test('dateEventoPiuGiorni: senza luoghi la stringa dei luoghi è vuota (il chiamante tiene il suo)', () => {
  const r = legale([{ data: '15/03/2031' }, { data: '16/03/2031' }]).dateEventoPiuGiorni();
  assert.equal(r.date, '15/03/2031 e 16/03/2031');
  assert.equal(r.luoghi, '');
  assert.equal(r.dateConLuoghi, '15/03/2031 e 16/03/2031');
});
