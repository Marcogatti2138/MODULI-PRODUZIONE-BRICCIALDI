// Livello 1 — Dashboard: elenco Scadenze, contatori "Progetti attivi" e "In scadenza 30gg",
// classificazione degli stati. "Oggi" è fissato al 15/03/2031. Tutti i dati sono inventati.
// ("Prossimi 7 giorni" non esiste ancora: arriverà con il restyling della Dashboard.)

const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGINE, caricaFunzioni } = require('../helpers/estrai-funzioni');
const { dataFissa } = require('../helpers/copie');

// Finta pagina: getElementById restituisce un contenitore che raccoglie innerHTML/textContent.
function dashboard(progetti) {
  const elementi = {};
  const document = { getElementById: id => (elementi[id] = elementi[id] || { innerHTML: '', textContent: '' }) };
  const f = caricaFunzioni(PAGINE.D, ['renderScadenze', 'aggiornaStrisciaNumeri', 'classificaStatoProgetto', 'giorniMancanti',
    'parseDataIT', 'formatDataIT', 'escapeHtml'], { document, tuttiIProgetti: progetti, Date: dataFissa(2031, 3, 15, 10) });
  return { f, elementi };
}

// Progetto della Dashboard come lo costruisce il caricamento da Firestore.
function p(id, opz) {
  return { id, meta: Object.assign({ titolo: 'Progetto ' + id, tipologia: 'sinfonico-corale' }, opz.meta), stato: opz.stato || {}, dr: opz.dr || {}, drresp: {} };
}

// Testo leggibile dell'elenco Scadenze (senza markup).
const testoScadenze = html => html.replace(/<span class="scadenza-tipo">/g, ' | ').replace(/<[^>]+>/g, '').replace(/Apri →/g, '\n').trim();

test('giorniMancanti: oggi, domani, ieri e oltre il cambio dell\'ora legale', () => {
  const { f } = dashboard([]);
  assert.equal(f.giorniMancanti(f.parseDataIT('15/03/2031')), 0);
  assert.equal(f.giorniMancanti(f.parseDataIT('16/03/2031')), 1);
  assert.equal(f.giorniMancanti(f.parseDataIT('14/03/2031')), -1);
  assert.equal(f.giorniMancanti(f.parseDataIT('15/04/2031')), 31);   // l'ora legale cambia il 30/03/2031
});

test('classificaStatoProgetto: annullato > completato > rimandato > scaduto > attivo', () => {
  const { f } = dashboard([]);
  assert.equal(f.classificaStatoProgetto(p('1', { stato: { annullato: true, completato: true } })), 'annullati');
  assert.equal(f.classificaStatoProgetto(p('2', { stato: { completato: true, rimandato: true } })), 'completati');
  assert.equal(f.classificaStatoProgetto(p('3', { stato: { rimandato: true } })), 'rimandati');
  assert.equal(f.classificaStatoProgetto(p('4', { meta: { scadenza: '14/03/2031' } })), 'scaduti');
  assert.equal(f.classificaStatoProgetto(p('5', { meta: { scadenza: '14/03/2031' }, stato: { referente_completato_il: { seconds: 1 } } })), 'attivi');
  assert.equal(f.classificaStatoProgetto(p('6', { meta: { scadenza: '15/03/2031' } })), 'attivi', 'la scadenza di oggi non è ancora passata');
  assert.equal(f.classificaStatoProgetto(p('7', {})), 'attivi');
});

test('Scadenze: ordine per prima data, etichette oggi/domani/tra N giorni/ieri, data prevista come riserva', () => {
  const { f, elementi } = dashboard([]);
  f.renderScadenze([
    p('A', { dr: { data_evento: '25/03/2031' }, meta: { scadenza: '16/03/2031' } }),
    p('B', { meta: { data_evento_prevista: '15/03/2031' } }),
    p('C', { dr: { data_evento: '14/03/2031' } })
  ]);
  assert.equal(testoScadenze(elementi['scadenze-body'].innerHTML), [
    'Progetto C | Data evento — 14/03/2031 (ieri)',
    'Progetto B | Data evento (prevista) — 15/03/2031 (oggi)',
    'Progetto A | Scadenza risposta Referente — 16/03/2031 (domani) | Data evento — 25/03/2031 (tra 10 giorni)'
  ].join('\n'));
});

test('Scadenze: esclusi stati terminali, date passate da più di un giorno, scadenza già soddisfatta dal Referente', () => {
  const { f, elementi } = dashboard([]);
  f.renderScadenze([
    p('Annullato', { dr: { data_evento: '20/03/2031' }, stato: { annullato: true } }),
    p('Completato', { dr: { data_evento: '20/03/2031' }, stato: { completato: true } }),
    p('Rimandato', { dr: { data_evento: '20/03/2031' }, stato: { rimandato: true } }),
    p('Passato', { dr: { data_evento: '13/03/2031' } }),
    p('Risposto', { meta: { scadenza: '18/03/2031' }, stato: { referente_completato_il: { seconds: 1 } } })
  ]);
  assert.equal(testoScadenze(elementi['scadenze-body'].innerHTML), 'Nessuna scadenza imminente.');
});

test('Scadenze: colore del bordo in base alla prima data (≤3 rosso, ≤7 arancio, oltre verde)', () => {
  const { f, elementi } = dashboard([]);
  f.renderScadenze([p('R', { dr: { data_evento: '18/03/2031' } }), p('A', { dr: { data_evento: '22/03/2031' } }), p('V', { dr: { data_evento: '23/03/2031' } })]);
  const colori = [...elementi['scadenze-body'].innerHTML.matchAll(/border-left-color:([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(colori, ['var(--rosso)', 'var(--arancio)', 'var(--verde)']);
});

test('Scadenze: il titolo non può inserire markup nella pagina', () => {
  const { f, elementi } = dashboard([]);
  f.renderScadenze([p('X', { meta: { titolo: '<b>Prova & co</b>' }, dr: { data_evento: '20/03/2031' } })]);
  assert.match(elementi['scadenze-body'].innerHTML, /&lt;b&gt;Prova &amp; co&lt;\/b&gt;/);
});

test('Contatori: "Progetti attivi" e "In scadenza 30gg" (da oggi a 30 giorni compresi)', () => {
  const progetti = [
    p('oggi', { dr: { data_evento: '15/03/2031' } }),
    p('30gg', { dr: { data_evento: '14/04/2031' } }),
    p('31gg', { dr: { data_evento: '15/04/2031' } }),
    p('prevista', { meta: { data_evento_prevista: '01/04/2031' } }),
    p('ieri', { dr: { data_evento: '14/03/2031' } }),
    p('completato', { dr: { data_evento: '20/03/2031' }, stato: { completato: true } }),
    p('scaduto', { meta: { scadenza: '01/03/2031' } })
  ];
  const { f, elementi } = dashboard(progetti);
  f.aggiornaStrisciaNumeri();
  assert.equal(elementi['num-attivi'].textContent, 5);     // tutti tranne completato e scaduto
  assert.equal(elementi['num-scadenza'].textContent, 3);   // oggi, 30gg, prevista
});

test('Contatore "In scadenza 30gg" coerente con l\'elenco Scadenze', { todo: 'Da decidere con Marco (01/10/2026): con la scadenza Referente passata da tempo e l\'evento entro 30 giorni, l\'elenco mostra l\'evento ma il contatore non conta il progetto' }, () => {
  const progetti = [p('Z', { meta: { scadenza: '20/02/2031' }, dr: { data_evento: '25/03/2031' } })];
  const { f, elementi } = dashboard(progetti);
  f.renderScadenze(progetti);
  assert.match(elementi['scadenze-body'].innerHTML, /Data evento — 25\/03\/2031/);
  f.aggiornaStrisciaNumeri();
  assert.equal(elementi['num-scadenza'].textContent, 1);
});
