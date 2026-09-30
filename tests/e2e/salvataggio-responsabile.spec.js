// Salvataggio del Responsabile: un campo svuotato a mano deve sparire da
// Firestore. Nel Mod. 3 restava, perché il salvataggio fondeva i dati (set con
// merge) invece di sostituire la mappa come negli altri moduli.
// Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const ID = '9201';
const documento = page => page.evaluate(id => window.__fintoDb.documento('progetti', id), ID);

async function modifica(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [nome, valore]);
}

async function attendiCaricamento(page) {
  await expect(page.locator('[name="contesto_progetto"]')).toHaveValue('Testo iniziale di prova', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale' },
  { sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto' },
  { sigla: 'M3', file: 'Modulo_3_Masterclass.html', tipologia: 'masterclass' },
  { sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', tipologia: 'evento-istituzionale' }
];

for (const m of MODULI) {
  test.describe(m.sigla + ' — salvataggio del Responsabile', () => {
    test.use({ datiIniziali: { progetti: { [ID]: {
      metadati: { id: ID, titolo: 'Progetto di prova', tipologia: m.tipologia, referente: 'Referente Prova', email: 'referente.prova@example.org' },
      stato: {},
      dati_referente: { contesto_progetto: 'Testo iniziale di prova' },
      dati_responsabile: { determina_nol_prot_richiesta: '0000', determina_trasp_prot_richiesta: '1234' }
    } } } });

    test('un campo svuotato a mano sparisce da Firestore', async ({ page }) => {
      await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
      await attendiCaricamento(page);
      await expect(page.locator('[name="determina_trasp_prot_richiesta"]')).toHaveValue('1234');
      await modifica(page, 'determina_trasp_prot_richiesta', '');
      await modifica(page, 'determina_nol_prot_richiesta', '1111');
      await expect.poll(async () => (await documento(page)).dati_responsabile.determina_nol_prot_richiesta, { timeout: 8000 }).toBe('1111');
      expect((await documento(page)).dati_responsabile.determina_trasp_prot_richiesta, 'campo svuotato').toBeUndefined();
    });
  });
}
