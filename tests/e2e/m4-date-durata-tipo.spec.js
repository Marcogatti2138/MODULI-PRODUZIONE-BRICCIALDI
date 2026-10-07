// Mod. 4, intervento D (convegno di più giorni): ogni data aggiuntiva ha la sua
// durata (replica_durata_N, testo come la durata della data principale; vuota =
// durata della data principale) e il suo tipo (replica_tipo_N: vuoto = Sessione,
// oppure "Concerto"). Sessione non cambia nessun testo; Concerto marca la data:
// "Replica N (Concerto)" in Spazi, Assistenza, Calendario e avviso spazi,
// "GG/MM/AAAA (Concerto)" nelle righe dei giorni (Sintesi, Centralino, Dotazione/
// Materiale). La durata entra nell'orario degli Spazi (inizio + durata + 45') e
// nella colonna FINE del Calendario (solo se scritta). Le Determine non cambiano.
// Senza i campi nuovi tutto resta com'era: documenti-una-data.spec.js.
// "Oggi" = 15/01/2031. Dati inventati.

const { test, expect } = require('./ambiente');
const { testiDocumenti, DOCUMENTI_M4 } = require('./documenti-testo');

const base = require('../progetti-prova/completo-m4.json');
const ID = base.metadati.id;
const URL = '/Modulo_4_EventoIstituzionale.html?id=' + ID;
const GIORNI_LUOGHI = '15/03/2031 presso Teatro Secci; 22/03/2031 presso Sede Prova Replica 1; 29/03/2031 presso Sede Prova Replica 2';

function progettoCon(referente) {
  const p = JSON.parse(JSON.stringify(base));
  Object.assign(p.dati_referente, referente);
  Object.assign(p.dati_responsabile, { spazio_replica_2: 'Sala Orologio' });
  delete p.dati_responsabile.spazio_replica_2_altro;
  return p;
}

async function apri(page, ruolo) {
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto(URL + (ruolo ? '&ruolo=' + ruolo : ''));
  await expect(page.locator('[name="data_evento"]')).toHaveValue('15/03/2031', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

// Valore impostato come dall'utente (la Sezione 1 può essere chiusa).
async function modifica(page, nome, valore, evento) {
  await page.evaluate(([n, v, ev]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event(ev, { bubbles: true }));
  }, [nome, valore, evento]);
}

const testi = page => page.evaluate(testiDocumenti, { quali: DOCUMENTI_M4, cfgDetermina: { sezioneDotazione: 'Sezione 6' } });

test.describe('M4 — durata e tipo delle date aggiuntive (intervento D)', () => {
  test.describe('Replica 2 = Concerto di 2 ore, Replica 1 senza campi nuovi', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progettoCon({ replica_tipo_2: 'Concerto', replica_durata_2: '2 ore' }) } } });

    test('Spazi, Richiesta Spazi e Notifica: orario con la durata della replica, Concerto nell\'etichetta', async ({ page, ambiente }) => {
      await apri(page, 'responsabile');
      const t = await testi(page);
      expect(t.tabellaSpazi).toContain('Replica 1 | 22/03/2031 | 21:00–23:15 |'); // durata della data principale (1h30)
      expect(t.tabellaSpazi).toContain('Replica 2 (Concerto) | 29/03/2031 | 21:00–23:45 |'); // 2 ore + 45'
      expect(t.richiestaSpazi).toContain('- Replica 1 — 22/03/2031 ore 21:00–23:15 — con margine di preparazione, inizio ore 21:00, durata 90\' — Spazio: Sede Prova Replica 1'); // bug K, corretto
      expect(t.richiestaSpazi).toContain('- Replica 2 (Concerto) — 29/03/2031 ore 21:00–23:45 — con margine di preparazione, inizio ore 21:00, durata 120\' — Spazio: Sala Orologio');
      expect(t.notificaSpaziReferente).toContain('- Replica 2 (Concerto) — 29/03/2031 ore 21:00–23:45\n  Spazio assegnato: Sala Orologio — Proposta iniziale: Sede Prova Replica 2');
      expect(ambiente.eccezioni).toEqual([]);
    });

    test('Assistenza e Calendario PDF: tipo nell\'etichetta, FINE solo con la durata scritta', async ({ page }) => {
      await apri(page, 'responsabile');
      const t = await testi(page);
      expect(t.tabellaAssistenza).toContain(' | Replica 1 | 22/03/2031 |');
      expect(t.tabellaAssistenza).toContain(' | Replica 2 (Concerto) | 29/03/2031 |');
      expect(t.calendarioPDF).toContain('22/03/2031\nSede Prova Replica 1\n21:00\n—\nReplica 1\n');
      expect(t.calendarioPDF).toContain('29/03/2031\nSala Orologio\n21:00\n23:00\nReplica 2 (Concerto)\n');
    });

    test('Sintesi, Centralino e Dotazione/Materiale: "(Concerto)" sul giorno; Determine invariate', async ({ page }) => {
      await apri(page, 'responsabile');
      const t = await testi(page);
      expect(t.sintesiDate).toBe('15/03/2031 | Teatro Secci | 22/03/2031 — Sede Prova Replica 1; 29/03/2031 (Concerto) — Sala Orologio');
      expect(t.centralino).toContain('Date evento:\n- 15/03/2031 — Teatro Secci\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 (Concerto) — Sala Orologio');
      expect(t.dotazioneMateriale).toContain('Date evento:\n- 15/03/2031 — Teatro Secci\n- 22/03/2031 — Sede Prova Replica 1\n- 29/03/2031 (Concerto) — Sede Prova Replica 2');
      expect(t.determinaAcquisti).toContain('dei giorni ' + GIORNI_LUOGHI + '.');
      expect(t.determinaAcquisti).not.toContain('Concerto)');
    });

    test('avviso al Referente sullo spazio assegnato: "Replica 2 (Concerto)"', async ({ page }) => {
      await apri(page);
      const avviso = await page.evaluate(() => { aggiornaAvvisoSpaziModificati(); return document.getElementById('avviso-spazi-modificati').innerText; });
      expect(avviso).toContain('Replica 2 (Concerto): assegnato "Sala Orologio" (avevi proposto "Sede Prova Replica 2")');
    });
  });

  test.describe('Sessione e concerto nello stesso giorno', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progettoCon({
      replica_data_3: '15/03/2031', replica_ora_3: '18:00', replica_luogo_3: 'Teatro Secci', replica_tipo_3: 'Concerto', replica_durata_3: '1h'
    }) } } });

    test('due righe per lo stesso giorno, distinte dal tipo; nelle Determine la data compare una volta', async ({ page }) => {
      await apri(page, 'responsabile');
      const t = await testi(page);
      expect(t.tabellaSpazi).toContain('Replica 3 (Concerto) | 15/03/2031 | 18:00–19:45 |');
      // Centralino: spazio assegnato (la Replica 3 non ne ha ancora uno)
      expect(t.centralino).toContain('Date evento:\n- 15/03/2031 (Concerto) — [spazio non ancora assegnato]\n- 15/03/2031 — Teatro Secci\n- 22/03/2031');
      expect(t.dotazioneMateriale).toContain('Date evento:\n- 15/03/2031 (Concerto) — Teatro Secci\n- 15/03/2031 — Teatro Secci\n- 22/03/2031');
      expect(t.determinaAcquisti).toContain('dei giorni ' + GIORNI_LUOGHI + '.');
    });
  });

  test.describe('Sezione 1: i campi nuovi', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progettoCon({}) } } });

    test('tipo (Sessione predefinito) e durata con segnaposto; salvati, spostati con la riga, ricreati alla riapertura', async ({ page }) => {
      await apri(page);
      const tipo1 = page.locator('[name="replica_tipo_1"]');
      await expect(tipo1).toHaveValue('');
      expect(await tipo1.locator('option').allTextContents()).toEqual(['Sessione', 'Concerto']);
      await expect(page.locator('[name="replica_durata_1"]')).toHaveAttribute('placeholder', /vuoto.*durata della data principale/i);

      await modifica(page, 'replica_tipo_2', 'Concerto', 'change');
      await modifica(page, 'replica_durata_2', '45 minuti', 'input');
      // Replica 2 sale al primo posto: tipo e durata la seguono
      await page.evaluate(() => document.querySelector('[name="replica_data_2"]').closest('[data-riga]').querySelector('button[onclick*="\'su\'"]').click());
      await expect(page.locator('[name="replica_data_1"]')).toHaveValue('29/03/2031');
      await expect(page.locator('[name="replica_tipo_1"]')).toHaveValue('Concerto');
      await expect(page.locator('[name="replica_durata_1"]')).toHaveValue('45 minuti');
      await expect(page.locator('[name="replica_tipo_2"]')).toHaveValue('');

      await modifica(page, 'note_evento', 'Salva', 'input');
      const documento = () => page.evaluate(id => window.__fintoDb.documento('progetti', id), ID);
      await expect.poll(async () => (await documento()).dati_referente.note_evento, { timeout: 8000 }).toBe('Salva');
      const dr = (await documento()).dati_referente;
      expect([dr.replica_tipo_1, dr.replica_durata_1]).toEqual(['Concerto', '45 minuti']);
      expect('replica_tipo_2' in dr, 'Sessione (vuoto) non si salva').toBe(false);
      expect('replica_durata_2' in dr).toBe(false);

      // Alla riapertura una riga con solo tipo e durata viene ricreata
      const doc = await documento();
      Object.assign(doc.dati_referente, { replica_tipo_4: 'Concerto', replica_durata_4: '30 minuti' });
      await page.addInitScript(d => { window.__FINTO_DB_INIZIALE = d; }, { progetti: { [ID]: doc } });
      await page.reload();
      await expect(page.locator('[name="data_evento"]')).toHaveValue('15/03/2031', { timeout: 15000 });
      await expect(page.locator('[name="replica_tipo_4"]')).toHaveValue('Concerto');
      await expect(page.locator('[name="replica_durata_4"]')).toHaveValue('30 minuti');
    });
  });
});
