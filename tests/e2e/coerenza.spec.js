// Avviso ambra di congruità in cima ai moduli (verificaCoerenzaProgetto + coerenza-date.js),
// nella pagina vera. "Oggi" fissato al 15/01/2031. Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const ID = '9701';
const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale', evento: '15/03/2031',
    guasto: { prova_data_1: '20/03/2031' }, messaggio: /Prova 1 \(20\/03\/2031\) è dopo la data del Concerto/ },
  { sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto', evento: '15/03/2031',
    guasto: { prova_data_1: '20/03/2031' }, messaggio: /Prova 1 \(20\/03\/2031\) è dopo la data del Concerto/ },
  { sigla: 'M3', file: 'Modulo_3_Masterclass.html', tipologia: 'masterclass', evento: '10/03/2031', extra: { data_evento_fine: '14/03/2031' },
    guasto: { prova_data_1: '05/03/2031' }, messaggio: /Lezione 1 \(05\/03\/2031\) è prima dell'inizio del Periodo Masterclass/ },
  { sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', tipologia: 'evento-istituzionale', evento: '15/03/2031',
    guasto: { replica_data_1: '10/03/2031' }, messaggio: /Replica 1 \(10\/03\/2031\)/ }
];

function progetto(m, campi) {
  return { progetti: { [ID]: {
    metadati: { id: ID, titolo: 'Progetto date di prova', tipologia: m.tipologia, referente: 'Referente Prova', email: 'referente.prova@example.org' },
    stato: {}, dati_referente: Object.assign({ data_evento: m.evento, luogo_concerto: 'Sala Prova' }, m.extra || {}, campi), dati_responsabile: {}
  } } };
}

async function apri(page, m) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/' + m.file + '?id=' + ID);
  await expect(page.locator('[name="data_evento"]')).not.toHaveValue('', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

for (const m of MODULI) {
  test.describe(m.sigla + ' — progetto coerente', () => {
    test.use({ datiIniziali: progetto(m, {}) });
    test('nessun avviso', async ({ page, ambiente }) => {
      await apri(page, m);
      await expect(page.locator('#avviso-coerenza-progetto')).toBeHidden();
      expect(ambiente.eccezioni).toEqual([]);
    });
  });

  test.describe(m.sigla + ' — data non valida', () => {
    test.use({ datiIniziali: progetto(m, { data_evento: '31/02/2031' }) });
    test('avviso ambra e bordo ambra sul campo', async ({ page }) => {
      await apri(page, m);
      const avviso = page.locator('#avviso-coerenza-progetto');
      await expect(avviso).toBeVisible();
      await expect(avviso).toContainText('"31/02/2031" non è una data valida');
      const bordo = await page.locator('[name="data_evento"]').evaluate(el => el.style.boxShadow);
      expect(bordo).toContain('245, 158, 11');
    });
  });

  test.describe(m.sigla + ' — controllo del modulo', () => {
    test.use({ datiIniziali: progetto(m, m.guasto) });
    test('segnalato nell\'avviso', async ({ page }) => {
      await apri(page, m);
      await expect(page.locator('#avviso-coerenza-progetto')).toContainText(m.messaggio);
    });
  });
}
