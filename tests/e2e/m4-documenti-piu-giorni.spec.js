// Mod. 4, intervento C (convegno di più giorni): i documenti che riportavano
// solo il primo giorno ora riportano tutti i giorni dell'evento (data
// principale + ulteriori date), in ordine di data. Ogni documento prende il
// luogo dalla stessa fonte di prima: Centralino e Sintesi lo spazio assegnato
// dal Responsabile, Determine e richieste il luogo indicato dal Referente.
// Con una sola data i testi restano quelli di prima: documenti-una-data.spec.js.
// Progetto di prova M4: 15/03/2031 Teatro Secci, 22/03/2031 Sede Prova Replica 1,
// 29/03/2031 Sede Prova Replica 2 (assegnata qui: Sala Orologio).
// "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');
const { testiDocumenti, DOCUMENTI_M4 } = require('./documenti-testo');

const base = require('../progetti-prova/completo-m4.json');
const ID = base.metadati.id;
const progetto = JSON.parse(JSON.stringify(base));
Object.assign(progetto.dati_responsabile, { spazio_replica_2: 'Sala Orologio' });
delete progetto.dati_responsabile.spazio_replica_2_altro;

const DATE = '15/03/2031, 22/03/2031 e 29/03/2031';
// Determine: ogni giorno col suo luogo (qui 3 luoghi diversi)
const GIORNI_LUOGHI = '15/03/2031 presso Teatro Secci; 22/03/2031 presso Sede Prova Replica 1; 29/03/2031 presso Sede Prova Replica 2';

test.describe('M4 — documenti con tutti i giorni dell\'evento (intervento C)', () => {
  test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto } } });

  let testi;
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
    await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID + '&ruolo=responsabile');
    await expect(page.locator('[name="data_evento"]')).toHaveValue('15/03/2031', { timeout: 15000 });
    await page.waitForTimeout(1200);
    testi = await page.evaluate(testiDocumenti, { quali: DOCUMENTI_M4, cfgDetermina: { sezioneDotazione: 'Sezione 6' } });
  });

  test('Determina Acquisti (determina-legale.js): oggetto, premessa, fornitura e dispositivo', async ({ ambiente }) => {
    const t = testi.determinaAcquisti;
    expect(t).toContain('in occasione del progetto "Progetto di prova completo M4" dei giorni ' + GIORNI_LUOGHI + '.');
    expect(t).toContain('"Progetto di prova completo M4", in programma nei giorni ' + GIORNI_LUOGHI + ';');
    expect(t).toContain('Fornitura di beni/servizi dei giorni ' + GIORNI_LUOGHI + ' in occasione di "Progetto di prova completo M4", come da offerta');
    expect(t).toContain('dei giorni ' + DATE + ' in occasione di "Progetto di prova completo M4"'); // dispositivo: solo le date
    expect(t).not.toMatch(/del giorno|il giorno 15|del 15\/03/);
    expect(ambiente.eccezioni).toEqual([]);
  });

  test('Determina Trasporto persone: anche la frase iniziale cita tutti i giorni', async () => {
    const t = testi.determinaTrasportoPersone;
    expect(t).toContain('(pullman/bus) in occasione del progetto "Progetto di prova completo M4" dei giorni ' + GIORNI_LUOGHI + '.');
    expect(t).toContain('in programma nei giorni ' + GIORNI_LUOGHI + ';');
    expect(t).toContain('per l\'evento dei giorni ' + GIORNI_LUOGHI);
    expect(t).not.toMatch(/del giorno|il giorno 15|evento del 15/);
  });

  test('Determina Trasporti: oggetto e premessa con tutti i giorni (le tappe c\'erano già)', async () => {
    const t = testi.determinaTrasporti;
    expect(t).toContain('trasporto materiale in occasione del progetto "Progetto di prova completo M4" dei giorni ' + GIORNI_LUOGHI + '.');
    expect(t).toContain('in programma nei giorni ' + GIORNI_LUOGHI + ';');
    expect(t).not.toMatch(/del giorno|il giorno 15/);
  });

  test('PDF Richiesta Preventivo Noleggio e Trasporto persone: "in programma nei giorni"', async () => {
    expect(testi.pdfPreventivoNoleggio.replace(/\s+/g, ' ')).toContain('Progetto di prova completo M4, in programma nei giorni ' + DATE + ',');
    expect(testi.pdfPreventivoTrasportoPersone.replace(/\s+/g, ' ')).toContain('Progetto di prova completo M4, in programma nei giorni ' + DATE + ',');
  });

  test('Richiesta Noleggio/Service e Richiesta Dotazione/Materiale', async () => {
    expect(testi.richiestaNoleggio).toContain('Date evento: ' + DATE);
    expect(testi.richiestaNoleggio).not.toContain('Data evento:');
    expect(testi.dotazioneMateriale).toContain('Date evento:\n- 15/03/2031 — Teatro Secci\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 — Sede Prova Replica 2');
  });

  test('Centralino: un giorno per riga, con lo spazio assegnato', async () => {
    expect(testi.centralino).toContain('Date evento:\n- 15/03/2031 — Teatro Secci\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 — Sala Orologio');
    expect(testi.centralino).not.toContain('Data evento:');
  });

  test('Sintesi: le ulteriori date sono elencate, non solo contate', async () => {
    expect(testi.sintesiDate).toBe('15/03/2031 | Teatro Secci | 22/03/2031 — Sede Prova Replica 1; 29/03/2031 — Sala Orologio');
  });
});

// Determina Acquisti con più giorni in luoghi diversi: ogni giorno deve stare col
// suo luogo, mai un solo "presso" con tutti i luoghi insieme.
for (const caso of [
  { nome: 'G1 in un luogo, G2 e G3 in un altro', luoghi: ['Teatro Secci', 'Sede Prova Replica 1', 'Sede Prova Replica 1'],
    attesa: '15/03/2031 presso Teatro Secci; 22/03/2031 e 29/03/2031 presso Sede Prova Replica 1' },
  { nome: 'tutti i giorni nello stesso luogo', luoghi: ['Teatro Secci', 'Teatro Secci', 'Teatro Secci'],
    attesa: '15/03/2031, 22/03/2031 e 29/03/2031 presso Teatro Secci' }
]) {
  const p = JSON.parse(JSON.stringify(progetto));
  Object.assign(p.dati_referente, { luogo_concerto: caso.luoghi[0], replica_luogo_1: caso.luoghi[1], replica_luogo_2: caso.luoghi[2] });

  test.describe('M4 — Determina Acquisti, ' + caso.nome + ' (intervento C)', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: p } } });

    test('ogni giorno col suo luogo in oggetto, premessa e fornitura', async ({ page }) => {
      await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
      await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID + '&ruolo=responsabile');
      await expect(page.locator('[name="data_evento"]')).toHaveValue('15/03/2031', { timeout: 15000 });
      await page.waitForTimeout(1200);
      const t = (await page.evaluate(testiDocumenti, { quali: ['determinaAcquisti'], cfgDetermina: { sezioneDotazione: 'Sezione 6' } })).determinaAcquisti;
      expect(t).toContain('"Progetto di prova completo M4" dei giorni ' + caso.attesa + '.');
      expect(t).toContain('in programma nei giorni ' + caso.attesa + ';');
      expect(t).toContain('Fornitura di beni/servizi dei giorni ' + caso.attesa + ' in occasione di');
      // nessun "presso" in più oltre quelli dei giorni (escluso il testo fisso "presso ANAC")
      expect((t.match(/ presso (?!ANAC)/g) || []).length, 'nessun "presso" in più').toBe(3 * (caso.attesa.match(/ presso /g) || []).length);
    });
  });
}
