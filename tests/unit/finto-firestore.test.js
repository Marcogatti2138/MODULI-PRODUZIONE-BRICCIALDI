// Verifica che il finto Firestore dei test end-to-end si comporti come quello
// vero nei casi che le pagine usano. Se uno di questi comportamenti risultasse
// dubbio rispetto a Firestore reale, per quei casi si passa all'emulatore.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PAGINE, caricaFunzioni } = require('../helpers/estrai-funzioni');

const SORGENTE = fs.readFileSync(path.join(__dirname, '..', 'e2e', 'finto-firestore.js'), 'utf8');

// Carica il finto Firestore in un "window" isolato, con dati iniziali opzionali.
function nuovoDb(datiIniziali) {
  const window = { __FINTO_DB_INIZIALE: datiIniziali };
  const ctx = vm.createContext({ window, setTimeout, Promise, Date, JSON, Error, Object, Array, Math, String, Number });
  vm.runInContext(SORGENTE, ctx);
  window.firebase.initializeApp({ projectId: 'finto' });
  return { window, db: window.firebase.firestore(), FieldValue: window.firebase.firestore.FieldValue, finto: window.__fintoDb };
}

const doc = (db, id) => db.collection('progetti').doc(id);

test('get: documento esistente, inesistente, e copia indipendente dei dati', async () => {
  const { db } = nuovoDb({ progetti: { '1': { metadati: { titolo: 'Prova' } } } });
  const s = await doc(db, '1').get();
  assert.equal(s.exists, true);
  assert.equal(s.id, '1');
  s.data().metadati.titolo = 'modificato fuori';
  assert.equal((await doc(db, '1').get()).data().metadati.titolo, 'Prova');
  const vuoto = await doc(db, '2').get();
  assert.equal(vuoto.exists, false);
  assert.equal(vuoto.data(), undefined);
});

test('set senza merge sostituisce tutto il documento', async () => {
  const { db, finto } = nuovoDb({ progetti: { '1': { a: 1, b: { c: 2 } } } });
  await doc(db, '1').set({ b: { d: 3 } });
  assert.deepEqual(finto.documento('progetti', '1'), { b: { d: 3 } });
});

test('set con merge: le mappe si fondono in profondità, gli array si sostituiscono', async () => {
  const { db, finto } = nuovoDb({ progetti: { '1': { a: 1, m: { x: 1, y: { z: 1 } }, l: [1, 2] } } });
  await doc(db, '1').set({ m: { y: { w: 2 }, k: 3 }, l: [9] }, { merge: true });
  assert.deepEqual(finto.documento('progetti', '1'), { a: 1, m: { x: 1, y: { z: 1, w: 2 }, k: 3 }, l: [9] });
});

test('set con merge su documento inesistente lo crea', async () => {
  const { db, finto } = nuovoDb({});
  await doc(db, '5').set({ metadati: { id: '5' } }, { merge: true });
  assert.deepEqual(finto.documento('progetti', '5'), { metadati: { id: '5' } });
});

test('update con nomi puntati tocca solo quel campo', async () => {
  const { db, finto } = nuovoDb({ progetti: { '1': { stato: { a: 1, richieste_inviate: { x: true, y: true } } } } });
  await doc(db, '1').update({ 'stato.richieste_inviate.z': true, 'stato.nuovo.profondo': 'ok' });
  assert.deepEqual(finto.documento('progetti', '1'), { stato: { a: 1, richieste_inviate: { x: true, y: true, z: true }, nuovo: { profondo: 'ok' } } });
});

test('update di una mappa intera la SOSTITUISCE (non la fonde) — come dati_referente nei moduli', async () => {
  const { db, finto } = nuovoDb({ progetti: { '1': { dati_referente: { prova_data_6: '01/01/2031', titolo: 'x' }, altro: 1 } } });
  await doc(db, '1').update({ dati_referente: { titolo: 'y' } });
  assert.deepEqual(finto.documento('progetti', '1'), { dati_referente: { titolo: 'y' }, altro: 1 });
});

test('update su documento inesistente: promessa rifiutata con codice not-found', async () => {
  const { db } = nuovoDb({});
  await assert.rejects(doc(db, '404').update({ a: 1 }), e => e.code === 'not-found');
});

test('FieldValue.delete: in update puntato toglie solo quel campo', async () => {
  const { db, FieldValue, finto } = nuovoDb({ progetti: { '1': { stato: { richieste_inviate: { x: true, y: true } } } } });
  await doc(db, '1').update({ 'stato.richieste_inviate.x': FieldValue.delete() });
  assert.deepEqual(finto.documento('progetti', '1'), { stato: { richieste_inviate: { y: true } } });
});

test('FieldValue.delete: in set con merge toglie il campo, anche annidato', async () => {
  const { db, FieldValue, finto } = nuovoDb({ progetti: { '1': { a: 1, m: { x: 1, y: 2 } } } });
  await doc(db, '1').set({ a: FieldValue.delete(), m: { x: FieldValue.delete() } }, { merge: true });
  assert.deepEqual(finto.documento('progetti', '1'), { m: { y: 2 } });
});

test('FieldValue.delete fuori posto e valori undefined: errore subito, come l\'SDK vero', () => {
  const { db, FieldValue } = nuovoDb({ progetti: { '1': { a: 1 } } });
  assert.throws(() => doc(db, '1').set({ a: FieldValue.delete() }), e => e.code === 'invalid-argument');
  assert.throws(() => doc(db, '1').update({ m: { x: FieldValue.delete() } }), e => e.code === 'invalid-argument');
  assert.throws(() => doc(db, '1').set({ a: undefined }, { merge: true }), e => e.code === 'invalid-argument');
  assert.throws(() => doc(db, '1').update({ 'm.x': undefined }), e => e.code === 'invalid-argument');
});

test('serverTimestamp diventa un Timestamp con toDate()/toMillis()/seconds', async () => {
  const { db, FieldValue, window } = nuovoDb({});
  const prima = Date.now();
  await doc(db, '1').set({ stato: { ultimo_aggiornamento: FieldValue.serverTimestamp() } });
  const ts = (await doc(db, '1').get()).data().stato.ultimo_aggiornamento;
  assert.equal(typeof ts.toDate, 'function');
  assert.ok(ts.toMillis() >= prima - 1000 && ts.toMillis() <= Date.now() + 1000);
  assert.equal(ts.seconds, Math.floor(ts.toMillis() / 1000));
  // I timestamp nei dati iniziali ({ __timestamp: ms }) tornano Timestamp veri
  const { db: db2 } = nuovoDb({ progetti: { '1': { t: { __timestamp: 1700000000000 } } } });
  assert.equal((await doc(db2, '1').get()).data().t.toMillis(), 1700000000000);
});

test('collection().get elenca tutti i documenti', async () => {
  const { db } = nuovoDb({ progetti: { '1': { a: 1 }, '2': { a: 2 } } });
  const snap = await db.collection('progetti').get();
  const visti = [];
  snap.forEach(d => visti.push(d.id + ':' + d.data().a));
  assert.deepEqual(visti.sort(), ['1:1', '2:2']);
  assert.equal(snap.size, 2);
});

// Contatore degli ID con le funzioni vere del Mod. 1 (assegnaIdAutomatico +
// verificaIdLiberoOSalta), collegate al finto Firestore come nella pagina.
function assegnatoreId(datiIniziali) {
  const f = nuovoDb(datiIniziali);
  const w = f.window;
  w.db = f.db;
  w.fsDoc = (db, col, id) => db.collection(col).doc(id);
  w.fsGetDoc = ref => ref.get();
  const fn = caricaFunzioni(PAGINE.M1, ['assegnaIdAutomatico', 'verificaIdLiberoOSalta'], { window: w, console });
  const assegna = () => new Promise((ok, ko) => fn.assegnaIdAutomatico(ok, ko));
  return { assegna, finto: f.finto };
}

test('runTransaction: il contatore parte da 1 e cresce a ogni assegnazione', async () => {
  const { assegna, finto } = assegnatoreId({});
  assert.equal(await assegna(), '1');
  assert.equal(await assegna(), '2');
  assert.deepEqual(finto.documento('contatori', 'progetti'), { ultimoId: 2 });
});

test('runTransaction: riparte dal contatore salvato e salta gli ID già usati da progetti storici', async () => {
  const { assegna, finto } = assegnatoreId({ contatori: { progetti: { ultimoId: 41 } }, progetti: { '42': { metadati: { id: '42' } } } });
  assert.equal(await assegna(), '43');
  assert.equal(finto.documento('contatori', 'progetti').ultimoId, 43);
});

test('runTransaction: un errore dentro la transazione la fa fallire', async () => {
  const { db } = nuovoDb({});
  await assert.rejects(db.runTransaction(t => { t.update(doc(db, 'manca'), { a: 1 }); }), e => e.code === 'not-found');
});
