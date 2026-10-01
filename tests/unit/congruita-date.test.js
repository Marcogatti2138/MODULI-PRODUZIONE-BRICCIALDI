// Livello 1 — congruità delle date nel singolo progetto (coerenza-date.js).
// Per ogni modulo un progetto coerente non deve dare avvisi; ogni regola (E0–E6, D0,
// A1–A7) si prova poi guastando quel progetto in un punto solo.
// "Oggi" è fissato al 15/01/2031. Tutti i dati sono inventati.

const test = require('node:test');
const assert = require('node:assert/strict');
const { caricaFile } = require('../helpers/estrai-funzioni');
const { dataFissa, normale } = require('../helpers/copie');

// Finta pagina: i campi esistono se sono nel dizionario (anche vuoti), come i campi del modulo.
function fintoDocument(campi, tappe) {
  const el = n => ({ name: n, value: campi[n] });
  return {
    querySelector(sel) {
      const m = /^\[name="([^"]+)"\]$/.exec(sel);
      return m && Object.prototype.hasOwnProperty.call(campi, m[1]) ? el(m[1]) : null;
    },
    querySelectorAll(sel) {
      if (sel === '[name^="determina_"]') return Object.keys(campi).filter(k => k.startsWith('determina_')).map(el);
      if (sel === '#trasporti-materiale-tbody tr') {
        return (tappe || []).map(t => ({
          children: [null, { textContent: t.tipo }, { textContent: t.data }],
          querySelector: () => ({ name: 'trasp_mat_check_' + t.key, checked: true })
        }));
      }
      return [];
    }
  };
}

// Esegue verificaCongruitaDate e restituisce i testi di errori e avvisi.
function verifica(modulo, p) {
  const avvisiConsole = [];
  const ctx = caricaFile('coerenza-date.js', {
    getField: n => (p.campi[n] === undefined ? '' : p.campi[n]),
    document: fintoDocument(p.campi, p.tappe),
    metadati: { ruolo: p.ruolo || 'responsabile' },
    window: { _statoProgetto: p.stato || {} },
    elencoVociInPrestito: () => p.prestiti || [],
    console: { warn: (...a) => avvisiConsole.push(a.join(' ')), log() {} },
    Date: dataFissa(2031, 1, 15)
  });
  const r = ctx.verificaCongruitaDate(modulo);
  assert.deepEqual(avvisiConsole, [], 'errore interno del controllo');
  return normale({ errori: r.errori.map(v => v.testo), attenzione: r.attenzione.map(v => v.testo) });
}

// ── Progetti coerenti (Responsabile, con trasporti, prestito, centralino, scadenze) ──

const PRESTITO = { label: 'Podio direttore', qta: '1', luogo: 'Sede Prestito Prova', ritiroData: '09/03/2031', ritiroOra: '10:00', riconsegnaData: '21/03/2031', riconsegnaOra: '11:00' };

function sinfonico() {
  return {
    campi: {
      data_evento: '15/03/2031', luogo_concerto: 'Teatro Prova B', trasporti_previsti: 'Sì',
      prova_data_1: '10/03/2031', prova_luogo_1: 'Sala Prova A', prova_data_2: '12/03/2031', prova_luogo_2: 'Sala Prova A',
      replica_data_1: '20/03/2031', replica_luogo_1: 'Teatro Prova B', replica_trasporto_1: '',
      replica_partenza_data_1: '', replica_partenza_ora_1: '', replica_rientro_data_1: '', replica_rientro_ora_1: '',
      trasp_mat_dest_prova_1: 'Sala Prova A', trasp_mat_furg_consegna_prova_1: '09:00', trasp_mat_furg_ritiro_prova_1: '',
      trasp_mat_dest_concerto: 'Teatro Prova B', trasp_mat_furg_consegna_concerto: '16:00', trasp_mat_furg_ritiro_concerto: '23:30',
      centralino_ritiro_data: '08/03/2031', centralino_rientro_data: '21/03/2031',
      determina_trasp_scadenza_data: '01/03/2031', determina_nol_scadenza_data: '01/03/2031'
    },
    tappe: [{ key: 'prova_1', tipo: 'Prova 1', data: '10/03/2031' }, { key: 'concerto', tipo: 'Concerto', data: '15/03/2031' }],
    prestiti: [Object.assign({}, PRESTITO)]
  };
}
function masterclass() {
  return {
    campi: {
      data_evento: '10/03/2031', data_evento_fine: '14/03/2031', trasporti_previsti: 'No',
      alloggio_arrivo: '09/03/2031', alloggio_partenza: '15/03/2031',
      prova_data_1: '10/03/2031', prova_data_2: '12/03/2031', dataconcerto_data_1: '14/03/2031',
      centralino_ritiro_data: '09/03/2031', centralino_rientro_data: '15/03/2031', determina_nol_scadenza_data: '01/03/2031'
    },
    prestiti: [Object.assign({}, PRESTITO, { riconsegnaData: '15/03/2031' })]
  };
}
function istituzionale() {
  return {
    campi: {
      data_evento: '15/03/2031', luogo_concerto: 'Aula Prova', replica_data_1: '20/03/2031', replica_luogo_1: 'Aula Prova', replica_trasporto_1: '',
      replica_partenza_data_1: '', replica_partenza_ora_1: '', replica_rientro_data_1: '', replica_rientro_ora_1: '',
      centralino_ritiro_data: '14/03/2031', centralino_rientro_data: '21/03/2031', determina_nol_scadenza_data: '01/03/2031'
    },
    prestiti: [Object.assign({}, PRESTITO, { ritiroData: '14/03/2031' })]
  };
}
const COERENTI = { 1: sinfonico, 2: sinfonico, 3: masterclass, 4: istituzionale };

for (const modulo of [1, 2, 3, 4]) {
  test('Mod. ' + modulo + ' — progetto coerente: nessun errore e nessun avviso', () => {
    assert.deepEqual(verifica(modulo, COERENTI[modulo]()), { errori: [], attenzione: [] });
  });
  test('Mod. ' + modulo + ' — vista Referente: niente controlli riservati al Responsabile', () => {
    const p = COERENTI[modulo]();
    p.ruolo = 'referente';
    p.campi.centralino_ritiro_data = '01/01/2031';          // A4
    p.campi.determina_nol_scadenza_data = '30/03/2031';     // A5
    p.prestiti[0].ritiroData = '13/03/2031';                // E2
    assert.deepEqual(verifica(modulo, p), { errori: [], attenzione: [] });
  });
}

// Guasta il progetto coerente del modulo e restituisce le voci.
function conGuasto(modulo, guasto) { const p = COERENTI[modulo](); guasto(p); return verifica(modulo, p); }
const contiene = (voci, re) => voci.some(v => re.test(v));

// ── Errori probabili ─────────────────────────────────────────────────────────

test('E6 — data non valida segnalata una volta sola (non anche come "lontana")', () => {
  const r = conGuasto(1, p => { p.campi.prova_data_1 = '31/02/2031'; });
  assert.deepEqual(r.errori, ['Prova 1: "31/02/2031" non è una data valida (formato GG/MM/AAAA)']);
});

test('E0 — data evento a più di 12 mesi da oggi', () => {
  const r = conGuasto(2, p => { p.campi.data_evento = '20/02/2032'; for (const k of ['prova_data_1', 'prova_data_2', 'replica_data_1', 'centralino_ritiro_data', 'centralino_rientro_data']) p.campi[k] = ''; p.tappe = []; p.prestiti = []; });
  assert.ok(contiene(r.errori, /^Data evento \(20\/02\/2032\) è a più di 12 mesi da oggi/), r.errori.join(' | '));
});

test('D0 — evento già passato con progetto attivo; nessun avviso se completato', () => {
  const passato = p => { p.campi.data_evento = '10/01/2031'; p.campi.data_evento_fine = '12/01/2031'; p.campi.prova_data_1 = '10/01/2031'; p.campi.prova_data_2 = ''; p.campi.dataconcerto_data_1 = ''; p.campi.alloggio_arrivo = ''; p.campi.alloggio_partenza = ''; p.campi.centralino_ritiro_data = ''; p.campi.centralino_rientro_data = ''; p.campi.determina_nol_scadenza_data = ''; p.prestiti = []; };
  assert.ok(contiene(conGuasto(3, passato).attenzione, /è già passato ma il progetto risulta ancora attivo/));
  assert.deepEqual(conGuasto(3, p => { passato(p); p.stato = { completato: true }; }).attenzione, []);
});

test('E1 — data a più di 6 mesi dall\'evento (anno sbagliato)', () => {
  const r = conGuasto(1, p => { p.campi.prova_data_2 = '12/03/2030'; });
  assert.ok(contiene(r.errori, /^Prova 2 \(12\/03\/2030\) è a più di 6 mesi dall'evento/), r.errori.join(' | '));
});

test('E2 — prestito ritirato dopo il primo uso o riconsegnato prima dell\'ultimo', () => {
  const r = conGuasto(1, p => { p.prestiti[0].ritiroData = '11/03/2031'; p.prestiti[0].riconsegnaData = '14/03/2031'; });
  assert.ok(contiene(r.errori, /Prestito "Podio direttore": ritiro \(11\/03\/2031\) dopo il primo utilizzo \(10\/03\/2031\)/));
  assert.ok(contiene(r.errori, /Prestito "Podio direttore": riconsegna \(14\/03\/2031\) prima dell'ultimo utilizzo \(15\/03\/2031\)/));
});

test('E3 — trasferta della replica: rientro prima della partenza, partenza dopo la replica, rientro prima della replica', () => {
  const a = conGuasto(2, p => { Object.assign(p.campi, { replica_partenza_data_1: '20/03/2031', replica_partenza_ora_1: '14:00', replica_rientro_data_1: '20/03/2031', replica_rientro_ora_1: '09:00', replica_trasporto_1: '10' }); });
  assert.ok(contiene(a.errori, /Trasferta Replica 1: rientro \(20\/03\/2031 09:00\) prima della partenza \(20\/03\/2031 14:00\)/), a.errori.join(' | '));
  const b = conGuasto(2, p => { Object.assign(p.campi, { replica_partenza_data_1: '21/03/2031', replica_rientro_data_1: '22/03/2031' }); });
  assert.ok(contiene(b.errori, /partenza \(21\/03\/2031\) dopo la data della replica \(20\/03\/2031\)/));
  const c = conGuasto(2, p => { Object.assign(p.campi, { replica_partenza_data_1: '18/03/2031', replica_rientro_data_1: '19/03/2031' }); });
  assert.ok(contiene(c.errori, /rientro \(19\/03\/2031\) prima della data della replica \(20\/03\/2031\)/));
});

test('E4 — Masterclass: fine periodo prima dell\'inizio, alloggio invertito', () => {
  assert.ok(contiene(conGuasto(3, p => { p.campi.data_evento_fine = '09/03/2031'; }).errori, /Fine Periodo Masterclass \(09\/03\/2031\) prima dell'inizio \(10\/03\/2031\)/));
  assert.ok(contiene(conGuasto(3, p => { p.campi.alloggio_partenza = '08/03/2031'; }).errori, /Alloggio: partenza \(08\/03\/2031\) prima dell'arrivo \(09\/03\/2031\)/));
});

test('E5 — Mod. 4: prove fuori sequenza o dopo l\'evento', () => {
  const r = conGuasto(4, p => { Object.assign(p.campi, { prova_data_1: '12/03/2031', prova_data_2: '11/03/2031', prova_data_3: '16/03/2031' }); });
  assert.ok(contiene(r.errori, /Prova 2 \(11\/03\/2031\) è prima di Prova 1 \(12\/03\/2031\)/), r.errori.join(' | '));
  assert.ok(contiene(r.errori, /Prova 3 \(16\/03\/2031\) è dopo la data dell'evento/));
});

// ── Da verificare ────────────────────────────────────────────────────────────

test('A1 — furgone diretto in una sede diversa da quella dell\'appuntamento', () => {
  const r = conGuasto(1, p => { p.campi.trasp_mat_dest_prova_1 = 'Sala Sbagliata'; });
  assert.ok(contiene(r.attenzione, /Furgone "Prova 1": destinazione "Sala Sbagliata" diversa dalla sede dell'appuntamento "Sala Prova A"/));
});

test('A2 — stesso giorno, due sedi: consegna non dopo il ritiro precedente (manca il viaggio)', () => {
  const r = conGuasto(1, p => {
    p.tappe = [{ key: 'prova_1', tipo: 'Prova 1', data: '15/03/2031' }, { key: 'concerto', tipo: 'Concerto', data: '15/03/2031' }];
    p.campi.prova_data_1 = '15/03/2031'; p.campi.trasp_mat_furg_ritiro_prova_1 = '16:00'; p.campi.trasp_mat_furg_consegna_concerto = '16:00';
  });
  assert.ok(contiene(r.attenzione, /manca il tempo di viaggio/), r.attenzione.join(' | '));
});

test('A3 — consegna e ritiro alla stessa ora nella stessa tappa', () => {
  const r = conGuasto(1, p => { p.campi.trasp_mat_furg_consegna_concerto = '23:30'; });
  assert.ok(contiene(r.attenzione, /Furgone "Concerto": consegna e ritiro alla stessa ora \(23:30\)/));
});

test('A4 — centralino fuori dal periodo del progetto ±7 giorni', () => {
  const r = conGuasto(4, p => { p.campi.centralino_ritiro_data = '01/03/2031'; });
  assert.ok(contiene(r.attenzione, /Centralino — ritiro materiale \(01\/03\/2031\) fuori dal periodo del progetto/));
});

test('A5 — scadenza offerte non prima del primo servizio', () => {
  const r = conGuasto(1, p => { p.campi.determina_trasp_scadenza_data = '09/03/2031'; });
  assert.ok(contiene(r.attenzione, /Scadenza offerte Trasporti \(09\/03\/2031\) non è prima del primo servizio \(09\/03\/2031\)/), r.attenzione.join(' | '));
});

test('A6 — replica in altra sede senza persone da trasportare; nessun avviso con 0 indicato', () => {
  assert.ok(contiene(conGuasto(1, p => { p.campi.replica_luogo_1 = 'Teatro Prova C'; }).attenzione, /Replica 1 a "Teatro Prova C" \(sede diversa dal concerto\): indicare quante persone/));
  assert.deepEqual(conGuasto(1, p => { p.campi.replica_luogo_1 = 'Teatro Prova C'; p.campi.replica_trasporto_1 = '0'; }).attenzione, []);
  assert.deepEqual(conGuasto(1, p => { p.campi.replica_luogo_1 = 'teatro  prova b.'; }).attenzione, [], 'stessa sede scritta diversamente');
});

test('A7 — Masterclass: concerto oltre 7 giorni dal periodo', () => {
  assert.ok(contiene(conGuasto(3, p => { p.campi.dataconcerto_data_1 = '25/03/2031'; }).attenzione, /Concerto 1 \(25\/03\/2031\) fuori dal Periodo Masterclass/));
  assert.deepEqual(conGuasto(3, p => { p.campi.dataconcerto_data_1 = '20/03/2031'; p.campi.centralino_rientro_data = '20/03/2031'; p.prestiti[0].riconsegnaData = '20/03/2031'; }).attenzione, [], 'entro 7 giorni');
});
