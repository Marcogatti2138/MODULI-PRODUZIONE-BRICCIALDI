// Valore cancellato di proposito: compilo un campo, salvo, lo svuoto, salvo,
// riapro il progetto. Il campo deve restare vuoto (pagina e Firestore), anche
// dopo un ulteriore salvataggio: le cache dei dati salvati (valoreSpazioSalvato)
// non devono farlo ricomparire. Campi del Responsabile in Spazi, Dotazione e
// Trasferta persone (nel M4 la tabella Spazi c'è dal bug H).
// Parte dai progetti di prova completi. "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');

// Bug noti, segnalati e non ancora corretti: campi da saltare (stesso schema
// di BUG_NOTI in progetti-prova.spec.js). Oggi nessuno.
const BUG_NOTI = {};

const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', progetto: require('../progetti-prova/completo-m1.json'),
    campi: { 'Spazi': ['spazio_concerto', 'Sala Orologio'], 'Dotazione': ['dot_struttura_nota_piano', 'Nota struttura modificata'], 'Trasferta persone': ['trasp_pers_note_replica_1', 'Nota trasferta modificata'] } },
  { sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', progetto: require('../progetti-prova/completo-m4.json'),
    campi: { 'Spazi': ['spazio_concerto', 'Sala Orologio'], 'Dotazione': ['dot_struttura_nota_piano', 'Nota struttura modificata'], 'Trasferta persone': ['trasp_pers_note_replica_1', 'Nota trasferta modificata'] } }
];

async function attendiCaricamento(page, m) {
  await expect(page.locator('[name="data_evento"]')).toHaveValue(m.progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200); // i ripristini ritardati delle pagine (500–750 ms)
}

// Come l'utente: scrive (o sceglie) il valore ed esce dal campo; poi il salvataggio del Responsabile.
async function imposta(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
    salvaResponsabileSuFirestore();
  }, [nome, valore]);
}

const salvato = (page, m, nome) => page.evaluate(([id, n]) => window.__fintoDb.documento('progetti', id).dati_responsabile[n], [m.progetto.metadati.id, nome]);

for (const m of MODULI) {
  test.describe(m.sigla + ' — valore cancellato di proposito', () => {
    test.use({ datiIniziali: { progetti: { [m.progetto.metadati.id]: m.progetto } } });

    for (const [sezione, [nome, nuovo]] of Object.entries(m.campi)) {
      if (BUG_NOTI[m.sigla] && BUG_NOTI[m.sigla].test(nome)) continue;

      test(sezione + ' (' + nome + '): resta vuoto dopo la riapertura', async ({ page, ambiente }) => {
        await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
        await page.goto('/' + m.file + '?id=' + m.progetto.metadati.id + '&ruolo=responsabile');
        await attendiCaricamento(page, m);

        // 1. compilo e salvo
        await imposta(page, nome, nuovo);
        await expect.poll(() => salvato(page, m, nome), { timeout: 8000 }).toBe(nuovo);

        // 2. svuoto e salvo
        await imposta(page, nome, '');
        await expect.poll(() => salvato(page, m, nome), { timeout: 8000 }).toBeUndefined();

        // 3. riapro: la pagina riparte dal documento ora salvato
        const doc = await page.evaluate(id => window.__fintoDb.documento('progetti', id), m.progetto.metadati.id);
        await page.addInitScript(d => { window.__FINTO_DB_INIZIALE = d; }, { progetti: { [m.progetto.metadati.id]: { metadati: doc.metadati, stato: {}, dati_referente: doc.dati_referente, dati_responsabile: doc.dati_responsabile } } });
        await page.reload();
        await attendiCaricamento(page, m);
        await expect(page.locator('[name="' + nome + '"]'), 'campo dopo la riapertura').toHaveValue('');

        // 4. un altro salvataggio non lo fa ricomparire su Firestore
        const prima = await page.evaluate(() => window.__fintoDb.scritture().length);
        await page.evaluate(() => salvaResponsabileSuFirestore());
        await expect.poll(() => page.evaluate(() => window.__fintoDb.scritture().length), { timeout: 8000 }).toBeGreaterThan(prima);
        expect(await salvato(page, m, nome), 'su Firestore dopo un nuovo salvataggio').toBeUndefined();
        expect(ambiente.eccezioni, 'eccezioni JavaScript').toEqual([]);
      });
    }
  });
}
