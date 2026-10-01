// Mod. 4, intervento B (concerti dentro un convegno): nella Dotazione Tecnica
// il Referente può chiedere leggii, leggii illuminati e podio direttore, come
// nel Mod. 1 e con gli stessi nomi dei campi (dot_leggii, dot_leggii_lum,
// dot_podio: li legge anche la Dashboard). Il Responsabile li classifica nella
// tabella Disponibilità e da lì vanno in Prestito, Noleggio/Determina Acquisti,
// Centralino, Trasporti e Sintesi, come le altre voci del Mod. 4.
// Parte dal progetto di prova M4. "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');

const base = require('../progetti-prova/completo-m4.json');
const ID = base.metadati.id;
const OPZIONI = ['Già disponibile (Conservatorio)', 'Disponibile nella struttura', 'Da acquistare/noleggiare', 'Prestito'];
const VOCI = { leggii: 'Leggii', leggii_lum: 'Leggii illuminati', podio: 'Podio direttore' };

const progetto = JSON.parse(JSON.stringify(base));
Object.assign(progetto.dati_referente, {
  dot_leggii: '6', dot_leggii_n: 'Per il quartetto di prova',
  dot_leggii_lum: '4', dot_leggii_lum_n: '',
  dot_podio: '1', dot_podio_n: 'Podio di prova basso'
});
Object.assign(progetto.dati_responsabile, {
  dot_disp_leggii: 'Prestito',
  dot_prestito_luogo_leggii: 'Sede Prestito Leggii Prova',
  dot_prestito_ritiro_data_leggii: '13/03/2031', dot_prestito_ritiro_ora_leggii: '10:00',
  dot_prestito_riconsegna_data_leggii: '16/03/2031', dot_prestito_riconsegna_ora_leggii: '11:00',
  dot_disp_leggii_lum: 'Già disponibile (Conservatorio)',
  dot_disp_podio: 'Da acquistare/noleggiare',
  determina_nol_voce_podio: '1'
});

async function apri(page, ruolo) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID + (ruolo ? '&ruolo=' + ruolo : ''));
  await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200);
}

async function modifica(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [nome, valore]);
}

test.describe('M4 — leggii, leggii illuminati e podio nella Dotazione (intervento B)', () => {
  test.use({ datiIniziali: { progetti: { [ID]: progetto } } });

  test('il Referente trova le 3 voci nella Dotazione Tecnica, con quantità e note salvate', async ({ page, ambiente }) => {
    await apri(page, '');
    for (const [key, etichetta] of Object.entries(VOCI)) {
      const riga = page.locator('tr', { has: page.locator('[name="dot_' + key + '"]') });
      await expect(riga.locator('td.pre')).toHaveText(etichetta);
      await expect(page.locator('[name="dot_' + key + '"]')).toHaveValue(progetto.dati_referente['dot_' + key]);
      await expect(page.locator('[name="dot_' + key + '_n"]')).toHaveValue(progetto.dati_referente['dot_' + key + '_n']);
    }
    await modifica(page, 'dot_leggii', '8');
    await expect.poll(() => page.evaluate(id => window.__fintoDb.documento('progetti', id).dati_referente.dot_leggii, ID), { timeout: 8000 }).toBe('8');
    expect(ambiente.eccezioni).toEqual([]);
  });

  test('il Responsabile le classifica nella Disponibilità e le ritrova alla riapertura', async ({ page, ambiente }) => {
    await apri(page, 'responsabile');
    for (const key of Object.keys(VOCI)) {
      const opzioni = await page.locator('#dotazione-disp-tbody select[name="dot_disp_' + key + '"] option').evaluateAll(os => os.map(o => o.value).filter(Boolean));
      expect(opzioni, 'disponibilità di ' + key).toEqual(OPZIONI);
    }
    await expect(page.locator('[name="dot_disp_leggii"]')).toHaveValue('Prestito');
    await expect(page.locator('#riga-prestito-leggii')).toHaveCSS('display', 'table-row');
    await expect(page.locator('[name="dot_prestito_luogo_leggii"]')).toHaveValue('Sede Prestito Leggii Prova');
    await expect(page.locator('[name="dot_disp_leggii_lum"]')).toHaveValue('Già disponibile (Conservatorio)');
    await expect(page.locator('[name="dot_disp_podio"]')).toHaveValue('Da acquistare/noleggiare');
    expect(ambiente.eccezioni).toEqual([]);
  });

  test('Prestito, Centralino, Trasporti, Noleggio, Determina Acquisti e Sintesi le riportano', async ({ page }) => {
    await apri(page, 'responsabile');
    // Prestito (Sintesi, PDF Preventivo Trasporti, Determina Trasporti)
    const prestiti = await page.evaluate(() => elencoVociInPrestito().map(p => p.label + ' | ' + p.luogo));
    expect(prestiti).toContain('Leggii | Sede Prestito Leggii Prova');
    // Centralino: i leggii illuminati già del Conservatorio
    const centralino = await page.evaluate(() => (costruisciTestoCentralino().lines || []).join('\n'));
    expect(centralino).toContain('Leggii illuminati: 4');
    // Trasporti: il materiale del Conservatorio viaggia con la trasferta
    await page.evaluate(() => generaRichiestaTrasporti());
    await expect(page.locator('#testo-trasporti')).toHaveValue(/Leggii illuminati: 4/);
    // Noleggio/Service e Determina Acquisti: il podio da acquistare/noleggiare
    await page.evaluate(() => generaRichiestaNoleggio());
    await expect(page.locator('#testo-noleggio')).toHaveValue(/Podio direttore: 1 — Podio di prova basso/);
    await page.evaluate(() => chiudiModalNoleggio());
    await page.evaluate(() => generaBozzaDeterminaNoleggio(1, { sezioneDotazione: 'Sezione 6' }));
    await expect(page.locator('#testo-determina-noleggio')).toHaveValue(/Podio direttore — Podio di prova basso/);
    // Sintesi: quantità con la disponibilità, e il Prestito
    await page.evaluate(() => aggiornaSintesiCompleta());
    await expect(page.locator('#sint_dotazione')).toContainText('Leggii: 6');
    await expect(page.locator('#sint_dotazione')).toContainText('Leggii illuminati: 4');
    await expect(page.locator('#sint_dotazione')).toContainText('Podio direttore: 1');
    await expect(page.locator('#sint_prestito')).toContainText('Leggii');
  });

  test('una voce "Disponibile nella struttura" va nell\'elenco della struttura', async ({ page }) => {
    await apri(page, 'responsabile');
    await modifica(page, 'dot_disp_podio', 'Disponibile nella struttura');
    const struttura = await page.evaluate(() => JSON.stringify(elencoVociDisponibiliInStruttura()));
    expect(struttura).toContain('Podio direttore');
  });
});
