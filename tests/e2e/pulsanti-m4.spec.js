// Livello 2, punto 2 — Mod. 4 (Evento istituzionale): ogni pulsante di
// generazione, premuto nella pagina vera, come Responsabile, con il progetto di
// prova completo (progetti-prova/completo-m4.json) e con una variante in cui le
// due date aggiuntive sono Concerto con la loro durata (intervento D; nel
// progetto di prova restano vuote apposta). Stessi controlli del Mod. 1
// (pulsanti-m1.spec.js): documento prodotto senza avvisi, errori né eccezioni;
// dati attesi; mail = testo della finestra; DOCX = testo della bozza.
// Testi: quelli già registrati per l'intervento D (attesi/m4-progetto-di-prova.json,
// sola lettura) devono uscire identici; gli altri e quelli della variante sono in
// attesi/m4-pulsanti.json (riletti a mano, codice del commit de5baf3). Per
// rigenerarli, solo per cambi voluti:
//   AGGIORNA_ATTESI=1 npx playwright test e2e/pulsanti-m4.spec.js
// Differenze dal Mod. 1: niente Biblioteca né Personale esterno; Richiesta
// Dotazione/Materiale; Trasporti senza tratte (elenco destinazioni; tratte del
// prestito: backlog).
// Bug corretti: Q (test in fondo), R (test della Trasferta persone).
// Bug K corretto: controllato nella variante (Richiesta Spazi). Bug L corretto: test del Centralino.
// "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');
const { predisponi, premi, chiudiFinestre, confrontaConAttesi } = require('./pulsanti');

const FILE = 'Modulo_4_EventoIstituzionale.html';
const PROGETTO = require('../progetti-prova/completo-m4.json');
const ID = PROGETTO.metadati.id;
const TITOLO = PROGETTO.metadati.titolo;
const ATTESI = 'm4-pulsanti';
// Testi già registrati e riletti per l'intervento D (stesso progetto di prova, funzioni
// chiamate direttamente): premendo i pulsanti devono uscire identici. Sola lettura.
const ATTESI_D = require('./attesi/m4-progetto-di-prova.json');

const DETERMINA_TRASPORTI = 'generaBozzaDeterminaTrasporti()';
const DETERMINA_NOLEGGIO = "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 6'})";
const PDF_NOLEGGIO = "generaPDFRichiestaPreventivoNoleggio(1, {sezioneDotazione:'Sezione 6'})";

const MATERIALE_DISPONIBILE = ['Sedie: 40', 'Leggii illuminati: 28', 'Computer: 1'];
const R = PROGETTO.dati_referente;

// Variante: le due date aggiuntive come Concerto, con durata scritta (intervento D).
const VARIANTE = JSON.parse(JSON.stringify(PROGETTO));
Object.assign(VARIANTE.dati_referente, { replica_tipo_1: 'Concerto', replica_durata_1: '2 ore', replica_tipo_2: 'Concerto', replica_durata_2: "75'" });

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


test.describe('M4 — pulsanti di generazione', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  test('Sollecito (checklist completa → approfondimento) e Comunicazione', async ({ page, ambiente }) => {
    const stato = await apri(page);

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
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: R.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, approfondimento);
    await chiudiFinestre(page);

    const comunicazione = await finestra(page, ambiente, stato, 'generaPacchettoComunicazione()', 'modal-comunicazione', 'Pacchetto Comunicazione — Ufficio Stampa');
    for (const atteso of ['Data: 15/03/2031', 'Ora: 21:00', 'Luogo: Teatro Secci', '--- Repliche ---\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 — Sede Prova Replica 2',
      R.testo_descr, R.bio_artisti, R.locandina]) expect(comunicazione).toContain(atteso);
    confrontaConAttesi(ATTESI, 'comunicazione', comunicazione);
    await mail(page, ambiente, stato, 'apriMailComunicazione()', { a: 'ufficiocomunicazione@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Materiale comunicazione] ' + TITOLO + ' — ID ' + ID }, comunicazione);
    await chiudiFinestre(page);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['sollecito', 'comunicazione']));
  });

  test('Spazi (tabella, Richiesta, Notifica al Referente), Calendario PDF, stampa della Sintesi', async ({ page, ambiente }) => {
    const stato = await apri(page);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaSpazi()'), 'Aggiorna vista Spazi');
    await expect(page.locator('#spazi-tbody tr')).toHaveCount(3); // evento, 2 date aggiuntive

    const spazi = await finestra(page, ambiente, stato, 'generaRichiestaSpazi()', 'modal-spazi', 'Conferma spazi — Ufficio Produzione');
    expect(spazi, 'come registrato per l\'intervento D').toBe(ATTESI_D.richiestaSpazi);
    await mail(page, ambiente, stato, 'apriMailSpazi()', { a: 'produzione@briccialditerni.it', cc: '', oggetto: '[Conferma spazi] ' + TITOLO }, spazi);
    await chiudiFinestre(page);

    const notifica = await finestra(page, ambiente, stato, 'generaNotificaSpaziReferente()', 'modal-notifica-spazi-referente', 'Notifica Referente — Spazi assegnati');
    expect(notifica, 'come registrato per l\'intervento D').toBe(ATTESI_D.notificaSpaziReferente);
    await mail(page, ambiente, stato, 'apriMailNotificaSpaziReferente()', { a: R.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Conferma spazi assegnati' }, notifica);
    await chiudiFinestre(page);

    const calendario = await pdf(page, ambiente, stato, 'generaCalendarioPDF()', 'Calendario_Progetto_di_prova_completo_M4.pdf');
    expect(calendario, 'come registrato per l\'intervento D').toBe(ATTESI_D.calendarioPDF);

    const sintesi = await premi(page, ambiente, stato, 'stampaSintesi()');
    senzaProblemi(sintesi, 'Stampa Sintesi');
    expect(sintesi.finestre, 'finestra di stampa aperta').toHaveLength(1);
    expect(sintesi.finestre[0]).toContain('<h1>Scheda di Sintesi — ' + TITOLO + '</h1>');
    expect(sintesi.finestre[0]).not.toMatch(/<button/);
    expect(sintesi.finestre[0]).toContain('22/03/2031 — Sede Prova Replica 1; 29/03/2031 — Sede Prova Replica 2');

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['spazi', 'notifica_spazi_referente']));
  });

  test('Dotazione: tabella Disponibilità, Richiesta Dotazione/Materiale, Assistenza', async ({ page, ambiente }) => {
    const stato = await apri(page);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaDotazioneDisp()'), 'Aggiorna tabella Disponibilità');
    senzaProblemi(await premi(page, ambiente, stato, 'costruisciListaAssistenza()'), 'Aggiorna lista assistenza');
    await expect(page.locator('#assistenza-logistica-tbody tr')).toHaveCount(3);

    const dotazione = await finestra(page, ambiente, stato, 'generaRichiestaDotazioneMateriale()', 'modal-dotazione-materiale', 'Richiesta Dotazione/Materiale — Ufficio Produzione');
    expect(dotazione, 'come registrato per l\'intervento D').toBe(ATTESI_D.dotazioneMateriale);
    await mail(page, ambiente, stato, 'apriMailDotazioneMateriale()', { a: 'produzione@briccialditerni.it', cc: '', oggetto: '[Richiesta dotazione/materiale] ' + TITOLO }, dotazione);
    await chiudiFinestre(page);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['dotazione_materiale']));
  });

  test('Trasporti materiale: Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasporti()', 'modal-trasporti', 'Richiesta trasporti materiale — Ufficio Produzione');
    for (const atteso of ['· Evento principale — ' + R.dest_trasferta, '· Replica 1 — Sede Prova Replica 1 (Data: 22/03/2031)', '· Replica 2 — Sede Prova Replica 2 (Data: 29/03/2031)',
      ...MATERIALE_DISPONIBILE.map(m => '· ' + m), '· ' + R.collo_1 + ' → ' + R.collo_dest_1, '· ' + R.collo_3 + ' → ' + R.collo_dest_3]) expect(richiesta).toContain(atteso);
    confrontaConAttesi(ATTESI, 'richiestaTrasporti', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasporti()', { a: 'produzione@briccialditerni.it', cc: 'acquisti@briccialditerni.it', oggetto: '[Richiesta trasporti] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasporti()', 'Richiesta_Preventivo_Trasporti_Progetto_di_prova_completo_M4.pdf');
    for (const atteso of ['RICHIESTA DI PREVENTIVO', 'Dott.ssa Alessandra Angelucci', 'in occasione dei seguenti appuntamenti: 15/03/2031 — Teatro Secci; 22/03/2031 — Sede Prova Replica 1; 29/03/2031 — Sede Prova Replica 2',
      'Leggii: 28 — in prestito da Sede Prestito Prova leggii', 'Podio/leggio relatore: 1 — in prestito da Sede Prestito Prova leggio_relatore', 'entro le ore 12:00 del 20/02/2031'])
      expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Trasporti');
    confrontaConAttesi(ATTESI, 'pdfPreventivoTrasporti', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_TRASPORTI, docx: 'generaDOCXDeterminaTrasporti()', apriMail: 'apriMailDeterminaTrasporti()',
      idModale: 'modal-determina-trasporti', titolo: 'Bozza Determina — Trasporti',
      nomeDocx: 'Bozza_Determina_Trasporti_Progetto_di_prova_completo_M4.docx', oggetto: '[Bozza Determina Trasporti] ' + TITOLO
    });
    expect(bozza, 'come registrato per l\'intervento D').toBe(ATTESI_D.determinaTrasporti);
    for (const atteso of ['- ditta Ditta Prova trasp 1, con sede in Via Inventata 1', 'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%',
      'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto']) expect(bozza).toContain(atteso);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['trasporti', 'determina_trasporti']));
  });

  test('Noleggio/Service: Richiesta, PDF Preventivo, Determina Acquisti (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaNoleggio()', 'modal-noleggio', 'Richiesta noleggio/service — Ufficio Acquisti');
    expect(richiesta, 'come registrato per l\'intervento D').toBe(ATTESI_D.richiestaNoleggio);
    await mail(page, ambiente, stato, 'apriMailNoleggio()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta noleggio/service] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, PDF_NOLEGGIO, 'Richiesta_Preventivo_Noleggio_Service_Progetto_di_prova_completo_M4.pdf');
    expect(preventivo, 'come registrato per l\'intervento D').toBe(ATTESI_D.pdfPreventivoNoleggio);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_NOLEGGIO, docx: 'generaDOCXDeterminaNoleggio()', apriMail: 'apriMailDeterminaNoleggio()',
      idModale: 'modal-determina-noleggio', titolo: 'Bozza Determina — Acquisti e Servizi',
      nomeDocx: 'Bozza_Determina_Noleggio_Service_Progetto_di_prova_completo_M4.docx', oggetto: '[Bozza Determina Noleggio/Service] ' + TITOLO
    });
    expect(bozza, 'come registrato per l\'intervento D').toBe(ATTESI_D.determinaAcquisti);
    for (const atteso of ['- ditta Ditta Prova nol 1, con sede in Via Inventata 1', 'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%',
      'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto']) expect(bozza).toContain(atteso);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['noleggio', 'determina_noleggio']));
  });

  test('Trasferta e Trasporto persone: Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasfertaPersone()', 'modal-trasferta-persone', 'Richiesta trasferta persone — Ufficio Acquisti');
    for (const atteso of ['Destinazione: ' + R.dest_trasferta, 'Modalità trasporto: Pullman', '· Replica 1: Sede Prova Replica 1 — 22/03/2031', '· Replica 2: Sede Prova Replica 2 — 29/03/2031',
      'Persone da trasportare: 3', 'Modalità trasporto: Mezzi propri', 'Vitto: ' + R.replica_vitto_1, 'Alloggio: ' + R.replica_alloggio_2,
      'Si prega di confermare disponibilità e procedere con quanto necessario.']) expect(richiesta).toContain(atteso); // "disponibilità" con l'accento (bug R, corretto)
    confrontaConAttesi(ATTESI, 'richiestaTrasfertaPersone', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasfertaPersone()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta trasferta persone] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasportoPersone()', 'Richiesta_Preventivo_Trasporto_Persone_Progetto_di_prova_completo_M4.pdf');
    expect(preventivo, 'come registrato per l\'intervento D').toBe(ATTESI_D.pdfPreventivoTrasportoPersone);

    const bozza = await determina(page, ambiente, stato, {
      bozza: 'generaBozzaDeterminaTrasportoPersone()', docx: 'generaDOCXDeterminaTrasportoPersone()', apriMail: 'apriMailDeterminaTrasportoPersone()',
      idModale: 'modal-determina-trper', titolo: 'Bozza Determina — Trasporto Persone',
      nomeDocx: 'Bozza_Determina_Trasporto_Persone_Progetto_di_prova_completo_M4.docx', oggetto: '[Bozza Determina Trasporto Persone] ' + TITOLO
    });
    expect(bozza, 'come registrato per l\'intervento D').toBe(ATTESI_D.determinaTrasportoPersone);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['trasferta_persone', 'determina_trper']));
  });

  test('Mail Centralino (Dotazione + Assistenza)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    for (const atteso of ['── DOTAZIONE TECNICA ──', '── ASSISTENZA STUDENTI ──', ...MATERIALE_DISPONIBILE.map(m => '- ' + m),
      'Date evento:\n- 15/03/2031 — Teatro Secci\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 — Sede Prova Replica 2',
      '- Evento — 15/03/2031 — Teatro Secci — 3 studenti — orario: 14:00 – 19:00', '- Replica 1 — 22/03/2031 — Sede Prova Replica 1 — 3 studenti — orario: 21:00'])
      expect(centralino).toContain(atteso);
    // Leggii, podio e leggio del relatore arrivano in prestito: non li prepara il Centralino.
    for (const v of ['- Leggii:', 'Podio']) expect(centralino).not.toContain(v);
    // La sezione Dotazione è quella registrata per l'intervento D (testo della richiesta singola).
    expect(centralino).toContain(ATTESI_D.centralino.split('\n').slice(2, -4).join('\n'));
    // Una sola chiusura nella mail unita (bug L, corretto): "Grazie per la collaborazione." una
    // volta, "Cordiali saluti," e firma "Ufficio Produzione"; via la firma "Responsabile Produzione".
    expect(centralino.endsWith('Si prega di confermare disponibilità.\n\nGrazie per la collaborazione.\n\nCordiali saluti,\nUfficio Produzione')).toBe(true);
    expect(centralino.match(/Cordiali saluti/g)).toHaveLength(1);
    expect(centralino.match(/Grazie per la collaborazione/g)).toHaveLength(1);
    expect(centralino).not.toContain('Responsabile Produzione');
    confrontaConAttesi(ATTESI, 'centralino', centralino);
    await mail(page, ambiente, stato, 'apriMailCentralinoUnificata()', { a: 'centralino@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta Centralino] ' + TITOLO }, centralino);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['centralino']));
  });
});

test.describe('M4 — variante: date aggiuntive Concerto con la loro durata', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: VARIANTE } } });

  test('Spazi, Notifica, Calendario, Sintesi, Dotazione/Materiale, Centralino con "(Concerto)" e le durate; Determine invariate', async ({ page, ambiente }) => {
    const stato = await apri(page, VARIANTE);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaSpazi()'), 'Aggiorna vista Spazi');
    await expect(page.locator('#spazi-tbody tr')).toHaveText([/^Evento\s*15\/03\/2031\s*21:00–23:15/, /^Replica 1 \(Concerto\)\s*22\/03\/2031\s*21:00–23:45/, /^Replica 2 \(Concerto\)\s*29\/03\/2031\s*21:00–23:00/]);

    // Spazi: inizio + durata della data (2 ore, 75') + smontaggio 45'.
    const spazi = await finestra(page, ambiente, stato, 'generaRichiestaSpazi()', 'modal-spazi', 'Conferma spazi — Ufficio Produzione');
    expect(spazi).toContain('- Replica 1 (Concerto) — 22/03/2031 ore 21:00–23:45');
    expect(spazi).toContain('- Replica 1 (Concerto) — 22/03/2031 ore 21:00–23:45 — con margine di preparazione, inizio ore 21:00, durata 120\' — Spazio: Sede Prova Replica 1');
    expect(spazi).toContain('- Replica 2 (Concerto) — 29/03/2031 ore 21:00–23:00');
    expect(spazi).toContain('- Replica 2 (Concerto) — 29/03/2031 ore 21:00–23:00 — con margine di preparazione, inizio ore 21:00, durata 75\' — Spazio: Sede Prova Replica 2'); // "inizio ore" con il solo orario di inizio (bug K, corretto)
    confrontaConAttesi(ATTESI, 'varianteRichiestaSpazi', spazi);
    await chiudiFinestre(page);

    const notifica = await finestra(page, ambiente, stato, 'generaNotificaSpaziReferente()', 'modal-notifica-spazi-referente', 'Notifica Referente — Spazi assegnati');
    for (const atteso of ['- Replica 1 (Concerto) — 22/03/2031 ore 21:00–23:45', '- Replica 2 (Concerto) — 29/03/2031 ore 21:00–23:00']) expect(notifica).toContain(atteso);
    confrontaConAttesi(ATTESI, 'varianteNotificaSpaziReferente', notifica);
    await chiudiFinestre(page);

    // Calendario: FINE = inizio + durata della data (senza smontaggio).
    const calendario = await pdf(page, ambiente, stato, 'generaCalendarioPDF()', 'Calendario_Progetto_di_prova_completo_M4.pdf');
    for (const atteso of ['15/03/2031\nTeatro Secci\n21:00\n22:30\nEvento principale', '22/03/2031\nSede Prova Replica 1\n21:00\n23:00\nReplica 1 (Concerto)', '29/03/2031\nSede Prova Replica 2\n21:00\n22:15\nReplica 2 (Concerto)'])
      expect(calendario).toContain(atteso);
    confrontaConAttesi(ATTESI, 'varianteCalendarioPDF', calendario);

    const sintesi = await premi(page, ambiente, stato, 'stampaSintesi()');
    senzaProblemi(sintesi, 'Stampa Sintesi');
    expect(sintesi.finestre[0]).toContain('22/03/2031 (Concerto) — Sede Prova Replica 1; 29/03/2031 (Concerto) — Sede Prova Replica 2');

    const dotazione = await finestra(page, ambiente, stato, 'generaRichiestaDotazioneMateriale()', 'modal-dotazione-materiale', 'Richiesta Dotazione/Materiale — Ufficio Produzione');
    for (const atteso of ['- 22/03/2031 (Concerto) — Sede Prova Replica 1', '- 29/03/2031 (Concerto) — Sede Prova Replica 2']) expect(dotazione).toContain(atteso);
    confrontaConAttesi(ATTESI, 'varianteDotazioneMateriale', dotazione);
    await chiudiFinestre(page);

    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    for (const atteso of ['- 22/03/2031 (Concerto) — Sede Prova Replica 1', '- 29/03/2031 (Concerto) — Sede Prova Replica 2', '- Replica 1 (Concerto) — 22/03/2031 — Sede Prova Replica 1 — 3 studenti'])
      expect(centralino).toContain(atteso);
    // Una sola chiusura nella mail unita (bug L, corretto): "Grazie per la collaborazione." una
    // volta, "Cordiali saluti," e firma "Ufficio Produzione"; via la firma "Responsabile Produzione".
    expect(centralino.endsWith('Si prega di confermare disponibilità.\n\nGrazie per la collaborazione.\n\nCordiali saluti,\nUfficio Produzione')).toBe(true);
    expect(centralino.match(/Cordiali saluti/g)).toHaveLength(1);
    expect(centralino.match(/Grazie per la collaborazione/g)).toHaveLength(1);
    expect(centralino).not.toContain('Responsabile Produzione');
    confrontaConAttesi(ATTESI, 'varianteCentralino', centralino);
    await chiudiFinestre(page);

    // Determine, preventivi e richieste Trasporti/Noleggio/Trasferta: nessun cambiamento (decisione di Marco, intervento D).
    const invariati = [
      ['generaRichiestaTrasporti()', 'modal-trasporti', 'Richiesta trasporti materiale — Ufficio Produzione', null],
      ['generaRichiestaNoleggio()', 'modal-noleggio', 'Richiesta noleggio/service — Ufficio Acquisti', 'richiestaNoleggio'],
      [DETERMINA_TRASPORTI, 'modal-determina-trasporti', 'Bozza Determina — Trasporti', 'determinaTrasporti'],
      [DETERMINA_NOLEGGIO, 'modal-determina-noleggio', 'Bozza Determina — Acquisti e Servizi', 'determinaAcquisti'],
      ['generaBozzaDeterminaTrasportoPersone()', 'modal-determina-trper', 'Bozza Determina — Trasporto Persone', 'determinaTrasportoPersone']
    ];
    for (const [onclick, idModale, titolo, voceD] of invariati) {
      const testo = await finestra(page, ambiente, stato, onclick, idModale, titolo);
      if (voceD) expect(testo, onclick + ' invariato').toBe(ATTESI_D[voceD]);
      else confrontaConAttesi(ATTESI, 'richiestaTrasporti', testo);
      await chiudiFinestre(page);
    }
  });
});

test.describe('M4 — Sollecito con un dato mancante', () => {
  const progetto = JSON.parse(JSON.stringify(PROGETTO));
  delete progetto.dati_referente.ora_evento;
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

  test('la mail di sollecito elenca il dato mancante', async ({ page, ambiente }) => {
    const stato = await apri(page, progetto);
    const sollecito = await finestra(page, ambiente, stato, 'generaSollecitoReferente()', 'modal-sollecito', 'Sollecito — dati mancanti');
    expect(sollecito).toContain('mancano ancora i seguenti dati:\n\n- Ora inizio evento\n\n');
    confrontaConAttesi(ATTESI, 'sollecitoOraMancante', sollecito);
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: R.doc_email_1, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, sollecito);
  });
});

// Bug Q (corretto): nella Sintesi del Mod. 4 mancava il riquadro "Persone esterne"
// (contatori e dettagli Contratto singolo / Cooperativa): aggiornaSintesiCompleta
// lo riempiva ma non trovava dove scrivere, e il pulsante "Richiedi dati" (mail
// Dati anagrafici) per gli esterni con Contratto singolo non compariva mai.
// Nel progetto di prova solo l'esecutore 5 è Collaboratore esterno (Contratto singolo).
test.describe('M4 — Persone esterne in Sintesi e Richiesta dati anagrafici (bug Q)', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  test('contatori, dettagli e pulsante "Richiedi dati" che apre la mail all\'esecutore esterno', async ({ page, ambiente }) => {
    const stato = await apri(page);
    expect(await page.evaluate(() => ['sint_pers_singolo', 'sint_pers_coop', 'sint_pers_tot'].map(id => (document.getElementById(id) || {}).textContent)))
      .toEqual(['1', '0', '1']);
    expect(await page.evaluate(() => (document.getElementById('dettaglio-coop') || {}).textContent)).toBe('Nessuno');
    expect(await page.evaluate(() => (document.getElementById('dettaglio-singolo') || {}).textContent))
      .toBe('• ' + R.esec_nome_5 + ' (' + R.esec_ruolo_5 + ') — ' + R.esec_email_5 + ' / ' + R.esec_tel_5 + ' 📤 Richiedi dati');
    await expect(page.locator('button[onclick="generaRichiestaDatiAnagrafici(this)"]')).toHaveCount(1);

    const anagrafici = await premi(page, ambiente, stato, 'generaRichiestaDatiAnagrafici(this)');
    senzaProblemi(anagrafici, 'Richiedi dati');
    expect(anagrafici.mail).toHaveLength(1);
    expect(anagrafici.mail[0]).toMatchObject({ a: R.esec_email_5, cc: 'ufficiopersonale@briccialditerni.it', oggetto: 'Dati per l\'incarico e biografia artistica - ' + TITOLO });
    for (const atteso of ['Gentile ' + R.esec_nome_5 + ' (' + R.esec_ruolo_5 + '),', 'Email: ' + R.esec_email_5, 'Cellulare: ' + R.esec_tel_5]) expect(anagrafici.mail[0].corpo).toContain(atteso);
    confrontaConAttesi(ATTESI, 'datiAnagrafici', anagrafici.mail[0].corpo);
    expect((await richiesteRegistrate(page)).some(k => k.startsWith('dati_anagrafici_nome_prova_esec_5'))).toBe(true);
  });
});
