// Bug 4 — Mod. 4: la mail "dati anagrafici" aveva il testo vecchio (senza biografia).
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

// La mail "dati anagrafici" deve essere la stessa in tutti e 4 i moduli.
const btn = { getAttribute: a => ({ 'data-nome': 'Collaboratore Prova', 'data-email': 'collaboratore.prova@example.org', 'data-tel': '+39 000 0000000' })[a] };
const mailDatiAnagrafici = sigla => linkMail(sigla, ['generaRichiestaDatiAnagrafici', 'slugPersona'], f => f.generaRichiestaDatiAnagrafici(btn));

for (const sigla of MODULI) {
  test(sigla + ' — mail dati anagrafici: modulo dati + biografia artistica, uguale in tutti i moduli', () => {
    const href = mailDatiAnagrafici(sigla);
    const testo = decodeURIComponent(href);
    assert.ok(href.startsWith('mailto:collaboratore.prova@example.org?cc=ufficiopersonale@briccialditerni.it&subject='));
    assert.match(testo, /subject=Dati per l'incarico e biografia artistica - Progetto di prova/);
    assert.match(testo, /1\) MODULO DATI \(obbligatorio\)/);
    assert.match(testo, /2\) BIOGRAFIA ARTISTICA \(obbligatoria, senza dati sensibili\)/);
    assert.match(testo, /Nome: Collaboratore Prova\nEmail: collaboratore\.prova@example\.org\nCellulare: \+39 000 0000000/);
    assert.equal(href, mailDatiAnagrafici('M1'), 'testo diverso da quello del Mod. 1');
  });
}
