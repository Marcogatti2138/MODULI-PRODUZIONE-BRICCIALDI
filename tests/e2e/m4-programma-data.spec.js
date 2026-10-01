// Mod. 4, intervento A (convegno di più giorni): il Programma ha una colonna
// Data, così ogni voce della scaletta dice a quale giorno appartiene. La data
// si salva come programma_data_N, segue la riga quando la si sposta o si
// elimina una riga sopra, torna alla riapertura e compare nella Sintesi (l'unico
// documento che riporta il Programma). Nella Sintesi la colonna Data c'è solo se
// almeno una voce ha la data: senza date (progetti salvati prima, eventi di un
// giorno) la tabella resta identica a prima, senza colonna e senza "—".
// Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const ID = '9241';
const documento = page => page.evaluate(id => window.__fintoDb.documento('progetti', id), ID);

async function modifica(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [nome, valore]);
}

async function pulsanteRiga(page, nomeCampo, tipo) {
  await page.evaluate(([n, t]) => {
    const riga = document.querySelector('[name="' + n + '"]').closest('[data-riga]');
    riga.querySelector('button[onclick*="' + t + '"]').click();
  }, [nomeCampo, tipo]);
}

function progetto(datiReferente) {
  return {
    metadati: { id: ID, titolo: 'Convegno di prova', tipologia: 'evento-istituzionale', referente: 'Referente Prova', email: 'referente.prova@example.org' },
    stato: {},
    dati_referente: Object.assign({ contesto_progetto: 'Testo iniziale di prova' }, datiReferente),
    dati_responsabile: {}
  };
}

async function apri(page) {
  await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID);
  await expect(page.locator('[name="contesto_progetto"]')).toHaveValue('Testo iniziale di prova', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

// 4 voci su 2 giorni: la quarta riga va oltre le 3 righe iniziali della pagina
const QUATTRO_VOCI = {
  programma_data_1: '15/03/2031', programma_orario_1: '10:00', programma_descrizione_1: 'Apertura di prova', programma_relatore_1: 'Relatore Uno',
  programma_data_2: '15/03/2031', programma_orario_2: '11:00', programma_descrizione_2: 'Sessione di prova', programma_relatore_2: 'Relatore Due',
  programma_data_3: '16/03/2031', programma_orario_3: '10:00', programma_descrizione_3: 'Seconda giornata di prova', programma_relatore_3: 'Relatore Tre',
  programma_data_4: '16/03/2031', programma_orario_4: '12:00', programma_descrizione_4: 'Chiusura di prova', programma_relatore_4: 'Relatore Quattro'
};

test.describe('M4 — colonna Data nel Programma (intervento A)', () => {
  test.describe('progetto con le date', () => {
    test.use({ accettaConferme: true, datiIniziali: { progetti: { [ID]: progetto(QUATTRO_VOCI) } } });

    test('la tabella ha la colonna Data e alla riapertura ogni voce ha la sua data', async ({ page, ambiente }) => {
      await apri(page);
      await expect(page.locator('#programma-tbody').locator('xpath=ancestor::table').locator('thead')).toContainText('Data');
      await expect(page.locator('#programma-tbody tr[data-riga="programma"]')).toHaveCount(4);
      for (let n = 1; n <= 4; n++) {
        await expect(page.locator('[name="programma_data_' + n + '"]')).toHaveValue(QUATTRO_VOCI['programma_data_' + n]);
      }
      expect(ambiente.eccezioni).toEqual([]);
    });

    test('la data scritta si salva su Firestore', async ({ page }) => {
      await apri(page);
      await modifica(page, 'programma_data_2', '17/03/2031');
      await expect.poll(async () => (await documento(page)).dati_referente.programma_data_2, { timeout: 8000 }).toBe('17/03/2031');
    });

    test('spostando o eliminando righe la data resta con la sua voce', async ({ page }) => {
      await apri(page);
      await pulsanteRiga(page, 'programma_orario_1', 'eliminaRiga');   // restano: Sessione, Seconda giornata, Chiusura
      await pulsanteRiga(page, 'programma_orario_3', "'su'");          // Chiusura sale sopra Seconda giornata
      await modifica(page, 'contesto_progetto', 'Dopo le modifiche');
      await expect.poll(async () => (await documento(page)).dati_referente.contesto_progetto, { timeout: 8000 }).toBe('Dopo le modifiche');
      const dr = (await documento(page)).dati_referente;
      expect([1, 2, 3].map(n => [dr['programma_data_' + n], dr['programma_descrizione_' + n]])).toEqual([
        ['15/03/2031', 'Sessione di prova'],
        ['16/03/2031', 'Chiusura di prova'],
        ['16/03/2031', 'Seconda giornata di prova']
      ]);
      expect(dr.programma_data_4, 'nessuna data rimasta su una riga che non c\'è più').toBeUndefined();
    });

    test('la Sintesi riporta la data di ogni voce', async ({ page }) => {
      await apri(page);
      await page.evaluate(() => aggiornaSintesiCompleta());
      const tabella = page.locator('#sint_programma_rows').locator('xpath=ancestor::table');
      await expect(tabella.locator('thead')).toContainText('Data');
      const righe = page.locator('#sint_programma_rows tr');
      await expect(righe).toHaveCount(4);
      await expect(righe.nth(0).locator('td').nth(0)).toHaveText('15/03/2031');
      await expect(righe.nth(0).locator('td').nth(1)).toHaveText('10:00');
      await expect(righe.nth(3).locator('td').nth(0)).toHaveText('16/03/2031');
      await expect(righe.nth(3)).toContainText('Chiusura di prova');
    });

    test('se solo alcune voci hanno la data, la colonna c\'è e le altre hanno "—"', async ({ page }) => {
      await apri(page);
      for (const n of [2, 3, 4]) await modifica(page, 'programma_data_' + n, '');
      await page.evaluate(() => aggiornaSintesiCompleta());
      await expect(page.locator('#sint_programma_rows').locator('xpath=ancestor::table').locator('thead')).toContainText('Data');
      const righe = page.locator('#sint_programma_rows tr');
      await expect(righe.nth(0).locator('td').nth(0)).toHaveText('15/03/2031');
      await expect(righe.nth(1).locator('td').nth(0)).toHaveText('—');
      await expect(righe.nth(1).locator('td').nth(1)).toHaveText('11:00');
    });
  });

  test.describe('progetto salvato prima, senza le date', () => {
    test.use({ datiIniziali: { progetti: { [ID]: progetto({
      programma_orario_1: '10:00', programma_descrizione_1: 'Saluti di prova', programma_relatore_1: 'Relatore Uno'
    }) } } });

    test('si apre come prima: data vuota, Sintesi senza colonna Data, nessun errore', async ({ page, ambiente }) => {
      await apri(page);
      await expect(page.locator('[name="programma_data_1"]')).toHaveValue('');
      await expect(page.locator('[name="programma_descrizione_1"]')).toHaveValue('Saluti di prova');
      await page.evaluate(() => aggiornaSintesiCompleta());
      // la Sintesi può essere chiusa a fisarmonica: si guarda lo stile, non la visibilità
      const colonneVisibili = await page.evaluate(() => [...document.getElementById('sint_programma_rows').closest('table').querySelectorAll('thead th')]
        .filter(th => getComputedStyle(th).display !== 'none').map(th => th.textContent.trim()));
      expect(colonneVisibili).toEqual(['Orario', 'Descrizione', 'Relatore/Moderatore']);
      const riga = page.locator('#sint_programma_rows tr').first();
      await expect(riga.locator('td')).toHaveCount(3);
      await expect(riga.locator('td').nth(0)).toHaveText('10:00');
      await expect(riga).not.toContainText('—');
      expect(ambiente.eccezioni).toEqual([]);
    });

    test('senza voci la riga "Nessuna voce" occupa le 3 colonne di sempre', async ({ page }) => {
      await apri(page);
      await modifica(page, 'programma_descrizione_1', '');
      await page.evaluate(() => aggiornaSintesiCompleta());
      await expect(page.locator('#sint_programma_rows td')).toHaveAttribute('colspan', '3');
    });
  });
});
