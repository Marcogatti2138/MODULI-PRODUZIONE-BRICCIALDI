// ═══ RIGHE DINAMICHE E SALVATAGGIO PROTETTO — condiviso dai Moduli 1-4 ═══
// 1. Alla riapertura di un progetto ricrea tutte le righe aggiunte a mano
//    (prove, brani, docenti, date concerto...), non solo quelle presenti
//    all'avvio della pagina: ogni campo salvato ritrova il suo posto.
// 2. I salvataggi di Referente e Responsabile riscrivono per intero la propria
//    mappa su Firestore. Qui si aggiungono i campi salvati che nella pagina non
//    hanno un posto e che l'utente non ha eliminato: un campo non visibile non
//    viene più cancellato "per sbaglio". Un campo svuotato a mano o una riga
//    eliminata restano invece tolti, come prima.
// 3. Nessun salvataggio mentre il progetto si sta ancora caricando: la pagina
//    è a metà e verrebbe scritta al posto dei dati veri.
//
// Usa, dal modulo che carica il file: metadati (per il ruolo) e le funzioni
// add* indicate nell'elenco dei tipi di riga del modulo.

// tipi: [{ campi: ['prova_data_', 'prova_luogo_', ...], conta: function() { return proveCount; }, aggiungi: addProva }]
// Per ogni tipo aggiunge righe finché il contatore arriva all'indice più alto salvato.
function ricreaRigheDinamiche(dati, tipi) {
  if (!dati) return;
  tipi.forEach(function(t) {
    var re = new RegExp('^(?:' + t.campi.join('|') + ')(\\d+)$');
    var max = 0;
    Object.keys(dati).forEach(function(k) {
      var m = re.exec(k);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var prima = -1;
    // si ferma anche se il contatore non sale (tabella assente nella pagina)
    while (t.conta() < max && t.conta() !== prima) {
      prima = t.conta();
      t.aggiungi();
    }
  });
}

// Nomi dei campi presenti nella pagina adesso.
function nomiCampiInPagina() {
  var nomi = {};
  document.querySelectorAll('[name]').forEach(function(el) { if (el.name) nomi[el.name] = true; });
  return nomi;
}

// Nomi che la pagina ha mostrato almeno una volta dopo il caricamento: se uno
// sparisce (riga eliminata o rinumerata) è una scelta dell'utente, non va conservato.
var _nomiVistiInPagina = {};
function annotaNomiInPagina() {
  var nomi = nomiCampiInPagina();
  Object.keys(nomi).forEach(function(n) { _nomiVistiInPagina[n] = true; });
}

// Campi salvati (cache) che la pagina non ha mai potuto mostrare.
function campiSenzaPosto(cache) {
  var inPagina = nomiCampiInPagina();
  return Object.keys(cache || {}).filter(function(k) { return !inPagina[k] && !_nomiVistiInPagina[k]; });
}

// Aggiunge ai dati letti dalla pagina i campi salvati senza posto, così il
// salvataggio non li cancella da Firestore.
function conservaCampiSenzaPosto(dati, cache) {
  campiSenzaPosto(cache).forEach(function(k) {
    if (!(k in dati)) dati[k] = cache[k];
  });
  annotaNomiInPagina();
  return dati;
}

// Caricamento in corso: impostato da caricaDaFirestore, tolto alla fine.
function caricamentoInCorso() { return window._caricamentoInCorso === true; }

// Fine del caricamento: sblocca i salvataggi e segnala i campi senza posto
// (in console sempre, a video solo al Responsabile).
function concludiCaricamento() {
  window._caricamentoInCorso = false;
  annotaNomiInPagina();
  var senzaPosto = campiSenzaPosto(window._datiReferenteCache).concat(campiSenzaPosto(window._datiResponsabileCache));
  var box = document.getElementById('avviso-campi-senza-posto');
  if (!senzaPosto.length) { if (box) box.remove(); return; }
  console.warn('Campi salvati senza un posto nella pagina (conservati su Firestore):', senzaPosto);
  if (typeof metadati === 'undefined' || metadati.ruolo !== 'responsabile') return;
  if (!box) {
    box = document.createElement('div');
    box.id = 'avviso-campi-senza-posto';
    box.style.cssText = 'background:#FFF8E1;border:1px solid #FFB300;color:#6D4C00;border-radius:8px;padding:10px 14px;margin:12px auto;max-width:1100px;font-size:12px;line-height:1.5';
    var header = document.querySelector('header');
    if (header && header.parentNode) header.parentNode.insertBefore(box, header.nextSibling);
    else document.body.insertBefore(box, document.body.firstChild);
  }
  var elenco = senzaPosto.slice(0, 12).join(', ') + (senzaPosto.length > 12 ? ' e altri ' + (senzaPosto.length - 12) : '');
  box.textContent = '⚠ ' + senzaPosto.length + ' campi salvati non hanno un posto in questa pagina: restano conservati su Firestore ma qui non si vedono (' + elenco + ').';
}
