// Livello 1 — tratte dei trasporti, prestiti e classificazione della Dotazione Tecnica.
// Caso campione del bug 7 (dati inventati): podio in prestito + 28 leggii del
// Conservatorio, due prove nella stessa sala e concerto in un teatro diverso.
// Ogni test gira su tutte le copie delle funzioni (Mod. 1-3 o Mod. 1-4).

const assert = require('node:assert/strict');
const { suOgniCopia, normale } = require('../helpers/copie');

// Contesto con i campi della pagina (getField) presi da un dizionario.
const conCampi = campi => () => ({ getField: n => campi[n] || '' });

// ── Classificazione dot_disp_: ogni voce finisce in un solo elenco ───────────

const CLASSIFICATI = {
  dot_sedie: '40', dot_disp_sedie: 'Prestito', dot_prestito_luogo_sedie: 'Sede Prestito Prova',
  dot_prestito_ritiro_data_sedie: '09/03/2031', dot_prestito_ritiro_ora_sedie: '10:00',
  dot_prestito_riconsegna_data_sedie: '16/03/2031', dot_prestito_riconsegna_ora_sedie: '11:00',
  dot_piano: '1', dot_disp_piano: 'Già disponibile (Conservatorio)', dot_piano_n: 'accordatura il giorno prima',
  dot_audio: '1', dot_disp_audio: 'Disponibile nella struttura', dot_struttura_nota_audio: 'impianto del teatro',
  dot_altro: '2 pedane', dot_disp_altro: 'Da acquistare/noleggiare'
};

suOgniCopia('elencoVociInPrestito: solo le voci in Prestito, con luogo e date', ['elencoVociInPrestito'], f => {
  const prestiti = f.elencoVociInPrestito();
  assert.equal(prestiti.length, 1);
  assert.match(prestiti[0].label, /^Sedie/);
  assert.deepEqual({ ...prestiti[0], label: undefined }, {
    label: undefined, qta: '40', luogo: 'Sede Prestito Prova',
    ritiroData: '09/03/2031', ritiroOra: '10:00', riconsegnaData: '16/03/2031', riconsegnaOra: '11:00'
  });
}, conCampi(CLASSIFICATI));

suOgniCopia('elencoVociInPrestito: luogo mancante → segnaposto; quantità mancante → voce esclusa', ['elencoVociInPrestito'], f => {
  const prestiti = f.elencoVociInPrestito();
  assert.equal(prestiti.length, 1);
  assert.equal(prestiti[0].luogo, '[___ luogo prestito ___]');
}, conCampi({ dot_sedie: '40', dot_disp_sedie: 'Prestito', dot_disp_piano: 'Prestito' }));

suOgniCopia('elencoDotazioneDisponibile: solo "Già disponibile (Conservatorio)", con nota e prefisso', ['elencoDotazioneDisponibile'], f => {
  assert.deepEqual([...f.elencoDotazioneDisponibile()].map(v => v.replace(/^[^:]*/, 'X')), ['X: 1 — accordatura il giorno prima']);
  assert.match(f.elencoDotazioneDisponibile('· ')[0], /^· Pianoforte/);
}, conCampi(CLASSIFICATI));

suOgniCopia('elencoVociDisponibiliInStruttura: solo "Disponibile nella struttura", con il dettaglio', ['elencoVociDisponibiliInStruttura'], f => {
  const voci = f.elencoVociDisponibiliInStruttura();
  assert.equal(voci.length, 1);
  assert.equal(voci[0].dettaglio, 'impianto del teatro');
}, conCampi(CLASSIFICATI));

// ── Materiale per tappa e orari del furgone ──────────────────────────────────

suOgniCopia('materialeTrasportoTappa: segue la Dotazione finché non è ritoccato a mano', ['materialeTrasportoTappa'], f => {
  assert.deepEqual({ ...f.materialeTrasportoTappa('', '', 'Leggii: 28') }, { testo: 'Leggii: 28', auto: 'Leggii: 28' });
  assert.deepEqual({ ...f.materialeTrasportoTappa('Leggii: 20', 'Leggii: 20', 'Leggii: 28') }, { testo: 'Leggii: 28', auto: 'Leggii: 28' });
  assert.deepEqual({ ...f.materialeTrasportoTappa('Leggii: 28 + 2 casse', 'Leggii: 28', 'Leggii: 30') }, { testo: 'Leggii: 28 + 2 casse', auto: 'Leggii: 28' });
});

suOgniCopia('calcolaOrarioConsegna / calcolaOrarioRitiro: un\'ora prima dell\'inizio, un\'ora dopo la fine', ['calcolaOrarioConsegna', 'calcolaOrarioRitiro', 'oraAMinuti', 'minutiAOra'], f => {
  assert.equal(f.calcolaOrarioConsegna('20:30'), '19:30');
  assert.equal(f.calcolaOrarioRitiro('23:30'), '00:30');
  assert.equal(f.calcolaOrarioConsegna(''), '');
});

// ── Caso campione bug 7: tratte complete e coerenti ──────────────────────────

const MATERIALE = 'Leggii: 28; Podio direttore: 1';
const TAPPE = [
  { tipo: 'Prova 1', data: '10/03/2031', dest: 'Sala Prova A', materiale: MATERIALE, partenza: '08:30', consegna: '09:00', ritiro: '', rientroTappa: '' },
  { tipo: 'Prova 2', data: '11/03/2031', dest: 'Sala Prova A', materiale: MATERIALE, partenza: '', consegna: '', ritiro: '18:00', rientroTappa: '' },
  { tipo: 'Concerto', data: '15/03/2031', dest: 'Teatro Prova B', materiale: MATERIALE, partenza: '', consegna: '16:00', ritiro: '23:30', rientroTappa: '00:15' }
];
const PRESTITO_PODIO = {
  dot_podio: '1', dot_disp_podio: 'Prestito', dot_prestito_luogo_podio: 'Sede Prestito Prova',
  dot_prestito_ritiro_data_podio: '09/03/2031', dot_prestito_ritiro_ora_podio: '10:00',
  dot_prestito_riconsegna_data_podio: '16/03/2031', dot_prestito_riconsegna_ora_podio: '11:00',
  dot_leggii: '28', dot_disp_leggii: 'Già disponibile (Conservatorio)'
};
const TRATTE = ['costruisciTratteConPrestito', 'costruisciMovimentiTrasporto', 'elencoVociInPrestito', 'formattaIntervalloDate'];
const sintesi = righe => normale(righe).map(r => [r.giorno, r.da + ' → ' + r.a, r.appuntamento || '', r.materiale, r.orarioTesto]);

suOgniCopia('Bug 7 — tratte con prestito: ritiro, arrivo, trasferimento, rientro, riconsegna', TRATTE, (f, sigla) => {
  const podio = sigla === 'M3' ? null : 'Podio direttore (prestito): 1'; // nel Mod. 3 il podio non è in Dotazione
  const righe = sintesi(f.costruisciTratteConPrestito(TAPPE));
  const attese = [
    ['10/03/2031', 'Conservatorio → Sala Prova A', 'Prova 1', MATERIALE, 'partenza ore 08:30, consegna ore 09:00'],
    ['11–15/03/2031', 'Sala Prova A → Teatro Prova B', 'Concerto', MATERIALE, 'ritiro ore 18:00 (11/03/2031), consegna ore 16:00 (15/03/2031)'],
    ['15/03/2031', 'Teatro Prova B → Conservatorio', '', MATERIALE, 'ritiro ore 23:30, rientro ore 00:15']
  ];
  if (podio) {
    attese.unshift(['09/03/2031', 'Sede Prestito Prova → Conservatorio', '', podio, 'ritiro ore 10:00']);
    attese.push(['16/03/2031', 'Conservatorio → Sede Prestito Prova', '', podio, 'riconsegna ore 11:00']);
  }
  assert.deepEqual(righe, attese);
}, conCampi(PRESTITO_PODIO));

suOgniCopia('Bug 7 — tutte le date delle tratte nello stesso anno del progetto', TRATTE, f => {
  const anni = f.costruisciTratteConPrestito(TAPPE).map(r => (r.giorno.match(/\d{4}$/) || [''])[0]);
  assert.deepEqual([...new Set(anni)], ['2031']);
}, conCampi(PRESTITO_PODIO));

suOgniCopia('Tratte: due appuntamenti consecutivi nello stesso luogo non creano viaggi "da X a X"', ['costruisciMovimentiTrasporto', 'formattaIntervalloDate'], f => {
  const righe = f.costruisciMovimentiTrasporto(TAPPE.slice(0, 2));
  assert.ok(righe.every(r => r.da !== r.a));
  assert.deepEqual(normale(righe).map(r => r.da + ' → ' + r.a), ['Conservatorio → Sala Prova A', 'Sala Prova A → Conservatorio']);
});

suOgniCopia('Tratte: il rientro porta indietro l\'ultimo materiale caricato', ['costruisciMovimentiTrasporto', 'formattaIntervalloDate'], f => {
  const righe = f.costruisciMovimentiTrasporto([
    { tipo: 'Concerto', data: '15/03/2031', dest: 'Teatro Prova B', materiale: MATERIALE },
    { tipo: 'Replica 1', data: '16/03/2031', dest: 'Teatro Prova C', materiale: '' }
  ]);
  assert.equal(righe[righe.length - 1].tipo, 'rientro');
  assert.equal(righe[righe.length - 1].materiale, MATERIALE);
});

suOgniCopia('Tratte: nessun appuntamento spuntato e nessun prestito → nessuna tratta', TRATTE, f => {
  assert.equal(f.costruisciTratteConPrestito([]).length, 0);
}, conCampi({}));
