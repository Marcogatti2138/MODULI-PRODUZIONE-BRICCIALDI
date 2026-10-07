// Livello 2, punto 2 — Mod. 3 (Masterclass): ogni pulsante di generazione,
// premuto nella pagina vera con il progetto di prova completo
// (progetti-prova/completo-m3.json), come Responsabile. Stessi controlli del
// Mod. 1 (pulsanti-m1.spec.js): documento prodotto senza avvisi, errori né
// eccezioni; dati attesi; mail = testo della finestra; DOCX = testo della bozza;
// testo registrato in attesi/m3-pulsanti.json (riletto a mano, codice del commit
// de5baf3). Per rigenerarlo, solo per cambi voluti:
//   AGGIORNA_ATTESI=1 npx playwright test e2e/pulsanti-m3.spec.js
// Differenze dal Mod. 1: lezioni invece di prove, concerti finali (date di
// concerto) invece di repliche, nessuna Richiesta Spazi (gli spazi vanno nella
// Mail Centralino), nessun Personale esterno, Dati anagrafici del docente esterno.
// Nel progetto di prova i concerti non hanno trasporto materiale (casella non
// spuntata): le tratte sono solo prestito, prima lezione, rientro.
// Bug trovati e non corretti: test.fail in fondo (L). Bug P corretto (date ripetute nel
// PDF Preventivo Trasporti): controllato nel test dei Trasporti.
// "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');
const { predisponi, premi, chiudiFinestre, confrontaConAttesi } = require('./pulsanti');

const FILE = 'Modulo_3_Masterclass.html';
const PROGETTO = require('../progetti-prova/completo-m3.json');
const ID = PROGETTO.metadati.id;
const TITOLO = PROGETTO.metadati.titolo;
const ATTESI = 'm3-pulsanti';

const DETERMINA_TRASPORTI = "generaBozzaDeterminaTrasporti(1, {sezioneDotazione:'Sezione 6A', sezioneTrasporti:'Sezione 6C'})";
const DETERMINA_NOLEGGIO = "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 6A'})";
const PDF_NOLEGGIO = "generaPDFRichiestaPreventivoNoleggio(1, {sezioneDotazione:'Sezione 6A'})";

const DA_NOLEGGIARE = ['Registrazione audio/video', 'Altra dotazione tecnica'];
const R = PROGETTO.dati_referente;
// Il Sollecito va al docente con ruolo "Referente" (nel progetto di prova il 2).
const EMAIL_REFERENTE = R['doc_email_' + Object.keys(R).find(k => /^doc_ruolomc_\d+$/.test(k) && R[k] === 'Referente').split('_').pop()];

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


test.describe('M3 — pulsanti di generazione', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  test('Sollecito (checklist completa → approfondimento), Biblioteca, Comunicazione', async ({ page, ambiente }) => {
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
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: EMAIL_REFERENTE, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, approfondimento);
    await chiudiFinestre(page);

    const biblioteca = await finestra(page, ambiente, stato, 'generaRichiestaBiblioteca()', 'modal-biblioteca', 'Richiesta materiale musicale — Biblioteca');
    for (const k of ['spartito_1', 'spartito_2']) expect(biblioteca).toContain('- ' + R[k]);
    confrontaConAttesi(ATTESI, 'biblioteca', biblioteca);
    await mail(page, ambiente, stato, 'apriMailBiblioteca()', { a: 'biblioteca@briccialditerni.it', cc: '', oggetto: '[Richiesta materiale musicale] ' + TITOLO }, biblioteca);
    await chiudiFinestre(page);

    const comunicazione = await finestra(page, ambiente, stato, 'generaPacchettoComunicazione()', 'modal-comunicazione', 'Pacchetto Comunicazione — Ufficio Stampa');
    for (const atteso of ['Data (dal): 15/03/2031', 'Data (al): 17/03/2031', '- Lezione 1 — 15/03/2031 ore 15:00 – 18:30 — Sala Orologio',
      '- Concerto — 17/03/2031 ore 21:00 — Teatro Secci', '- Concerto (2) — 18/03/2031 ore 21:00 — Teatro Secci',
      '--- Biografia docente ---\n' + R.bio_artisti, R.testo_descr, R.locandina]) expect(comunicazione).toContain(atteso);
    confrontaConAttesi(ATTESI, 'comunicazione', comunicazione);
    await mail(page, ambiente, stato, 'apriMailComunicazione()', { a: 'ufficiocomunicazione@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Materiale comunicazione] ' + TITOLO + ' — ID ' + ID }, comunicazione);
    await chiudiFinestre(page);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['sollecito', 'biblioteca', 'comunicazione']));
  });

  test('Spazi (tabella, Notifica al Referente), Calendario PDF, stampa della Sintesi', async ({ page, ambiente }) => {
    const stato = await apri(page);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaSpazi()'), 'Aggiorna vista Spazi');
    await expect(page.locator('#spazi-tbody tr')).toHaveCount(8); // 6 lezioni, 2 concerti

    // Il Referente del Mod. 3 non propone un luogo ma una capienza: la "proposta" è la capienza.
    const notifica = await finestra(page, ambiente, stato, 'generaNotificaSpaziReferente()', 'modal-notifica-spazi-referente', 'Notifica Referente — Spazi assegnati');
    expect(notifica).toContain('- Lezione 1 — 15/03/2031 ore 15:00 – 18:30\n  Spazio assegnato: Sala Orologio — Proposta iniziale: capienza: 3');
    expect(notifica).toContain('- Concerto (2) — 18/03/2031 ore 21:00\n  Spazio assegnato: Teatro Secci — Proposta iniziale: capienza: 120');
    confrontaConAttesi(ATTESI, 'notificaSpaziReferente', notifica);
    await mail(page, ambiente, stato, 'apriMailNotificaSpaziReferente()', { a: EMAIL_REFERENTE, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Conferma spazi assegnati' }, notifica);
    await chiudiFinestre(page);

    const calendario = await pdf(page, ambiente, stato, 'generaCalendarioPDF()', 'Calendario_Progetto_di_prova_completo_M3.pdf');
    for (const atteso of ['CALENDARIO LEZIONI / CONCERTI', TITOLO, '15/03/2031\nSala Orologio\n15:00\n18:30\nLezione 1', '17/03/2031\nTeatro Secci\n21:00\n—\nConcerto', '18/03/2031\nTeatro Secci\n21:00\n—\nConcerto'])
      expect(calendario).toContain(atteso);
    anniCoerenti(calendario, 'Calendario');
    confrontaConAttesi(ATTESI, 'calendarioPDF', calendario);

    const sintesi = await premi(page, ambiente, stato, 'stampaSintesi()');
    senzaProblemi(sintesi, 'Stampa Sintesi');
    expect(sintesi.finestre, 'finestra di stampa aperta').toHaveLength(1);
    expect(sintesi.finestre[0]).toContain('<h1>Scheda di Sintesi — ' + TITOLO + '</h1>');
    expect(sintesi.finestre[0]).not.toMatch(/<button/);
    expect(sintesi.finestre[0]).toContain('15/03/2031');

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['notifica_spazi_referente']));
  });

  test('Trasporti materiale: tabella, Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail) — tratte coerenti', async ({ page, ambiente }) => {
    const stato = await apri(page);

    senzaProblemi(await premi(page, ambiente, stato, 'costruisciTabellaTrasportiMateriale()'), 'Aggiorna tabella trasporti');
    senzaProblemi(await premi(page, ambiente, stato, 'costruisciListaAssistenza()'), 'Aggiorna lista assistenza');

    // Tratte attese, in ordine: ritiro del prestito, andata alla prima lezione, rientro, riconsegna.
    const TRATTE = ['da Sede Prestito Prova leggii a Conservatorio', 'da Conservatorio a Sala Orologio', 'da Sala Orologio a Conservatorio', 'da Conservatorio a Sede Prestito Prova leggii'];
    const inOrdine = (testo, nome) => {
      const pos = TRATTE.map(t => testo.toLowerCase().indexOf(t.toLowerCase()));
      expect(pos.every(p => p >= 0), nome + ': tutte le tratte ' + JSON.stringify(pos)).toBe(true);
      expect([...pos].sort((a, b) => a - b), nome + ': tratte in ordine').toEqual(pos);
    };

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasporti()', 'modal-trasporti', 'Richiesta trasporti materiale — Ufficio Produzione');
    inOrdine(richiesta, 'Richiesta trasporti');
    expect(richiesta).toContain('- Trasferimento (09/03/2031): da Sede Prestito Prova leggii a Conservatorio — ritiro ore 10:00 — materiale: Leggii (prestito): 28');
    expect(richiesta).toContain('- Trasferimento (18/03/2031): da Conservatorio a Sede Prestito Prova leggii — riconsegna ore 10:00 — materiale: Leggii (prestito): 28');
    for (const m of ['Sedie: 40', 'Leggii: 28']) expect(richiesta).toContain(m);
    expect(richiesta, 'concerti senza trasporto materiale').not.toContain('Teatro Secci');
    anniCoerenti(richiesta, 'Richiesta trasporti');
    confrontaConAttesi(ATTESI, 'richiestaTrasporti', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasporti()', { a: 'produzione@briccialditerni.it', cc: 'acquisti@briccialditerni.it', oggetto: '[Richiesta trasporti] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasporti()', 'Richiesta_Preventivo_Trasporti_Progetto_di_prova_completo_M3.pdf');
    inOrdine(unaRiga(preventivo), 'PDF Preventivo Trasporti');
    for (const atteso of ['RICHIESTA DI PREVENTIVO', 'Dott.ssa Alessandra Angelucci', 'Leggii: 28 — in prestito da Sede Prestito Prova leggii', 'entro le ore 12:00 del 20/02/2031',
      // ogni giorno una volta sola, anche con due lezioni lo stesso giorno (bug P, corretto)
      'con lezioni nei giorni 15/03/2031, 16/03/2031, 17/03/2031 e concerti nei giorni 17/03/2031, 18/03/2031']) expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Trasporti');
    confrontaConAttesi(ATTESI, 'pdfPreventivoTrasporti', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_TRASPORTI, docx: 'generaDOCXDeterminaTrasporti()', apriMail: 'apriMailDeterminaTrasporti()',
      idModale: 'modal-determina-trasporti', titolo: 'Bozza Determina — Trasporti',
      nomeDocx: 'Bozza_Determina_Trasporti_Progetto_di_prova_completo_M3.docx', oggetto: '[Bozza Determina Trasporti] ' + TITOLO
    });
    inOrdine(bozza, 'Determina Trasporti');
    for (const atteso of ['affidamento diretto per il servizio di trasporto materiale', 'del giorno 17/03/2031', '(4 movimentazioni complessive)',
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
    expect(richiesta).toContain('Periodo: dal 15/03/2031 al 17/03/2031');
    for (const v of DA_NOLEGGIARE) expect(richiesta).toContain('- ' + v + ': 1');
    for (const v of ['Sedie', 'Leggii', 'Pianoforte']) expect(richiesta, 'solo il materiale da noleggiare').not.toContain(v);
    confrontaConAttesi(ATTESI, 'richiestaNoleggio', richiesta);
    await mail(page, ambiente, stato, 'apriMailNoleggio()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta noleggio/service] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, PDF_NOLEGGIO, 'Richiesta_Preventivo_Noleggio_Service_Progetto_di_prova_completo_M3.pdf');
    for (const atteso of ['Dott.ssa Alessandra Angelucci', 'in programma il 17/03/2031', ...DA_NOLEGGIARE]) expect(unaRiga(preventivo)).toContain(atteso);
    for (const v of ['Sedie', 'Leggii']) expect(preventivo).not.toContain(v);
    anniCoerenti(preventivo, 'PDF Preventivo Noleggio');
    confrontaConAttesi(ATTESI, 'pdfPreventivoNoleggio', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: DETERMINA_NOLEGGIO, docx: 'generaDOCXDeterminaNoleggio()', apriMail: 'apriMailDeterminaNoleggio()',
      idModale: 'modal-determina-noleggio', titolo: 'Bozza Determina — Acquisti e Servizi',
      nomeDocx: 'Bozza_Determina_Noleggio_Service_Progetto_di_prova_completo_M3.docx', oggetto: '[Bozza Determina Noleggio/Service] ' + TITOLO
    });
    // Luogo: il Mod. 3 non ha luogo_concerto, la Determina usa la destinazione della trasferta (dest_trasferta).
    for (const atteso of [...DA_NOLEGGIARE.map(v => '- ' + v + ' — '), 'del giorno 17/03/2031 presso ' + R.dest_trasferta, '- ditta Ditta Prova nol 1, con sede in Via Inventata 1',
      'per un importo di € 980,00 oltre IVA', 'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%', 'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto'])
      expect(bozza).toContain(atteso);
    confrontaConAttesi(ATTESI, 'determinaNoleggio', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['noleggio', 'determina_noleggio']));
  });

  test('Trasferta e Trasporto persone: Richiesta, PDF Preventivo, Determina (bozza, DOCX, mail)', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const richiesta = await finestra(page, ambiente, stato, 'generaRichiestaTrasfertaPersone()', 'modal-trasferta-persone', 'Richiesta trasferta persone — Ufficio Acquisti');
    for (const atteso of ['· Concerto finale — ' + R.dest_trasferta, 'Modalità trasporto: Pullman', 'Vitto: ' + R.note_vitto]) expect(richiesta).toContain(atteso);
    confrontaConAttesi(ATTESI, 'richiestaTrasfertaPersone', richiesta);
    await mail(page, ambiente, stato, 'apriMailTrasfertaPersone()', { a: 'acquisti@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta trasferta persone] ' + TITOLO }, richiesta);
    await chiudiFinestre(page);

    const preventivo = await pdf(page, ambiente, stato, 'generaPDFRichiestaPreventivoTrasportoPersone()', 'Richiesta_Preventivo_Trasporto_Persone_Progetto_di_prova_completo_M3.pdf');
    for (const atteso of ['Dott.ssa Alessandra Angelucci', 'servizio di trasferta persone', 'Concerto — ' + R.dest_trasferta + ' (Pullman']) expect(unaRiga(preventivo)).toContain(atteso);
    anniCoerenti(preventivo, 'PDF Preventivo Trasporto persone');
    confrontaConAttesi(ATTESI, 'pdfPreventivoTrasportoPersone', preventivo);

    const bozza = await determina(page, ambiente, stato, {
      bozza: 'generaBozzaDeterminaTrasportoPersone()', docx: 'generaDOCXDeterminaTrasportoPersone()', apriMail: 'apriMailDeterminaTrasportoPersone()',
      idModale: 'modal-determina-trper', titolo: 'Bozza Determina — Trasporto Persone',
      nomeDocx: 'Bozza_Determina_Trasporto_Persone_Progetto_di_prova_completo_M3.docx', oggetto: '[Bozza Determina Trasporto Persone] ' + TITOLO
    });
    for (const atteso of ['servizio di trasferta persone (pullman/bus)', 'del giorno 17/03/2031', '– Concerto — ' + R.dest_trasferta + ' (Pullman', '- ditta Ditta Prova trper 1, con sede in Via Inventata 1',
      'di impegnare la somma complessiva di € 1.506,16, di cui € 271,60 per IVA al 22%', 'di nominare Dott.ssa Alessandra Angelucci quale Responsabile Unico del Progetto'])
      expect(bozza).toContain(atteso);
    expect(bozza).not.toContain('Replica');
    confrontaConAttesi(ATTESI, 'determinaTrasportoPersone', bozza);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['trasferta_persone', 'determina_trper']));
  });

  test('Mail Centralino (Spazi + Dotazione + Assistenza) e Richiesta dati anagrafici del docente esterno', async ({ page, ambiente }) => {
    const stato = await apri(page);

    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    for (const atteso of ['── SPAZI ──', '── DOTAZIONE TECNICA ──', '── ASSISTENZA STUDENTI ──',
      '- Lezione 1 — 15/03/2031 ore 14:30–19:00 — con margine di preparazione, lezione 15:00 – 18:30 — Spazio: Sala Orologio',
      '- Concerto (2) — 18/03/2031 ore 21:00 — Spazio: Teatro Secci', '- Pianoforte: 1 — Già presente nella struttura di prova',
      '- Sedie: 40', 'Periodo generale: dal 15/03/2031 al 17/03/2031', '· 18/03/2031 (21:00 — Concerto 2) — Teatro Secci',
      '📤 Prelievo (uscita dal Conservatorio): 15/03/2031', '- Lezione 1 — 15/03/2031 — capienza: 3 — 3 studenti — orario: 15:00 – 18:30']) expect(centralino).toContain(atteso);
    expect(centralino, 'i leggii arrivano in prestito').not.toContain('- Leggii:');
    confrontaConAttesi(ATTESI, 'centralino', centralino);
    await mail(page, ambiente, stato, 'apriMailCentralinoUnificata()', { a: 'centralino@briccialditerni.it', cc: 'produzione@briccialditerni.it', oggetto: '[Richiesta Centralino] ' + TITOLO }, centralino);
    await chiudiFinestre(page);

    const anagrafici = await premi(page, ambiente, stato, 'generaRichiestaDatiAnagrafici(this)');
    senzaProblemi(anagrafici, 'Richiedi dati');
    expect(anagrafici.mail).toHaveLength(1);
    expect(anagrafici.mail[0]).toMatchObject({ a: R.doc_est_email, cc: 'ufficiopersonale@briccialditerni.it', oggetto: 'Dati per l\'incarico e biografia artistica - ' + TITOLO });
    for (const atteso of ['Gentile ' + R.doc_est_nome + ' (' + R.doc_est_ente + ') — Docente Esterno,', 'Email: ' + R.doc_est_email, 'Cellulare: ' + R.doc_est_tel]) expect(anagrafici.mail[0].corpo).toContain(atteso);

    expect(await richiesteRegistrate(page)).toEqual(expect.arrayContaining(['centralino', 'dati_anagrafici_nome_prova_doc_1_testo_di_prova_doc_est_']));
  });
});

test.describe('M3 — Sollecito con un dato mancante', () => {
  const progetto = JSON.parse(JSON.stringify(PROGETTO));
  delete progetto.dati_referente.foto_ensemble;
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

  test('la mail di sollecito elenca il dato mancante', async ({ page, ambiente }) => {
    const stato = await apri(page, progetto);
    const sollecito = await finestra(page, ambiente, stato, 'generaSollecitoReferente()', 'modal-sollecito', 'Sollecito — dati mancanti');
    expect(sollecito).toContain('mancano ancora i seguenti dati:\n\n- Foto/materiale grafico docente esterno\n\n');
    confrontaConAttesi(ATTESI, 'sollecitoFotoMancante', sollecito);
    await mail(page, ambiente, stato, 'apriMailSollecito()', { a: EMAIL_REFERENTE, cc: 'produzione@briccialditerni.it', oggetto: '[' + TITOLO + '] Richiesta integrazione dati' }, sollecito);
  });
});

// Bug trovati con questi test, segnalati e NON corretti: test.fail = il test
// descrive il comportamento giusto e oggi fallisce. Quando il bug viene
// corretto il test diventa rosso: togliere test.fail e aggiornare gli attesi.
// (Il bug K non riguarda il Mod. 3: gli orari di concerto non vengono estesi.)
test.describe('M3 — bug noti dei pulsanti', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: PROGETTO } } });

  // Bug L: Mail Centralino con più sezioni: la sezione Assistenza tiene la sua
  // chiusura ("Cordiali saluti, / Responsabile Produzione") e la mail ha due
  // saluti. Stesso codice nei Mod. 1, 2, 4.
  test.fail('bug L — Mail Centralino: un solo saluto finale', async ({ page, ambiente }) => {
    const stato = await apri(page);
    const centralino = await finestra(page, ambiente, stato, 'generaMailCentralino()', 'modal-centralino-unificata', 'Mail Centralino');
    expect(centralino.match(/Cordiali saluti/g)).toHaveLength(1);
  });
});
