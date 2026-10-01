// Bug 3 — Mod. 1: la bozza Determina Noleggio partiva senza destinatario.
// Si controlla il link mailto: che la pagina aprirebbe. Dati inventati.

const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGINE, caricaFunzioni } = require('../helpers/estrai-funzioni');

const MODULI = ['M1', 'M2', 'M3', 'M4'];

// Esegue una funzione della pagina che apre una mail e restituisce il link mailto:.
function linkMail(sigla, nomi, chiama) {
  const window = { location: { href: '' } };
  const contesto = {
    window,
    metadati: { id: '9301', titolo: 'Progetto di prova' },
    document: { getElementById: () => ({ value: 'Testo di prova della bozza' }) },
    registraRichiestaGenerata: () => true,
    alert: msg => { throw new Error('alert inatteso: ' + msg); }
  };
  const fn = caricaFunzioni(PAGINE[sigla], nomi, contesto);
  chiama(fn);
  return window.location.href;
}

// Destinatari (tutto ciò che precede "subject=") di un link mailto:.
const destinatari = href => href.slice(0, href.indexOf('subject='));

for (const sigla of MODULI) {
  test(sigla + ' — bozza Determina Noleggio: stessi destinatari delle altre Determine', () => {
    const noleggio = linkMail(sigla, ['apriMailDeterminaNoleggio'], f => f.apriMailDeterminaNoleggio());
    const trasporti = linkMail(sigla, ['apriMailDeterminaTrasporti'], f => f.apriMailDeterminaTrasporti());
    assert.equal(destinatari(noleggio), destinatari(trasporti));
    assert.equal(destinatari(noleggio), 'mailto:direttoreamministrativo@briccialditerni.it?cc=produzione@briccialditerni.it&');
    assert.match(decodeURIComponent(noleggio), /Testo di prova della bozza/);
  });
}
