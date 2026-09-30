// Bug 2 — righe dinamiche alla riapertura del progetto.
// Le righe oltre quelle già presenti all'avvio (prove oltre la 5ª, brani oltre
// il 6º, docenti oltre il 3º, date del concerto nel Mod. 3, ...) non venivano
// ricreate: i campi salvati non avevano un posto nella pagina e il primo
// salvataggio del Referente riscriveva dati_referente senza di loro.
// Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const ID = '9101';

// Per modulo: i campi salvati che devono ricomparire (e sopravvivere a un salvataggio).
const MODULI = [
  {
    sigla: 'M1', file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale',
    campi: {
      prova_data_6: '10/03/2031', prova_luogo_6: 'Sala Prova Sei',
      brano_titolo_7: 'Brano di prova sette', brano_autore_7: 'Autore Inventato',
      doc_nome_4: 'Docente Prova Quattro', doc_email_4: 'docente.quattro@example.org',
      doc_nome_5: 'Docente Prova Cinque'
    }
  },
  {
    sigla: 'M2', file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto',
    campi: {
      prova_data_6: '10/03/2031', prova_luogo_6: 'Sala Prova Sei', prova_data_7: '11/03/2031',
      brano_titolo_7: 'Brano di prova sette', brano_autore_7: 'Autore Inventato',
      doc_nome_4: 'Docente Prova Quattro', doc_email_4: 'docente.quattro@example.org'
    }
  },
  {
    sigla: 'M3', file: 'Modulo_3_Masterclass.html', tipologia: 'masterclass',
    campi: {
      dataconcerto_data_1: '20/03/2031', dataconcerto_ora_1: '18:00', dataconcerto_data_2: '21/03/2031',
      esecconcerto_nome_1: 'Esecutore Prova Uno', esecconcerto_ruolo_1: 'Violino', esecconcerto_nome_2: 'Esecutore Prova Due',
      collaboratore_nome_1: 'Collaboratore Prova Uno', collaboratore_email_1: 'collaboratore.uno@example.org',
      prova_data_6: '10/03/2031', prova_capienza_6: '12 persone',
      brano_titolo_7: 'Brano di prova sette',
      doc_nome_4: 'Docente Prova Quattro'
    }
  },
  {
    sigla: 'M4', file: 'Modulo_4_EventoIstituzionale.html', tipologia: 'evento-istituzionale',
    campi: {
      doc_nome_4: 'Docente Prova Quattro', doc_email_4: 'docente.quattro@example.org'
    }
  }
];

function progetto(m) {
  return {
    metadati: { id: ID, titolo: 'Progetto righe di prova', tipologia: m.tipologia, referente: 'Referente Prova', email: 'referente.prova@example.org' },
    stato: {},
    dati_referente: Object.assign({ data_evento: '15/03/2031', contesto_progetto: 'Testo iniziale di prova' }, m.campi),
    dati_responsabile: {}
  };
}

async function attendiCaricamento(page) {
  await expect(page.locator('[name="contesto_progetto"]')).toHaveValue('Testo iniziale di prova', { timeout: 15000 });
  await page.waitForTimeout(1200); // i ripristini ritardati delle pagine (500–700 ms)
}

for (const m of MODULI) {
  test.describe(m.sigla, () => {
    test.use({ datiIniziali: { progetti: { [ID]: progetto(m) } } });

    test('alla riapertura ogni campo salvato ricompare nella sua riga', async ({ page }) => {
      await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
      await attendiCaricamento(page);
      const mancanti = await page.evaluate(campi => Object.keys(campi).filter(k => {
        const el = document.querySelector('[name="' + k + '"]');
        return !el || el.value !== campi[k];
      }), m.campi);
      expect(mancanti, 'campi salvati senza posto (o con valore diverso) dopo la riapertura').toEqual([]);
    });

    test('un salvataggio del Referente non cancella i campi salvati', async ({ page }) => {
      await page.goto('/' + m.file + '?id=' + ID);
      await attendiCaricamento(page);
      await page.evaluate(() => {
        const el = document.querySelector('[name="contesto_progetto"]');
        el.value = 'Testo modificato dal Referente';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await expect.poll(() => page.evaluate(() => {
        const d = window.__fintoDb.documento('progetti', '9101');
        return d && d.dati_referente && d.dati_referente.contesto_progetto;
      }), { timeout: 8000 }).toBe('Testo modificato dal Referente');
      const salvati = await page.evaluate(() => window.__fintoDb.documento('progetti', '9101').dati_referente);
      const persi = Object.keys(m.campi).filter(k => salvati[k] !== m.campi[k]);
      expect(persi, 'campi cancellati da Firestore dal salvataggio').toEqual([]);
    });
  });
}

// Salvataggio protetto: questi test verificano la seconda parte della correzione,
// indipendentemente dalla ricreazione delle righe.
const SENZA_POSTO_REF = 'campo_dismesso_prova';
const SENZA_POSTO_RESP = 'campo_resp_dismesso_prova';

function progettoConCampiSenzaPosto(m) {
  const p = progetto(m);
  p.dati_referente[SENZA_POSTO_REF] = 'valore da conservare';
  p.dati_responsabile = { determina_nol_prot_richiesta: '0000', [SENZA_POSTO_RESP]: 'valore responsabile da conservare' };
  return p;
}

async function modifica(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [nome, valore]);
}

const documento = page => page.evaluate(() => window.__fintoDb.documento('progetti', '9101'));

for (const m of MODULI) {
  test.describe(m.sigla + ' — salvataggio protetto', () => {
    test.describe('campi senza posto', () => {
      test.use({ datiIniziali: { progetti: { [ID]: progettoConCampiSenzaPosto(m) } } });

      test('restano su Firestore dopo i salvataggi di Referente e Responsabile, e il Responsabile vede l\'avviso', async ({ page }) => {
        await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
        await attendiCaricamento(page);
        const avviso = page.locator('#avviso-campi-senza-posto');
        await expect(avviso).toContainText(SENZA_POSTO_REF);
        await expect(avviso).toContainText(SENZA_POSTO_RESP);

        await modifica(page, 'contesto_progetto', 'Testo modificato');
        await modifica(page, 'determina_nol_prot_richiesta', '1111');
        await expect.poll(async () => { const d = await documento(page); return [d.dati_referente.contesto_progetto, d.dati_responsabile.determina_nol_prot_richiesta]; }, { timeout: 8000 })
          .toEqual(['Testo modificato', '1111']);
        const d = await documento(page);
        expect(d.dati_referente[SENZA_POSTO_REF]).toBe('valore da conservare');
        expect(d.dati_responsabile[SENZA_POSTO_RESP]).toBe('valore responsabile da conservare');
      });
    });

    test.describe('riga eliminata', () => {
      test.use({ datiIniziali: { progetti: { [ID]: progetto(m) } }, accettaConferme: true });

      test('una riga eliminata dall\'utente resta eliminata su Firestore', async ({ page }) => {
        await page.goto('/' + m.file + '?id=' + ID + '&ruolo=responsabile');
        await attendiCaricamento(page);
        await page.evaluate(() => {
          const riga = document.querySelector('[name="doc_nome_4"]').closest('[data-riga]');
          riga.querySelector('button[onclick*="eliminaRiga"]').click();
        });
        await modifica(page, 'contesto_progetto', 'Dopo eliminazione');
        await expect.poll(async () => (await documento(page)).dati_referente.contesto_progetto, { timeout: 8000 }).toBe('Dopo eliminazione');
        const salvati = (await documento(page)).dati_referente;
        expect(Object.values(salvati), 'il docente eliminato non deve tornare').not.toContain('Docente Prova Quattro');
        expect(salvati.doc_email_4, 'email della riga eliminata').toBeUndefined();
        if (m.campi.doc_nome_5) expect(salvati.doc_nome_4, 'la riga successiva scala al 4º posto').toBe(m.campi.doc_nome_5);
        expect(salvati.doc_nome_5, 'dopo la rinumerazione il 5º posto non esiste più').toBeUndefined();
      });
    });

    test.describe('rete lenta', () => {
      test.use({ datiIniziali: { progetti: { [ID]: progetto(m) } }, ritardoLettura: 3000 });

      test('nessun salvataggio mentre il progetto si sta ancora caricando', async ({ page }) => {
        await page.goto('/' + m.file + '?id=' + ID);
        // Modifica fatta subito, prima che i dati arrivino dal database
        await modifica(page, 'contesto_progetto', 'Scritto durante il caricamento');
        await expect.poll(() => page.evaluate(() => window.__fintoDb.scritture().filter(s => s.dati && s.dati.dati_referente).length), { timeout: 15000 })
          .toBeGreaterThan(0);
        const scritture = await page.evaluate(() => window.__fintoDb.scritture().filter(s => s.dati && s.dati.dati_referente));
        for (const s of scritture) {
          const persi = Object.keys(m.campi).filter(k => s.dati.dati_referente[k] !== m.campi[k]);
          expect(persi, 'campi mancanti in una scrittura di dati_referente').toEqual([]);
        }
      });
    });
  });
}
