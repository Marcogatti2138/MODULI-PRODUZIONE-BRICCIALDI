// Bug B nella pagina vera: la durata "2 ore" arriva giusta all'orario di occupazione
// della sala nella tabella Spazi (inizio → inizio + durata + 30' di smontaggio).
// Prima veniva letta come 2 minuti (20:30–21:02). Dati inventati.

const { test, expect } = require('./ambiente');

const ID = '9501';
const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale' },
  { sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto' }
];

for (const m of MODULI) {
  test.describe(m.sigla, () => {
    test.use({ datiIniziali: { progetti: { [ID]: {
      metadati: { id: ID, titolo: 'Concerto di prova', tipologia: m.tipologia, referente: 'Referente Prova', email: 'referente.prova@example.org' },
      stato: {},
      dati_referente: { data_evento: '15/03/2031', ora_evento: '20:30', durata: '2 ore', luogo_concerto: 'Sala Prova' },
      dati_responsabile: {}
    } } } });

    test('tabella Spazi: durata "2 ore" → occupazione 20:30–23:00', async ({ page, ambiente }) => {
      await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
      await expect(page.locator('[name="durata"]')).toHaveValue('2 ore', { timeout: 15000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => costruisciTabellaSpazi());
      await expect(page.locator('#spazi-tbody')).toContainText('20:30–23:00');
      expect(ambiente.eccezioni).toEqual([]);
    });
  });
}
