// Livello 2, punto 2 — Mod. 1: ogni pulsante di generazione, premuto nella
// pagina vera con il progetto di prova completo (progetti-prova/completo-m1.json),
// come Responsabile. Per ogni documento si controlla:
// - che venga prodotto (finestra con il testo, PDF, DOCX, mail) senza avvisi,
//   errori in console né eccezioni;
// - che contenga i dati attesi (date, luoghi, materiali, tratte, ditte, importi, RUP);
// - che la mail porti il testo della finestra, e il DOCX lo stesso testo della bozza;
// - che il testo sia quello registrato in attesi/m1-pulsanti.json (riletto a mano,
//   prodotto dal codice del commit de5baf3). Per rigenerarlo, solo per cambi voluti:
//     AGGIORNA_ATTESI=1 npx playwright test e2e/pulsanti-m1.spec.js
// I pulsanti si premono con un clic sull'elemento (anche se la sua sezione è chiusa):
// parte lo stesso onclick che parte col mouse.
// Bug trovati e non corretti: test.fail in fondo (K, L).
// "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');
const { predisponi, premi, chiudiFinestre, confrontaConAttesi } = require('./pulsanti');

const FILE = 'Modulo_1_SinfonicoCORALE.html';
const PROGETTO = require('../progetti-prova/completo-m1.json');
const ID = PROGETTO.metadati.id;
const TITOLO = PROGETTO.metadati.titolo;
const ATTESI = 'm1-pulsanti';

const DETERMINA_TRASPORTI = "generaBozzaDeterminaTrasporti(1, {sezioneDotazione:'Sezione 5A', sezioneTrasporti:'Sezione 5B'})";
const DETERMINA_NOLEGGIO = "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 5A'})";
const PDF_NOLEGGIO = "generaPDFRichiestaPreventivoNoleggio(1, {sezioneDotazione:'Sezione 5A'})";

const MATERIALE_DISPONIBILE = ['Sedie orchestrali: 40', 'Leggii illuminati: 28'];
const PRESTITI = ['Leggii (prestito): 28', 'Podio direttore (prestito): 1'];
const DA_NOLEGGIARE = ['Impianto audio / PA', 'Impianto luci palco', 'Service esterno richiesto', 'Altra dotazione tecnica'];

async function apri(page, progetto = PROGETTO) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/' + FILE + '?id=' + ID + '&ruolo=responsabile');
  await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200); // i ripristini ritardati della pagina (500–750 ms)
  return predisponi(page);
}

// Il pulsante non deve aver prodotto avvisi, errori o eccezioni.
function senzaProblemi(esito, nome) {
  expect(esito.dialoghi, nome + ': finestre alert/confirm').toEqual([]);
  expect(esito.errori, nome + ': errori in console').toEqual([]);
  expect(esito.eccezioni, nome + ': eccezioni').toEqual([]);
}

// Preme un pulsante che apre una finestra con il testo; ne restituisce il testo.
async function finestra(page, ambiente, stato, onclick, idModale, titolo) {
  const esito = await premi(page, ambiente, stato, onclick);
  senzaProblemi(esito, onclick);
  expect(Object.keys(esito.modali), onclick + ': finestra aperta').toContain(idModale);
  expect(esito.modali[idModale].titolo).toBe(titolo);
  const testo = esito.modali[idModale].testo;
  expect(testo, onclick + ': testo').not.toBe('');
  expect(testo).toContain(TITOLO);
  return testo;
}

// Preme il pulsante "Apri mail" di una finestra: destinatari, oggetto e corpo = testo della finestra.
async function mail(page, ambiente, stato, onclick, attesa, testo) {
  const esito = await premi(page, ambiente, stato, onclick);
  senzaProblemi(esito, onclick);
  expect(esito.mail, onclick + ': una mail aperta').toHaveLength(1);
  expect(esito.mail[0]).toEqual({ ...attesa, corpo: testo });
}

async function pdf(page, ambiente, stato, onclick, nomeFile) {
  const esito = await premi(page, ambiente, stato, onclick);
  senzaProblemi(esito, onclick);
  expect(esito.pdf.map(p => p.nome), onclick + ': PDF salvato').toEqual([nomeFile]);
  return esito.pdf[0].testo;
}

// Testo di un PDF su una riga sola: jsPDF va a capo dove capita, i controlli non ne dipendono.
const unaRiga = s => s.replace(/\s+/g, ' ');

// Bozza di Determina → DOCX (stesso testo della bozza) → mail al Direttore Amministrativo.
async function determina(page, ambiente, stato, { bozza, docx, apriMail, idModale, titolo, nomeDocx, oggetto }) {
  const testo = await finestra(page, ambiente, stato, bozza, idModale, titolo);
  const esito = await premi(page, ambiente, stato, docx);
  senzaProblemi(esito, docx);
  expect(esito.docx.map(d => d.nome)).toEqual([nomeDocx]);
  const spazi = s => s.replace(/\s+/g, ' ').trim();
  expect(spazi(esito.docx[0].testo), docx + ': stesso testo della bozza').toBe(spazi(testo));
  await mail(page, ambiente, stato, apriMail, { a: 'direttoreamministrativo@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto }, testo);
  await chiudiFinestre(page);
  return testo;
}

// Tutte le date gg/mm/aaaa di un testo sono del 2031 (anni coerenti, come nel caso bug 7).
function anniCoerenti(testo, nome) {
  const anni = [...new Set((testo.match(/\b\d{2}\/\d{2}\/(\d{4})\b/g) || []).map(d => d.slice(-4)))];
  expect(anni, nome + ': anni delle date').toEqual(['2031']);
}

async function richiesteRegistrate(page) {
  return page.evaluate(id => Object.keys((window.__fintoDb.documento('progetti', id).stato || {}).richieste || {}), ID);
}

test.describe('M1 — pulsanti di generazione', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  test('Sollecito (checklist completa → approfondimento), Biblioteca, Comunicazione', async ({ page, ambiente }) => {
    const stato = await apri(page);

    // Checklist completa: il Sollecito non genera una mail, apre il pannello di approfondimento.
    const sollecito = await premi(page, ambiente, stato, 'generaSollecitoReferente()');
    senzaProblemi(sollecito, 'Sollecito');
    expect(sollecito.modali).toEqual({});
    expect(await page.locator('#pannello-approfondimento').evaluate(el => el.style.display), 'pannello di approfondimento aperto').toBe('block');
    await page.evaluate(() => {
      const casella = document.querySelector('[data-approfondimento]');
      casella.checked = true;
      casella.dispatchEvent(new Event('change', { bubbles: true }));
      const nota = document.querySelector('[data-approfondimento-nota="' + casella.getAttribute('data-approfondimento') + '"]');
      nota.value = 'Nota di prova';
      nota.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const approfondimento = await finestra(page, ambiente, stato, 'generaRichiestaApprofondimento()', 'modal-sollecito', 'Richiesta approfondimento contenuti');
    expect(approfondimento).toContain('- Testo descrittivo: Nota di prova');
    confrontaConAttesi(ATTESI, 'approfondimento', approfondimento);
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: PROGETTO.dati_referente.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, approfondimento);
    await chiudiFinestre(page);

    const biblioteca = await finestra(page, ambiente, stato, 'generaRichiestaBiblioteca()', 'modal-biblioteca', 'Richiesta materiale musicale — Biblioteca');
    for (const k of ['spartito_1', 'spartito_2']) expect(biblioteca).toContain('- ' + PROGETTO.dati_referente[k]);
    confrontaConAttesi(ATTESI, 'biblioteca', biblioteca);
    await mail(page, ambiente, stato, 'apriMailBiblioteca()', { a: 'biblioteca@briccialditerni.it', cc: '', oggetto: '[Richiesta materiale musicale] ' + TITOLO }, biblioteca);
    await chiudiFinestre(page);

    const comunicazione = await finestra(page, ambiente, stato, 'generaPacchettoComunicazione()', 'modal-comunicazione', 'Pacchetto Comunicazione — Ufficio Stampa');
    for (const atteso of ['Data: 15/03/2031', 'Ora: 21:00', 'Luogo: Teatro Secci', '- 22/03/2031 — Sede Prova Replica 1', '- 29/03/2031 — Sede Prova Replica 2',
      PROGETTO.dati_referente.testo_descr, PROGETTO.dati_referente.bio_artisti, PROGETTO.dati_referente.locandina]) expect(comunicazione).toContain(atteso);
    confrontaConAttesi(ATTESI, 'comunicazione', comunicazione);
    await mail(page, ambiente, stato, 'apriMailComunicazione()', { a: 'ufficiocomunicazione@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Materiale comunicazione] ' + TITOLO + ' — ID ' + ID }, comunicazione);
    await chiudiFinestre(page);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['sollecito', 'biblioteca', 'comunicazione']));
  });

  test('Spazi (tabella, Richiesta, Notifica al Referente), Calendario PDF, stampa della Sintesi', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const tabella = await premi(page, ambiente, stato, 'costruisciTabellaSpazi()');
    senzaProblemi(tabella, 'Aggiorna vista Spazi');
    await expect(page.locator('#spazi-tbody tr')).toHaveCount(9); // 6 prove, concerto, 2 repliche

    const spazi = await finestra(page, ambiente, stato, 'generaRichiestaSpazi()', 'modal-spazi', 'Conferma spazi — Ufficio Produzione');
    for (let p = 1; p <= 6; p++) expect(spazi).toContain('- Prova ' + p + ' — ' + PROGETTO.dati_referente['prova_data_' + p] + ' ore 14:30–19:00 — con margine di preparazione, prova 15:00 – 18:30 — Spazio: Sala Orologio');
    expect(spazi).toContain('- Concerto — 15/03/2031 ore 21:00–23:15'); // 21:00 + 90' + smontaggio 45'
    expect(spazi).toContain('Spazio: Teatro Secci');
    expect(spazi).toContain('- Pianoforte / Grancoda: 1 — Già presente nella struttura di prova');
    confrontaConAttesi(ATTESI, 'richiestaSpazi', spazi);
    await mail(page, ambiente, stato, 'apriMailSpazi()', { a: 'produzione@briccialditerni.it', cc: '', oggetto: '[Conferma spazi] ' + TITOLO }, spazi);
    await chiudiFinestre(page);

    const notifica = await finestra(page, ambiente, stato, 'generaNotificaSpaziReferente()', 'modal-notifica-spazi-referente', 'Notifica Referente — Spazi assegnati');
    expect(notifica).toContain('- Prova 1 — 10/03/2031 ore 15:00 – 18:30\n  Spazio assegnato: Sala Orologio — Proposta iniziale: Sala Orologio');
    expect(notifica).toContain('- Replica 2 — 29/03/2031 ore 21:00–23:15\n  Spazio assegnato: Sede Prova Replica 2 — Proposta iniziale: Sede Prova Replica 2');
    confrontaConAttesi(ATTESI, 'notificaSpaziReferente', notifica);
    await mail(page, ambiente, stato, 'apriMailNotificaSpaziReferente()', { a: PROGETTO.dati_referente.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Conferma spazi assegnati' }, notifica);
    await chiudiFinestre(page);

    const calendario = await pdf(page, ambiente, stato, 'generaCalendarioPDF()', 'Calendario_Progetto_di_prova_completo_M1.pdf');
    for (const atteso of ['CALENDARIO PROVE / CONCERTI / REPLICHE', TITOLO, '15/03/2031\nTeatro Secci\n21:00\n22:30\nConcerto', '22/03/2031\nSede Prova Replica 1\n21:00\n—\nReplica 1', '10/03/2031\nSala Orologio\n15:00\n18:30\nProva 1'])
      expect(calendario).toContain(atteso);
    anniCoerenti(calendario, 'Calendario');
    confrontaConAttesi(ATTESI, 'calendarioPDF', calendario);

    const sintesi = await premi(page, ambiente, stato, 'stampaSintesi()');
    senzaProblemi(sintesi, 'Stampa Sintesi');
    expect(sintesi.finestre, 'finestra di stampa aperta').toHaveLength(1);
    const html = sintesi.finestre[0];
    expect(html).toContain('<h1>Scheda di Sintesi — ' + TITOLO + '</h1>');
    expect(html).not.toMatch(/<button/);
    for (const atteso of ['15/03/2031', 'Teatro Secci']) expect(html).toContain(atteso);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['spazi', 'notifica_spazi_referente']));
  });

  test('Trasporti materiale: tabella, Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail) — tratte coerenti', async ({ page, ambiente }) => {
    const stato = await apri(page);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaTrasportiMateriale()'), 'Aggiorna tabella trasporti');
    senzaProblemi(await premi(page, ambiente, stato, 'costruisciListaAssistenza()'), 'Aggiorna lista assistenza');

    // Tratte attese, in ordine: ritiro dei prestiti, andata alla prima prova, concerto,
    // replica 1, rientro, riconsegna dei prestiti (la replica 2 non ha trasporto).
    const TRATTE = [
      'da Sede Prestito Prova leggii a Conservatorio', 'da Sede Prestito Prova podio a Conservatorio', 'da Conservatorio a Sala Orologio',
      'da Sala Orologio a Teatro Secci', 'da Teatro Secci a Sede Prova Replica 1', 'da Sede Prova Replica 1 a Conservatorio',
      'da Conservatorio a Sede Prestito Prova leggii', 'da Conservatorio a Sede Prestito Prova podio'
    ];
    const inOrdine = (testo, nome) => {
      const pos = TRATTE.map(t => testo.toLowerCase().indexOf(t.toLowerCase()));
      expect(pos.every(p => p >= 0), nome + ': tutte le tratte ' + JSON.stringify(pos)).toBe(true);
      expect([...pos].sort((a, b) => a - b), nome + ': tratte in ordine').toEqual(pos);
      expect(testo, nome).not.toContain('Sede Prova Replica 2');
    };

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasporti()', 'modal-trasporti', 'Richiesta trasporti materiale — Ufficio Produzione');
    inOrdine(richiesta, 'Richiesta trasporti');
    expect(richiesta).toContain('- Trasferimento (09/03/2031): da Sede Prestito Prova leggii a Conservatorio — ritiro ore 10:00 — materiale: Leggii (prestito): 28');
    expect(richiesta).toContain('- Trasferimento (31/03/2031): da Conservatorio a Sede Prestito Prova podio — riconsegna ore 10:00 — materiale: Podio direttore (prestito): 1');
    for (const m of [...MATERIALE_DISPONIBILE, 'Leggii: 28', 'Podio direttore: 1']) expect(richiesta).toContain(m);
    anniCoerenti(richiesta, 'Richiesta trasporti');
    confrontaConAttesi(ATTESI, 'richiestaTrasporti', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasporti()', { a: 'produzione@briccialditerni.it', cc: 'acquisti@briccialditerni.it', oggetto: '[Richiesta trasporti] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasporti()', 'Richiesta_Preventivo_Trasporti_Progetto_di_prova_completo_M1.pdf');
    inOrdine(unaRiga(preventivo), 'PDF Preventivo Trasporti');
    for (const atteso of ['RICHIESTA DI PREVENTIVO', 'Dott.ssa Alessandra Angelucci', 'Leggii: 28 — in prestito da Sede Prestito Prova leggii', 'entro le ore 12:00 del 20/02/2031',
      'con prove nei giorni 10/03/2031, 11/03/2031, 12/03/2031, 13/03/2031, 14/03/2031, 15/03/2031 e concerti nei giorni 15/03/2031, 22/03/2031, 29/03/2031']) expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Trasporti');
    confrontaConAttesi(ATTESI, 'pdfPreventivoTrasporti', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_TRASPORTI, docx: 'generaDOCXDeterminaTrasporti()', apriMail: 'apriMailDeterminaTrasporti()',
      idModale: 'modal-determina-trasporti', titolo: 'Bozza Determina — Trasporti',
      nomeDocx: 'Bozza_Determina_Trasporti_Progetto_di_prova_completo_M1.docx', oggetto: '[Bozza Determina Trasporti] ' + TITOLO
    });
    inOrdine(bozza, 'Determina Trasporti');
    for (const atteso of ['affidamento diretto per il servizio di trasporto materiale', 'del giorno 15/03/2031 presso Teatro Secci',
      '- ditta Ditta Prova trasp 1, con sede in Via Inventata 1', 'per un importo di € 980,00 oltre IVA', '€ 1.234,56 oltre IVA split payment',
      'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%', 'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto'])
      expect(bozza).toContain(atteso);
    anniCoerenti(bozza.replace(/Determina n\.[^\n]*/g, ''), 'Determina Trasporti');
    confrontaConAttesi(ATTESI, 'determinaTrasporti', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['trasporti', 'determina_trasporti']));
  });

  test('Noleggio/Service: Richiesta, PDF Preventivo, Determina Acquisti (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaNoleggio()', 'modal-noleggio', 'Richiesta noleggio/service — Ufficio Acquisti');
    expect(richiesta).toContain('per il periodo dal 10/03/2031 al 29/03/2031');
    for (const v of DA_NOLEGGIARE) expect(richiesta).toContain('- ' + v + ': 1');
    for (const v of ['Sedie', 'Leggii', 'Podio', 'Pianoforte']) expect(richiesta, 'solo il materiale da noleggiare').not.toContain(v);
    confrontaConAttesi(ATTESI, 'richiestaNoleggio', richiesta);
    await mail(page, ambiente, stato, 'apriMailNoleggio()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta noleggio/service] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, PDF_NOLEGGIO, 'Richiesta_Preventivo_Noleggio_Service_Progetto_di_prova_completo_M1.pdf');
    for (const atteso of ['Dott.ssa Alessandra Angelucci', 'in programma il 15/03/2031', ...DA_NOLEGGIARE]) expect(unaRiga(preventivo)).toContain(atteso);
    for (const v of ['Sedie orchestrali', 'Podio']) expect(preventivo).not.toContain(v);
    anniCoerenti(preventivo, 'PDF Preventivo Noleggio');
    confrontaConAttesi(ATTESI, 'pdfPreventivoNoleggio', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_NOLEGGIO, docx: 'generaDOCXDeterminaNoleggio()', apriMail: 'apriMailDeterminaNoleggio()',
      idModale: 'modal-determina-noleggio', titolo: 'Bozza Determina — Acquisti e Servizi',
      nomeDocx: 'Bozza_Determina_Noleggio_Service_Progetto_di_prova_completo_M1.docx', oggetto: '[Bozza Determina Noleggio/Service] ' + TITOLO
    });
    for (const atteso of [...DA_NOLEGGIARE.map(v => '- ' + v + ' — '), '- ditta Ditta Prova nol 1, con sede in Via Inventata 1', 'per un importo di € 980,00 oltre IVA',
      'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%', 'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto'])
      expect(bozza).toContain(atteso);
    confrontaConAttesi(ATTESI, 'determinaNoleggio', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['noleggio', 'determina_noleggio']));
  });

  test('Trasferta e Trasporto persone: Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasfertaPersone()', 'modal-trasferta-persone', 'Richiesta trasferta persone — Ufficio Acquisti');
    for (const atteso of ['Destinazione: Sede Prova 1', 'Modalità trasporto: Pullman', '· Replica 1: Sede Prova Replica 1 — 22/03/2031', '· Replica 2: Sede Prova Replica 2 — 29/03/2031',
      'Persone da trasportare: 3', 'Modalità trasporto: Mezzi propri']) expect(richiesta).toContain(atteso);
    confrontaConAttesi(ATTESI, 'richiestaTrasfertaPersone', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasfertaPersone()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta trasferta persone] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasportoPersone()', 'Richiesta_Preventivo_Trasporto_Persone_Progetto_di_prova_completo_M1.pdf');
    for (const atteso of ['Dott.ssa Alessandra Angelucci', 'servizio di trasferta persone', 'in programma il 15/03/2031', 'Sede Prova Replica 1']) expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Trasporto persone');
    confrontaConAttesi(ATTESI, 'pdfPreventivoTrasportoPersone', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: 'generaBozzaDeterminaTrasportoPersone()', docx: 'generaDOCXDeterminaTrasportoPersone()', apriMail: 'apriMailDeterminaTrasportoPersone()',
      idModale: 'modal-determina-trper', titolo: 'Bozza Determina — Trasporto Persone',
      nomeDocx: 'Bozza_Determina_Trasporto_Persone_Progetto_di_prova_completo_M1.docx', oggetto: '[Bozza Determina Trasporto Persone] ' + TITOLO
    });
    for (const atteso of ['servizio di trasferta persone (pullman/bus)', '– Concerto — Sede Prova 1 (Pullman', '– Replica 1 — Sede Prova Replica 1 (22/03/2031): 3 persone, Pullman',
      '– Replica 2 — Sede Prova Replica 2 (29/03/2031): 3 persone, Mezzi propri', '- ditta Ditta Prova trper 1, con sede in Via Inventata 1',
      'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%', 'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto'])
      expect(bozza).toContain(atteso);
    confrontaConAttesi(ATTESI, 'determinaTrasportoPersone', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['trasferta_persone', 'determina_trper']));
  });

  test('Mail Centralino (Dotazione + Assistenza) e Richiesta dati anagrafici', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    for (const atteso of ['── DOTAZIONE TECNICA ──', '── ASSISTENZA STUDENTI ──', ...MATERIALE_DISPONIBILE.map(m => '- ' + m),
      '· 15/03/2031 (21:00 — Concerto) — Teatro Secci', '· 10/03/2031 (15:00–18:30) — Sala Orologio',
      '📤 Prelievo (uscita dal Conservatorio): 10/03/2031', '📥 Riconsegna (rientro in Conservatorio): 22/03/2031',
      '- Prova 1 — 10/03/2031 — Sala Orologio — 3 studenti — orario: 15:00 – 18:30']) expect(centralino).toContain(atteso);
    // Leggii e podio arrivano in prestito: non li prepara il Centralino.
    for (const v of ['- Leggii:', 'Podio']) expect(centralino).not.toContain(v);
    confrontaConAttesi(ATTESI, 'centralino', centralino);
    await mail(page, ambiente, stato, 'apriMailCentralinoUnificata()', { a: 'centralino@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta Centralino] ' + TITOLO }, centralino);
    await chiudiFinestre(page);

    // Un solo collaboratore esterno con Contratto singolo (pers 5): un solo pulsante "Richiedi dati".
    const r = PROGETTO.dati_responsabile;
    const anagrafici = await premi(page, ambiente, stato, 'generaRichiestaDatiAnagrafici(this)');
    senzaProblemi(anagrafici, 'Richiedi dati');
    expect(anagrafici.mail).toHaveLength(1);
    expect(anagrafici.mail[0]).toMatchObject({ a: r.pers_email_5, cc: 'ufficiopersonale@briccialditerni.it', oggetto: 'Dati per l\'incarico e biografia artistica - ' + TITOLO });
    for (const atteso of ['Gentile ' + r.pers_nome_5 + ' (' + r.pers_ruolo_5 + '),', 'Email: ' + r.pers_email_5, 'Cellulare: ' + r.pers_tel_5]) expect(anagrafici.mail[0].corpo).toContain(atteso);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['centralino', 'dati_anagrafici_nome_prova_pers_5_testo_di_prova_pers_ru']));
  });

  test('Personale esterno (cooperativa): PDF Preventivo e Determina (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);
    // Il progetto di prova non ha esterni in Distribuzione Organico (dist_est_* = 0):
    // senza, il PDF si ferma con un avviso. Se ne scrivono due, come farebbe l'utente.
    await page.evaluate(() => { document.querySelectorAll('.section-body.hidden').forEach(el => el.classList.remove('hidden')); });
    await page.locator('[name="dist_est_fl"]').fill('2');
    await page.locator('[name="dist_est_vi1"]').fill('3');

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoPersonaleEsterno()', 'Richiesta_Preventivo_Personale_Esterno_Progetto_di_prova_completo_M1.pdf');
    for (const atteso of ['Dott.ssa Susanna Fanizza', 'Flauti: 2', 'Violini I: 3', 'in programma il 15/03/2031']) expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Personale');
    confrontaConAttesi(ATTESI, 'pdfPreventivoPersonaleEsterno', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: 'generaBozzaDeterminaPersonale()', docx: 'generaDOCXDeterminaPersonale()', apriMail: 'apriMailDeterminaPersonale()',
      idModale: 'modal-determina-personale', titolo: 'Bozza Determina — Personale Esterno',
      nomeDocx: 'Bozza_Determina_Personale_Esterno_Progetto_di_prova_completo_M1.docx', oggetto: '[Bozza Determina Personale Esterno] ' + TITOLO
    });
    for (const atteso of ['– Flauti: 2;', '– Violini I: 3;', 'per un importo di € 1.234,56 oltre IVA — SCELTA;', 'Importo del contratto: € 1.234,56 oltre IVA = € 1.506,16 totale (split payment)',
      'DI NOMINARE Dott.ssa Susanna Fanizza quale Responsabile Unico del Progetto (RUP)', 'IBAN ' + PROGETTO.dati_responsabile.prevpers_iban_1])
      expect(bozza).toContain(atteso);
    confrontaConAttesi(ATTESI, 'determinaPersonale', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['determina_personale']));
  });

  test('PDF Personale senza esterni in cooperativa: un avviso e nessun documento', async ({ page, ambiente }) => {
    const stato = await apri(page);
    const esito = await premi(page, ambiente, stato, 'generaPDFRichiestaPreventivoPersonaleEsterno()');
    expect(esito.dialoghi).toEqual(['alert: Nessuno strumentista/ruolo esterno con modalità "Cooperativa/Preventivo" indicato in Sezione 10 — Distribuzione Organico.']);
    expect(esito.pdf).toEqual([]);
    expect(esito.eccezioni).toEqual([]);
  });
});

test.describe('M1 — Sollecito con un dato mancante', () => {
  const progetto = JSON.parse(JSON.stringify(PROGETTO));
  delete progetto.dati_referente.durata;
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

  test('la mail di sollecito elenca il dato mancante', async ({ page, ambiente }) => {
    const stato = await apri(page, progetto);
    const sollecito = await finestra(page, ambiente, stato, 'generaSollecitoReferente()', 'modal-sollecito', 'Sollecito — dati mancanti');
    expect(sollecito).toContain('mancano ancora i seguenti dati:\n\n- Durata stimata\n\n');
    confrontaConAttesi(ATTESI, 'sollecitoDurataMancante', sollecito);
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: PROGETTO.dati_referente.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, sollecito);
  });
});

// Bug trovati con questi test, segnalati e NON corretti: test.fail = il test
// descrive il comportamento giusto e oggi fallisce. Quando il bug viene
// corretto il test diventa rosso: togliere test.fail e aggiornare gli attesi.
test.describe('M1 — bug noti dei pulsanti', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  // Bug K: nella Richiesta Spazi l'orario di concerto e repliche viene esteso due
  // volte: la tabella contiene già "21:00–23:15" e la nota diventa
  // "inizio ore 21:00–23:15" invece di "inizio ore 21:00". Stesso codice nei Mod. 2 e 4.
  test.fail('bug K — Richiesta Spazi: "inizio ore" del concerto con il solo orario di inizio', async ({ page, ambiente }) => {
    const stato = await apri(page);
    await premi(page, ambiente, stato, 'costruisciTabellaSpazi()');
    const spazi = await finestra(page, ambiente, stato, 'generaRichiestaSpazi()', 'modal-spazi', 'Conferma spazi — Ufficio Produzione');
    expect(spazi).toContain('- Concerto — 15/03/2031 ore 21:00–23:15 — con margine di preparazione, inizio ore 21:00, durata 90\'');
  });

  // Bug L: Mail Centralino con Dotazione e Assistenza insieme: la sezione
  // Assistenza tiene la sua chiusura ("Grazie per la collaborazione. / Cordiali
  // saluti, / Responsabile Produzione") e la mail ha due saluti. Si toglie solo la
  // firma "Ufficio Produzione". Stesso codice nei Mod. 2-4.
  test.fail('bug L — Mail Centralino: un solo saluto finale', async ({ page, ambiente }) => {
    const stato = await apri(page);
    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    expect(centralino.match(/Cordiali saluti/g)).toHaveLength(1);
  });
});

// Bug P (corretto): nel PDF Preventivo Trasporti la frase delle date elencava ogni
// prova e ogni concerto/replica, anche con la stessa data ripetuta. Variante: la
// prova 2 lo stesso giorno della prova 1, la replica 1 lo stesso giorno del concerto.
test.describe('M1 — PDF Preventivo Trasporti con date ripetute (bug P)', () => {
  const progetto = JSON.parse(JSON.stringify(PROGETTO));
  Object.assign(progetto.dati_referente, { prova_data_2: progetto.dati_referente.prova_data_1, replica_data_1: progetto.dati_referente.data_evento });
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

  test('ogni giorno di prova e di concerto una volta sola', async ({ page, ambiente }) => {
    const stato = await apri(page, progetto);
    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasporti()', 'Richiesta_Preventivo_Trasporti_Progetto_di_prova_completo_M1.pdf');
    expect(unaRiga(preventivo)).toContain('con prove nei giorni 10/03/2031, 12/03/2031, 13/03/2031, 14/03/2031, 15/03/2031 e concerti nei giorni 15/03/2031, 29/03/2031, con successivo ritiro');
  });
});
