// Test minimo: ogni pagina si apre senza errori, carica importi.js e genera
// una bozza di Determina Noleggio con un preventivo di "12.000".
// Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const PROGETTO_ID = '9001';
const OGGETTO_LIBERO = '10 sedie pieghevoli di prova';

function progettoDiProva(tipologia) {
  return {
    metadati: { id: PROGETTO_ID, titolo: 'Progetto di prova', tipologia: tipologia, referente: 'Referente Prova', email: 'referente.prova@example.org', sede: 'Sede Prova' },
    stato: {},
    dati_referente: { data_evento: '15/03/2031', luogo_concerto: 'Sala Prova', dot_sedie: '10' },
    dati_responsabile: {
      dot_disp_sedie: 'Da acquistare/noleggiare',
      determina_nol_oggetto: OGGETTO_LIBERO,
      prevnol_ditta_1: 'Ditta Prova Uno',
      prevnol_importo_1: '12.000',
      prevnol_prot_1: '0001',
      prevnol_data_1: '01/02/2031',
      prevnol_indirizzo_1: 'Via Inventata 1, Paese Prova',
      prevnol_piva_1: '00000000000',
      prevnol_scelto_1: true
    }
  };
}

// La Determina con "12.000" deve impegnare € 14.640,00 e nominare la RUP sopra i 5.000 €.
function verificaDetermina(testo) {
  expect(testo).toContain('Ditta Prova Uno');
  expect(testo).toContain('somma complessiva di € 14.640,00, di cui € 2.640,00 per IVA');
  expect(testo).toMatch(/di nominare Dott\.ssa Susanna Fanizza quale Responsabile Unico del Progetto/);
}

function verificaPaginaPulita(ambiente, richiesteImporti) {
  expect(ambiente.eccezioni, 'eccezioni JavaScript').toEqual([]);
  expect(ambiente.erroriConsole, 'errori in console').toEqual([]);
  expect(richiesteImporti, 'importi.js caricato').toBe(1);
}

const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale' },
  { sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto' },
  { sigla: 'M3', file: 'Modulo_3_Masterclass.html', tipologia: 'masterclass' },
  { sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', tipologia: 'evento-istituzionale' }
];

for (const m of MODULI) {
  test.describe(m.sigla, () => {
    test.use({ datiIniziali: { progetti: { [PROGETTO_ID]: progettoDiProva(m.tipologia) } } });

    test('si apre, carica importi.js e genera la Determina Noleggio con "12.000"', async ({ page, ambiente }) => {
      let richiesteImporti = 0;
      page.on('request', r => { if (r.url().endsWith('/importi.js')) richiesteImporti++; });

      await page.goto('/' + m.file + '?id=' + PROGETTO_ID + '&ruolo=responsabile');
      // Dati del Responsabile ripristinati dal finto Firestore
      await expect(page.locator('[name="prevnol_importo_1"]')).toHaveValue('12.000', { timeout: 15000 });
      expect(await page.evaluate(() => typeof parseImportoIt)).toBe('function');

      // Clic vero sul pulsante della pagina (la sezione può essere chiusa: il clic avviene via DOM)
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => /generaBozzaDeterminaNoleggio\(1/.test(b.getAttribute('onclick') || ''));
        btn.click();
      });
      const testo = await page.locator('#testo-determina-noleggio').inputValue();
      expect(testo).toContain(OGGETTO_LIBERO);
      verificaDetermina(testo);
      expect(ambiente.dialoghi, 'finestre alert/confirm').toEqual([]);
      verificaPaginaPulita(ambiente, richiesteImporti);
    });
  });
}

test.describe('Dashboard', () => {
  test.use({ datiIniziali: { progetti: { [PROGETTO_ID]: progettoDiProva('sinfonico-corale') } } });

  test('si apre, carica importi.js e genera la Determina Noleggio cumulativa con "12.000"', async ({ page, ambiente }) => {
    let richiesteImporti = 0;
    page.on('request', r => { if (r.url().endsWith('/importi.js')) richiesteImporti++; });

    await page.goto('/Dashboard_Briccialdi.html');
    const casella = page.locator('.chk-cumulativa[data-id="' + PROGETTO_ID + '"]');
    await expect(casella).toHaveCount(1, { timeout: 15000 });
    await casella.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change')); });
    await page.evaluate(() => apriFormDeterminaCumulativa('noleggio'));

    const riga = page.locator('#preventivi-cumulativa-body [data-riga-preventivo]').first();
    await riga.locator('[data-f="ditta"]').fill('Ditta Prova Uno');
    await riga.locator('[data-f="indirizzo"]').fill('Via Inventata 1, Paese Prova');
    await riga.locator('[data-f="piva"]').fill('00000000000');
    await riga.locator('[data-f="prot"]').fill('0001');
    await riga.locator('[data-f="data"]').fill('01/02/2031');
    await riga.locator('[data-f="importo"]').fill('12.000');
    await page.evaluate(() => confermaFormDeterminaCumulativa());

    const testo = await page.locator('#testo-cumulativa-spazi').inputValue();
    verificaDetermina(testo);
    expect(ambiente.dialoghi, 'finestre alert/confirm').toEqual([]);
    verificaPaginaPulita(ambiente, richiesteImporti);
  });
});
