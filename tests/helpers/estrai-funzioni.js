// Estrae le funzioni dichiarate negli script delle pagine (HTML) e dei file .js
// del repo, e le esegue in un contesto Node isolato (vm). Serve agli unit test:
// si prova il codice vero delle pagine senza modificarle e senza browser.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const acorn = require('acorn');

const REPO = path.resolve(__dirname, '..', '..');

// Pagine e file condivisi, con la sigla usata nei nomi dei test.
const PAGINE = {
  D: 'Dashboard_Briccialdi.html',
  M1: 'Modulo_1_SinfonicoCORALE.html',
  M2: 'Modulo_2_PiccoloConcerto.html',
  M3: 'Modulo_3_Masterclass.html',
  M4: 'Modulo_4_EventoIstituzionale.html'
};

function leggi(file) {
  return fs.readFileSync(path.join(REPO, file), 'utf8');
}

// Blocchi di codice di un file: gli <script> in linea di un HTML
// (non quelli con src), oppure il file intero se è un .js.
function blocchiDiCodice(file) {
  const testo = leggi(file);
  if (file.endsWith('.js')) return [testo];
  const blocchi = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(testo))) blocchi.push(m[1]);
  return blocchi;
}

// Sorgenti delle funzioni dichiarate al primo livello, per nome.
// Se un nome compare più volte vince l'ultima, come nel browser.
function funzioniDelFile(file) {
  const trovate = {};
  for (const codice of blocchiDiCodice(file)) {
    const ast = acorn.parse(codice, { ecmaVersion: 'latest', allowReturnOutsideFunction: true });
    for (const nodo of ast.body) {
      if (nodo.type === 'FunctionDeclaration') trovate[nodo.id.name] = codice.slice(nodo.start, nodo.end);
    }
  }
  return trovate;
}

// Esegue in un contesto isolato le funzioni richieste di un file e le restituisce.
// `contesto` fornisce le variabili che le funzioni si aspettano di trovare
// (es. getField, metadati). Errore se una funzione non esiste nel file.
function caricaFunzioni(file, nomi, contesto) {
  const tutte = funzioniDelFile(file);
  const mancanti = nomi.filter(n => !tutte[n]);
  if (mancanti.length) throw new Error(file + ': funzioni non trovate: ' + mancanti.join(', '));
  const ctx = vm.createContext(Object.assign({}, contesto));
  vm.runInContext(nomi.map(n => tutte[n]).join('\n'), ctx, { filename: file });
  const out = {};
  nomi.forEach(n => { out[n] = ctx[n]; });
  return out;
}

// Esegue un intero file .js condiviso (es. coerenza-date.js) in un contesto isolato.
function caricaFile(file, contesto) {
  const ctx = vm.createContext(Object.assign({}, contesto));
  vm.runInContext(leggi(file), ctx, { filename: file });
  return ctx;
}

module.exports = { REPO, PAGINE, leggi, funzioniDelFile, caricaFunzioni, caricaFile };
