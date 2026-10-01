// Bug H — M4 senza tabella Spazi: il Responsabile non poteva assegnare le sale
// a evento e repliche (il codice c'era, la tabella nella pagina no), quindi
// Sintesi, mail Centralino e Dashboard non vedevano mai lo spazio assegnato.
// Ora come nel Mod. 1: tabella in Blocco ①, Richiesta Spazi e Notifica al
// Referente in Blocco ③, avviso al Referente se lo spazio assegnato è diverso
// da quello proposto. La Richiesta Dotazione/Materiale, che usava la chiave
// "spazi", ha ora una chiave sua ("dotazione_materiale").
// Parte dal progetto di prova M4. "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');

const base = require('../progetti-prova/completo-m4.json');
const ID = base.metadati.id;

// luogo_concerto "Teatro Secci", replica_luogo_1/2 "Sede Prova Replica 1/2", ora 21:00, durata 1h30
const progetto = JSON.parse(JSON.stringify(base));
Object.assign(progetto.dati_responsabile, {
  spazio_concerto: 'Sala Orologio',                                              // diverso dalla proposta
  spazio_replica_1: 'Altro', spazio_replica_1_altro: 'Sede Prova Replica 1',     // uguale alla proposta
  spazio_replica_2: 'Teatro Secci'                                               // diverso dalla proposta
});

async function apri(page, ruolo) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID + (ruolo ? '&ruolo=' + ruolo : ''));
  await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200);
}

test.describe('M4 — Spazi come nel Mod. 1 (bug H)', () => {
  test.use({ datiIniziali: { progetti: { [ID]: progetto } } });

  test('il Responsabile vede la tabella Spazi con evento e repliche, e gli spazi salvati alla riapertura', async ({ page, ambiente }) => {
    await apri(page, 'responsabile');
    const righe = page.locator('#spazi-tbody tr');
    await expect(righe).toHaveCount(3);
    await expect(righe.nth(0)).toContainText('15/03/2031');
    await expect(page.locator('#spazi-tbody select[name="spazio_concerto"]')).toHaveValue('Sala Orologio');
    await expect(page.locator('[name="spazio_replica_1"]')).toHaveValue('Altro');
    await expect(page.locator('[name="spazio_replica_1_altro"]')).toHaveValue('Sede Prova Replica 1');
    await expect(page.locator('[name="spazio_replica_2"]')).toHaveValue('Teatro Secci');
    // la divergenza con la proposta del Referente è segnalata nella riga
    await expect(righe.nth(0)).toContainText('diverso da quanto proposto');
    expect(ambiente.eccezioni).toEqual([]);
  });

  test('uno spazio scelto dal Responsabile viene salvato', async ({ page }) => {
    await apri(page, 'responsabile');
    // sezione e blocco partono chiusi a fisarmonica: si aprono, poi si sceglie come l'utente
    await page.evaluate(() => {
      const sel = document.querySelector('[name="spazio_concerto"]');
      sel.closest('.section-body').classList.remove('hidden');
      sel.closest('details').open = true;
    });
    await page.locator('[name="spazio_concerto"]').selectOption('Teatro Secci');
    await expect.poll(() => page.evaluate(id => window.__fintoDb.documento('progetti', id).dati_responsabile.spazio_concerto, ID), { timeout: 8000 }).toBe('Teatro Secci');
  });

  test('il Referente vede l\'avviso degli spazi assegnati diversi da quelli proposti', async ({ page }) => {
    await apri(page, '');
    const avviso = page.locator('#avviso-spazi-modificati');
    await expect(avviso).toHaveCSS('display', 'block'); // la Sezione 1 può essere chiusa a fisarmonica
    await expect(avviso).toContainText('assegnato "Sala Orologio" (avevi proposto "Teatro Secci")');
    await expect(avviso).toContainText('Replica 2: assegnato "Teatro Secci"');
    await expect(avviso).not.toContainText('Replica 1');
  });

  test('Richiesta Spazi e Notifica al Referente riportano gli spazi assegnati', async ({ page }) => {
    await apri(page, 'responsabile');
    await page.evaluate(() => generaRichiestaSpazi());
    const richiesta = page.locator('#testo-spazi');
    await expect(richiesta).toHaveValue(/Evento — 15\/03\/2031 ore 21:00–23:15 .*— Spazio: Sala Orologio/); // 1h30 + 45' di smontaggio
    await expect(richiesta).toHaveValue(/Replica 1 — 22\/03\/2031 .*— Spazio: Sede Prova Replica 1/);
    await expect(richiesta).toHaveValue(/Replica 2 — 29\/03\/2031 .*— Spazio: Teatro Secci/);
    await page.evaluate(() => chiudiModalSpazi());

    await page.evaluate(() => generaNotificaSpaziReferente());
    const notifica = page.locator('#testo-notifica-spazi-referente');
    await expect(notifica).toHaveValue(/Spazio assegnato: Sala Orologio — Proposta iniziale: Teatro Secci/);
    await expect(notifica).toHaveValue(/Spazio assegnato: Sede Prova Replica 1 — Proposta iniziale: Sede Prova Replica 1/);

    const richieste = await page.evaluate(() => Object.keys(window._richiesteGenerate));
    expect(richieste).toEqual(expect.arrayContaining(['spazi', 'notifica_spazi_referente']));
  });

  test('Sintesi e mail Centralino prendono lo spazio assegnato all\'evento', async ({ page }) => {
    await apri(page, 'responsabile');
    await page.evaluate(() => aggiornaSintesiCompleta());
    await expect(page.locator('#sint_luogo')).toHaveText('Sala Orologio');
    const centralino = await page.evaluate(() => (costruisciTestoCentralino().lines || []).join('\n'));
    expect(centralino).toContain('Data evento: 15/03/2031 — Sala Orologio');
  });

  test('la Richiesta Dotazione/Materiale resta separata dalla Richiesta Spazi', async ({ page }) => {
    await apri(page, 'responsabile');
    await page.evaluate(() => generaRichiestaDotazioneMateriale());
    await expect(page.locator('#modal-dotazione-materiale')).toBeVisible();
    await expect(page.locator('#testo-dotazione-materiale')).toHaveValue(/dotazione\/materiale necessario/);
    await expect(page.locator('#modal-spazi')).toBeHidden();
    const richieste = await page.evaluate(() => Object.keys(window._richiesteGenerate));
    expect(richieste).toContain('dotazione_materiale');
    expect(richieste).not.toContain('spazi');
  });
});
