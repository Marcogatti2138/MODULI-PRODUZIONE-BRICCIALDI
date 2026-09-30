// Mod. 4: eliminando o spostando una riga di Colli, Programma o Relatori, la
// rinumerazione rinominava i campi (collo_materiale_N, prog_*, relat_*): il
// contenuto finiva sotto nomi che nessuna parte della pagina legge, e i
// contatori di Programma e Relatori non scendevano (numerazione con buchi).
// Tutti i dati sono inventati.

const { test, expect } = require('./ambiente');

const ID = '9201';
const documento = page => page.evaluate(id => window.__fintoDb.documento('progetti', id), ID);

async function modifica(page, nome, valore) {
  await page.evaluate(([n, v]) => {
    const el = document.querySelector('[name="' + n + '"]');
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [nome, valore]);
}

async function attendiCaricamento(page) {
  await expect(page.locator('[name="contesto_progetto"]')).toHaveValue('Testo iniziale di prova', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

// Clic sul pulsante di una riga (▲ sposta su, ✕ elimina), trovata da un suo campo.
async function pulsanteRiga(page, nomeCampo, tipo) {
  await page.evaluate(([n, t]) => {
    const riga = document.querySelector('[name="' + n + '"]').closest('[data-riga]');
    riga.querySelector('button[onclick*="' + t + '"]').click();
  }, [nomeCampo, tipo]);
}

test.describe('M4 — rinumerazione di Colli, Programma e Relatori', () => {
  test.use({
    accettaConferme: true,
    datiIniziali: { progetti: { [ID]: {
      metadati: { id: ID, titolo: 'Evento di prova', tipologia: 'evento-istituzionale', referente: 'Referente Prova', email: 'referente.prova@example.org' },
      stato: {},
      dati_referente: {
        contesto_progetto: 'Testo iniziale di prova',
        collo_1: 'Materiale prova uno', collo_dest_1: 'Sala Uno',
        collo_2: 'Materiale prova due', collo_dest_2: 'Sala Due',
        collo_3: 'Materiale prova tre',
        programma_orario_1: '10:00', programma_descrizione_1: 'Saluti di prova', programma_relatore_1: 'Relatore Uno',
        programma_orario_2: '10:30', programma_descrizione_2: 'Intervento di prova', programma_relatore_2: 'Relatore Due',
        programma_orario_3: '11:00', programma_descrizione_3: 'Chiusura di prova', programma_relatore_3: 'Relatore Tre',
        relatore_nome_1: 'Relatore Uno', relatore_qualifica_1: 'Qualifica Uno',
        relatore_nome_2: 'Relatore Due', relatore_qualifica_2: 'Qualifica Due'
      },
      dati_responsabile: {}
    } } }
  });

  test('eliminare e spostare righe mantiene i nomi dei campi e i contatori', async ({ page }) => {
    await page.goto('/Modulo_4_EventoIstituzionale.html?id=' + ID);
    await attendiCaricamento(page);

    await pulsanteRiga(page, 'collo_1', 'eliminaRiga');              // resta: due, tre
    await pulsanteRiga(page, 'collo_2', "'su'");                     // tre sale al primo posto
    await pulsanteRiga(page, 'programma_orario_1', 'eliminaRiga');   // restano: 10:30, 11:00
    await pulsanteRiga(page, 'relatore_nome_1', 'eliminaRiga');      // resta: Relatore Due
    // Una riga aggiunta dopo l'eliminazione deve prendere il numero successivo, senza buchi
    await page.evaluate(() => addProgramma());
    await modifica(page, 'programma_descrizione_3', 'Aggiunta dopo eliminazione');

    await modifica(page, 'contesto_progetto', 'Dopo le modifiche');
    await expect.poll(async () => (await documento(page)).dati_referente.contesto_progetto, { timeout: 8000 }).toBe('Dopo le modifiche');
    const dr = (await documento(page)).dati_referente;

    expect(Object.keys(dr).filter(k => /^(collo_materiale_|prog_|relat_)/.test(k)), 'campi con nomi sbagliati').toEqual([]);
    expect([dr.collo_1, dr.collo_2, dr.collo_3]).toEqual(['Materiale prova tre', 'Materiale prova due', undefined]);
    expect(dr.collo_dest_2).toBe('Sala Due');
    expect([dr.programma_orario_1, dr.programma_orario_2]).toEqual(['10:30', '11:00']);
    expect(dr.programma_descrizione_3).toBe('Aggiunta dopo eliminazione');
    expect(dr.programma_orario_4, 'nessun buco nella numerazione').toBeUndefined();
    expect([dr.relatore_nome_1, dr.relatore_nome_2]).toEqual(['Relatore Due', undefined]);
  });
});

