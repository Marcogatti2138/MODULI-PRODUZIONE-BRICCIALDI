// Bug T — nelle Determine l'importo della ditta scelta e delle altre offerte era
// scritto com'era digitato ("€ 12000"), mentre IVA e totale erano già riscritti
// all'italiana ("14.640,00"). Variante del progetto di prova di ogni modulo con gli
// importi dei preventivi scritti in forme diverse ("12000", "1234,5", "1234.56",
// "1.234,50"): in tutte le Determine gli importi escono come "1.234,50", con IVA e
// totale calcolati come prima e senza avvisi. I casi ambigui ("1,234", "1.234.56")
// sono negli unit test (unit/determine.test.js). "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');

const MODULI = {
  M1: { file: 'Modulo_1_SinfonicoCORALE.html', progetto: require('../progetti-prova/completo-m1.json'),
    trasporti: "generaBozzaDeterminaTrasporti(1, {sezioneDotazione:'Sezione 5A', sezioneTrasporti:'Sezione 5B'})",
    noleggio: "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 5A'})", personale: true },
  M2: { file: 'Modulo_2_PiccoloConcerto.html', progetto: require('../progetti-prova/completo-m2.json'),
    trasporti: "generaBozzaDeterminaTrasporti(1, {sezioneDotazione:'Sezione 5A', sezioneTrasporti:'Sezione 5B'})",
    noleggio: "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 5A'})", personale: true },
  M3: { file: 'Modulo_3_Masterclass.html', progetto: require('../progetti-prova/completo-m3.json'),
    trasporti: "generaBozzaDeterminaTrasporti(1, {sezioneDotazione:'Sezione 6A', sezioneTrasporti:'Sezione 6C'})",
    noleggio: "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 6A'})", personale: false },
  M4: { file: 'Modulo_4_EventoIstituzionale.html', progetto: require('../progetti-prova/completo-m4.json'),
    trasporti: 'generaBozzaDeterminaTrasporti()',
    noleggio: "generaBozzaDeterminaNoleggio(1, {sezioneDotazione:'Sezione 6'})", personale: false }
};

// Per ogni Determina: casella del testo, importo della ditta scelta (preventivo 1) e
// dell'altra offerta (preventivo 2), come scritti e come devono uscire; IVA e totale
// sono quelli di sempre (calcolati dallo stesso numero).
const DETERMINE = [
  { nome: 'Trasporti', prefisso: 'prevtrasp', casella: 'testo-determina-trasporti', chiamata: m => m.trasporti,
    scelto: ['12000', '12.000,00'], altro: ['1234,5', '1.234,50'], iva: '2.640,00', totale: '14.640,00' },
  { nome: 'Noleggio', prefisso: 'prevnol', casella: 'testo-determina-noleggio', chiamata: m => m.noleggio,
    scelto: ['1234.56', '1.234,56'], altro: ['1.234,50', '1.234,50'], iva: '271,60', totale: '1.506,16' },
  { nome: 'Trasporto persone', prefisso: 'prevtrper', casella: 'testo-determina-trper', chiamata: () => 'generaBozzaDeterminaTrasportoPersone()',
    scelto: ['1234,5', '1.234,50'], altro: ['12000', '12.000,00'], iva: '271,59', totale: '1.506,09' },
  { nome: 'Personale esterno', prefisso: 'prevpers', casella: 'testo-determina-personale', chiamata: () => 'generaBozzaDeterminaPersonale()', solo: 'personale',
    scelto: ['1.234,50', '1.234,50'], altro: ['1234.56', '1.234,56'], iva: '271,59', totale: '1.506,09' }
];

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// "€ 12000" sì o no, senza confonderlo con un importo più lungo che comincia allo stesso modo.
const importoNelTesto = (t, s) => new RegExp('€ ' + escRe(s) + '(?!\\d|[.,]\\d)').test(t);

for (const [sigla, m] of Object.entries(MODULI)) {
  const determine = DETERMINE.filter(d => !d.solo || m[d.solo]);
  const progetto = JSON.parse(JSON.stringify(m.progetto));
  for (const d of determine) {
    progetto.dati_responsabile[d.prefisso + '_importo_1'] = d.scelto[0];
    progetto.dati_responsabile[d.prefisso + '_importo_2'] = d.altro[0];
  }
  const ID = progetto.metadati.id;

  test.describe(sigla + ' — Determine con importi scritti in forme diverse (bug T)', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

    test('importi riscritti all\'italiana, IVA e totale come prima, nessun avviso', async ({ page, ambiente }) => {
      await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
      await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
      await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
      await page.waitForTimeout(1200); // i ripristini ritardati della pagina (500–750 ms)

      for (const d of determine) {
        const testo = await page.evaluate(({ chiamata, casella }) => {
          (0, eval)(chiamata);
          return document.getElementById(casella).value;
        }, { chiamata: d.chiamata(m), casella: d.casella });
        const nome = sigla + ' ' + d.nome;
        expect(testo, nome + ': testo generato').toContain(progetto.metadati.titolo);
        for (const [scritto, atteso] of [d.scelto, d.altro]) {
          expect(importoNelTesto(testo, atteso), nome + ': € ' + atteso).toBe(true);
          if (scritto !== atteso) expect(importoNelTesto(testo, scritto), nome + ': € ' + scritto + ' com\'è scritto').toBe(false);
        }
        expect(testo, nome + ': IVA').toContain('€ ' + d.iva);
        expect(testo, nome + ': totale').toContain('€ ' + d.totale);
        expect(testo, nome + ': nessun avviso').not.toContain('⚠');
      }
      expect(ambiente.eccezioni).toEqual([]);
    });
  });
}
