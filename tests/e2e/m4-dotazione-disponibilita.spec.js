// Bug G — M4, Dotazione Tecnica — Disponibilità: la tabella elencava le voci
// del Mod. 1 (leggii, leggii illuminati, podio) e non quelle del Mod. 4
// (leggio relatore, videoproiettore, computer, Wi-Fi), che quindi non
// potevano essere classificate né andare in Prestito o Noleggio.
// Qui ognuna delle 4 voci ha una disponibilità diversa e si controllano la
// tabella, la riapertura e i documenti che leggono la disponibilità.
// (Leggii, leggii illuminati e podio sono tornati nel M4 con l'intervento B,
// come voci richieste dal Referente: vedi m4-dotazione-leggii.spec.js.)
// Parte dal progetto di prova M4. "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');

const base = require('../progetti-prova/completo-m4.json');
const ID = base.metadati.id;
const OPZIONI = ['Già disponibile (Conservatorio)', 'Disponibile nella struttura', 'Da acquistare/noleggiare', 'Prestito'];

const progetto = JSON.parse(JSON.stringify(base));
Object.assign(progetto.dati_referente, { dot_leggio_relatore: '1', dot_videoproiettore: '1', dot_computer: '2', dot_wifi: '1' });
Object.assign(progetto.dati_responsabile, {
  dot_disp_leggio_relatore: 'Prestito',
  dot_prestito_luogo_leggio_relatore: 'Sede Prestito Leggio Prova',
  dot_prestito_ritiro_data_leggio_relatore: '13/03/2031', dot_prestito_ritiro_ora_leggio_relatore: '10:00',
  dot_prestito_riconsegna_data_leggio_relatore: '16/03/2031', dot_prestito_riconsegna_ora_leggio_relatore: '11:00',
  dot_disp_videoproiettore: 'Da acquistare/noleggiare',
  dot_disp_computer: 'Già disponibile (Conservatorio)',
  dot_disp_wifi: 'Disponibile nella struttura',
  dot_struttura_nota_wifi: 'Rete della sede di prova'
});

async function apri(page) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID + '&ruolo=responsabile');
  await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200);
}

test.describe('M4 — Disponibilità della Dotazione con le voci del modulo (bug G)', () => {
  test.use({ datiIniziali: { progetti: { [ID]: progetto } } });

  test('la tabella elenca le voci del M4, ognuna con le 4 disponibilità', async ({ page, ambiente }) => {
    await apri(page);
    for (const key of ['leggio_relatore', 'videoproiettore', 'computer', 'wifi']) {
      const opzioni = await page.locator('#dotazione-disp-tbody select[name="dot_disp_' + key + '"] option').evaluateAll(os => os.map(o => o.value).filter(Boolean));
      expect(opzioni, 'disponibilità di ' + key).toEqual(OPZIONI);
    }
    expect(ambiente.eccezioni).toEqual([]);
  });

  test('alla riapertura disponibilità, Prestito e struttura ricompaiono', async ({ page }) => {
    await apri(page);
    await expect(page.locator('[name="dot_disp_leggio_relatore"]')).toHaveValue('Prestito');
    // righe di dettaglio mostrate (la sezione può essere chiusa a fisarmonica)
    await expect(page.locator('#riga-prestito-leggio_relatore')).toHaveCSS('display', 'table-row');
    await expect(page.locator('[name="dot_prestito_luogo_leggio_relatore"]')).toHaveValue('Sede Prestito Leggio Prova');
    await expect(page.locator('[name="dot_prestito_riconsegna_data_leggio_relatore"]')).toHaveValue('16/03/2031');
    await expect(page.locator('[name="dot_disp_videoproiettore"]')).toHaveValue('Da acquistare/noleggiare');
    await expect(page.locator('[name="dot_disp_computer"]')).toHaveValue('Già disponibile (Conservatorio)');
    await expect(page.locator('[name="dot_disp_wifi"]')).toHaveValue('Disponibile nella struttura');
    await expect(page.locator('#riga-struttura-wifi')).toHaveCSS('display', 'table-row');
    await expect(page.locator('[name="dot_struttura_nota_wifi"]')).toHaveValue('Rete della sede di prova');
  });

  test('i documenti prendono le disponibilità delle voci del M4', async ({ page }) => {
    await apri(page);
    // Prestito: elenco usato da Sintesi, PDF Preventivo Trasporti e Determina Trasporti
    const prestiti = await page.evaluate(() => elencoVociInPrestito().map(p => p.label + ' | ' + p.luogo));
    expect(prestiti).toContain('Podio/leggio relatore | Sede Prestito Leggio Prova');
    // Disponibile nella struttura
    const struttura = await page.evaluate(() => JSON.stringify(elencoVociDisponibiliInStruttura()));
    expect(struttura).toContain('Wi-Fi');
    expect(struttura).toContain('Rete della sede di prova');
    // Scheda di Sintesi
    await page.evaluate(() => aggiornaSintesiCompleta());
    await expect(page.locator('#sint_prestito')).toContainText('Podio/leggio relatore');
    await expect(page.locator('#sint_struttura')).toContainText('Wi-Fi');
    // Richiesta Noleggio/Service: il videoproiettore da acquistare/noleggiare
    await page.evaluate(() => generaRichiestaNoleggio());
    await expect(page.locator('#testo-noleggio')).toHaveValue(/Videoproiettore/);
    // Mail Centralino: il computer già disponibile in Conservatorio
    const centralino = await page.evaluate(() => (costruisciTestoCentralino().lines || []).join('\n'));
    expect(centralino).toContain('Computer');
    // Richiesta Trasporti: il materiale del Conservatorio viaggia con la trasferta
    await page.evaluate(() => generaRichiestaTrasporti());
    await expect(page.locator('#testo-trasporti')).toHaveValue(/Computer/);
  });
});
