// Intervento C (convegno di più giorni): i documenti del Mod. 4 riportano tutti
// i giorni dell'evento. La Determina Acquisti sta in determina-legale.js, comune
// ai Mod. 1-4: qui si controlla che i documenti che NON devono cambiare restino
// identici, parola per parola, ai testi registrati prima dell'intervento
// (tests/e2e/attesi/, prodotti dal codice del commit 878971a):
// - Mod. 1-3: Determina Acquisti, sia col progetto di prova com'è (con repliche
//   o più date di concerto) sia con una sola data;
// - Mod. 4 con una sola data: tutti i documenti toccati da C.
// Per rigenerare i testi attesi (solo se un cambiamento è voluto e verificato):
//   AGGIORNA_ATTESI=1 npx playwright test e2e/documenti-una-data.spec.js
// "Oggi" = 15/01/2031. Dati inventati.

const fs = require('fs');
const path = require('path');
const { test, expect } = require('./ambiente');
const { testiDocumenti, DOCUMENTI_M4, conUnaSolaData } = require('./documenti-testo');

const DIR_ATTESI = path.join(__dirname, 'attesi');

const MODULI = {
  M1: { file: 'Modulo_1_SinfonicoCORALE.html', progetto: require('../progetti-prova/completo-m1.json'), cfg: { sezioneDotazione: 'Sezione 5A' } },
  M2: { file: 'Modulo_2_PiccoloConcerto.html', progetto: require('../progetti-prova/completo-m2.json'), cfg: { sezioneDotazione: 'Sezione 5A' } },
  M3: { file: 'Modulo_3_Masterclass.html', progetto: require('../progetti-prova/completo-m3.json'), cfg: { sezioneDotazione: 'Sezione 6A' } },
  M4: { file: 'Modulo_4_EventoIstituzionale.html', progetto: require('../progetti-prova/completo-m4.json'), cfg: { sezioneDotazione: 'Sezione 6' } }
};

const CASI = [
  { nome: 'm1-progetto-di-prova', sigla: 'M1', unaData: false, quali: ['determinaAcquisti'] },
  { nome: 'm1-una-data', sigla: 'M1', unaData: true, quali: ['determinaAcquisti'] },
  { nome: 'm2-progetto-di-prova', sigla: 'M2', unaData: false, quali: ['determinaAcquisti'] },
  { nome: 'm2-una-data', sigla: 'M2', unaData: true, quali: ['determinaAcquisti'] },
  { nome: 'm3-progetto-di-prova', sigla: 'M3', unaData: false, quali: ['determinaAcquisti'] },
  { nome: 'm3-una-data', sigla: 'M3', unaData: true, quali: ['determinaAcquisti'] },
  { nome: 'm4-una-data', sigla: 'M4', unaData: true, quali: DOCUMENTI_M4 }
];

for (const caso of CASI) {
  const m = MODULI[caso.sigla];
  const progetto = caso.unaData ? conUnaSolaData(m.progetto) : m.progetto;
  const ID = progetto.metadati.id;

  test.describe('Documenti invariati — ' + caso.nome, () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

    test('stesso testo di prima dell\'intervento C', async ({ page, ambiente }) => {
      await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
      await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
      await expect(page.locator('[name="data_evento"]')).toHaveValue(progetto.dati_referente.data_evento, { timeout: 15000 });
      await page.waitForTimeout(1200);
      const testi = await page.evaluate(testiDocumenti, { quali: caso.quali, cfgDetermina: m.cfg });
      for (const [nome, testo] of Object.entries(testi)) expect(testo, nome + ' generato').not.toBe('');

      const file = path.join(DIR_ATTESI, caso.nome + '.json');
      if (process.env.AGGIORNA_ATTESI) {
        fs.mkdirSync(DIR_ATTESI, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(testi, null, 2) + '\n');
      }
      const attesi = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const nome of caso.quali) expect(testi[nome], nome).toBe(attesi[nome]);
      expect(ambiente.eccezioni).toEqual([]);
    });
  });
}
