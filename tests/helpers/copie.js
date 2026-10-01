// Strumenti comuni agli unit test del livello 1.
const test = require('node:test');
const { PAGINE, leggi, funzioniDelFile, caricaFunzioni, caricaFile } = require('./estrai-funzioni');

// Esegue `verifica(funzioni, sigla)` su ogni pagina che contiene TUTTE le funzioni
// richieste: lo stesso test gira su ogni copia (Dashboard, Mod. 1-4), così una copia
// rimasta indietro si vede subito. `opzioni` passa a node:test (es. { todo: '...' });
// opzioni.solo limita il test ad alcune copie (es. { solo: ['D'] }).
function suOgniCopia(titolo, nomi, verifica, contesto, opzioni) {
  opzioni = Object.assign({}, opzioni);
  const solo = opzioni.solo; delete opzioni.solo;
  const sigle = Object.keys(PAGINE).filter(s => {
    if (solo && !solo.includes(s)) return false;
    const f = funzioniDelFile(PAGINE[s]);
    return nomi.every(n => f[n]);
  });
  if (!sigle.length) throw new Error('Nessuna pagina contiene: ' + nomi.join(', '));
  for (const sigla of sigle) {
    test(sigla + ' — ' + titolo, opzioni, () => {
      const ctx = typeof contesto === 'function' ? contesto() : (contesto || {});
      verifica(caricaFunzioni(PAGINE[sigla], nomi, ctx), sigla);
    });
  }
}

// Classe Date con "oggi" fisso, da passare nel contesto delle funzioni che usano new Date().
function dataFissa(anno, mese, giorno, ora) {
  const adesso = new Date(anno, mese - 1, giorno, ora || 12, 0, 0).getTime();
  return class extends Date {
    constructor(...a) { if (a.length) super(...a); else super(adesso); }
    static now() { return adesso; }
  };
}

// Finto campo di input per le funzioni che formattano "this" (onblur).
function campo(valore) { return { value: valore }; }

// La funzione `nome` che una pagina usa davvero: la sua copia interna se c'è,
// altrimenti quella di un file condiviso che la pagina carica (<script src="...">).
function funzioneDellaPagina(file, nome, condivisi, contesto) {
  if (funzioniDelFile(file)[nome]) return caricaFunzioni(file, [nome], contesto)[nome];
  for (const c of condivisi) {
    if (leggi(file).includes('<script src="' + c + '"></script>')) {
      const f = caricaFile(c, contesto)[nome];
      if (f) return f;
    }
  }
  throw new Error(file + ': nessuna ' + nome + ' disponibile');
}

// Copia "normale" di un valore creato nel contesto isolato (liste e oggetti), per
// confrontarlo con deepEqual: valori uguali ma nati in contesti diversi non risultano identici.
function normale(valore) { return JSON.parse(JSON.stringify(valore)); }

module.exports = { suOgniCopia, dataFissa, campo, funzioneDellaPagina, normale };
