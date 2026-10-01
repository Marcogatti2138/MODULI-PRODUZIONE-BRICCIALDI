// Livello 2, punto 1 — progetti di prova completi, uno per modulo
// (tests/progetti-prova/completo-m*.json): tutte le sezioni compilate, righe
// aggiunte oltre quelle di partenza (repliche, prove, brani, docenti,
// preventivi, determine...), Dotazione con ogni tipo di disponibilità.
// Sono la base dei test sui pulsanti di generazione (punto 2).
// "Oggi" fissato al 15/01/2031. Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const MODULI = [
  { sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', progetto: require('../progetti-prova/completo-m1.json') },
  { sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', progetto: require('../progetti-prova/completo-m2.json') },
  { sigla: 'M3', file: 'Modulo_3_Masterclass.html', progetto: require('../progetti-prova/completo-m3.json') },
  { sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', progetto: require('../progetti-prova/completo-m4.json') }
];

// Campi che restano vuoti di proposito anche in un progetto completo.
const VUOTI_AMMESSI = /^spazio_concerto_altro$/;

// Bug noti, segnalati e non ancora corretti: i loro campi sono esclusi dai
// controlli generali e coperti da un test dedicato (test.fail) più sotto.
// Bug F — M4, Assistenza logistica: alla riapertura studenti e orario scritti
// dal Referente spariscono (valoreSpazioSalvato del M4 legge solo i dati del
// Responsabile) e il primo salvataggio li cancella da Firestore.
// Campi del M4 esclusi per il bug F dai tre controlli generali (riapertura,
// completezza, risalvataggio) — da rimettere quando F sarà corretto:
//   ass_log_studenti_concerto, ass_log_orario_concerto,
//   ass_log_studenti_replica_1, ass_log_orario_replica_1,
//   ass_log_studenti_replica_2, ass_log_orario_replica_2
// (ass_log_check_* non sono esclusi: le spunte si ripristinano correttamente).
const BUG_NOTI = { M4: /^ass_log_(studenti|orario)_/ };

function senzaBugNoti(m, dati) {
  const re = BUG_NOTI[m.sigla];
  return re ? Object.fromEntries(Object.entries(dati).filter(([k]) => !re.test(k))) : dati;
}

async function apri(page, m) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('/' + m.file + '?id=' + m.progetto.metadati.id + '&ruolo=responsabile');
  await expect(page.locator('[name="data_evento"]')).toHaveValue(m.progetto.dati_referente.data_evento, { timeout: 15000 });
  await page.waitForTimeout(1200); // i ripristini ritardati delle pagine (500–750 ms)
}

// Campi salvati che nella pagina mancano o hanno un valore diverso.
function campiDiversi(page, dati) {
  return page.evaluate(dati => Object.keys(dati).filter(k => {
    const el = document.querySelector('[name="' + k + '"]');
    if (!el) return true;
    if (el.type === 'checkbox') return el.checked !== (dati[k] === true);
    return el.value !== dati[k];
  }).map(k => {
    const el = document.querySelector('[name="' + k + '"]');
    return k + ': salvato ' + JSON.stringify(dati[k]) + ', in pagina ' + (el ? JSON.stringify(el.type === 'checkbox' ? el.checked : el.value) : 'nessun campo');
  }), dati);
}

for (const m of MODULI) {
  test.describe(m.sigla + ' — progetto di prova completo', () => {
    test.use({ datiIniziali: { progetti: { [m.progetto.metadati.id]: m.progetto } } });

    test('si apre senza errori né avvisi e ogni campo salvato ricompare con il suo valore', async ({ page, ambiente }) => {
      await apri(page, m);
      expect(await campiDiversi(page, senzaBugNoti(m, m.progetto.dati_referente)), 'dati del Referente').toEqual([]);
      expect(await campiDiversi(page, m.progetto.dati_responsabile), 'dati del Responsabile').toEqual([]);
      await expect(page.locator('#avviso-campi-senza-posto')).toHaveCount(0);
      await expect(page.locator('#avviso-coerenza-progetto'), 'avviso di congruità delle date').toBeHidden();
      expect(ambiente.eccezioni, 'eccezioni JavaScript').toEqual([]);
      expect(ambiente.erroriConsole, 'errori in console').toEqual([]);
      expect(ambiente.dialoghi, 'finestre alert/confirm').toEqual([]);
    });

    test('è davvero completo: nessun campo visibile vuoto', async ({ page }) => {
      await apri(page, m);
      // "Nascosto" = display:none su di sé o su un contenitore (parte non pertinente).
      // Prima si aprono tutte le sezioni chiuse a fisarmonica (.section-body.hidden);
      // i campi dentro pannelli chiusi (<details>) contano già come visibili.
      const vuoti = await page.evaluate(() => {
        document.querySelectorAll('.section-body.hidden').forEach(el => el.classList.remove('hidden'));
        const nascosto = el => { for (let a = el; a; a = a.parentElement) if (getComputedStyle(a).display === 'none') return true; return false; };
        return [...document.querySelectorAll('input[name], select[name], textarea[name]')]
          .filter(el => el.type !== 'hidden' && el.type !== 'checkbox' && !el.disabled && !el.value && !nascosto(el))
          .map(el => el.name);
      });
      expect(vuoti.filter(n => !VUOTI_AMMESSI.test(n) && !(BUG_NOTI[m.sigla] && BUG_NOTI[m.sigla].test(n))), 'campi nuovi o non compilati: aggiornare il progetto di prova').toEqual([]);
    });

    test('Referente e Responsabile risalvano gli stessi identici dati', async ({ page }) => {
      await apri(page, m);
      const id = m.progetto.metadati.id;
      const prima = await page.evaluate(() => window.__fintoDb.scritture().length);
      await page.evaluate(() => { salvaReferenteSuFirestore(); salvaResponsabileSuFirestore(); });
      await expect.poll(() => page.evaluate(() => window.__fintoDb.scritture().length), { timeout: 8000 }).toBeGreaterThanOrEqual(prima + 2);
      const d = await page.evaluate(id => window.__fintoDb.documento('progetti', id), id);
      expect(senzaBugNoti(m, d.dati_referente)).toEqual(senzaBugNoti(m, m.progetto.dati_referente));
      expect(d.dati_responsabile).toEqual(m.progetto.dati_responsabile);
      expect(d.metadati).toMatchObject(m.progetto.metadati);
    });
  });
}

// Bug F (M4) — fallimento atteso finché il bug è aperto: quando verrà corretto
// questo test "passerà per sbaglio" e Playwright lo segnalerà; a quel punto
// togliere test.fail e la voce M4 da BUG_NOTI.
test.describe('M4 — Bug F, Assistenza logistica alla riapertura', () => {
  const m = MODULI[3];
  test.use({ datiIniziali: { progetti: { [m.progetto.metadati.id]: m.progetto } } });
  test('studenti e orario scritti dal Referente ricompaiono', async ({ page }) => {
    test.fail(true, 'Bug F aperto: segnalato a Marco, non ancora corretto');
    await apri(page, m);
    const atteso = Object.fromEntries(Object.entries(m.progetto.dati_referente).filter(([k]) => BUG_NOTI.M4.test(k)));
    expect(await campiDiversi(page, atteso)).toEqual([]);
  });
});
