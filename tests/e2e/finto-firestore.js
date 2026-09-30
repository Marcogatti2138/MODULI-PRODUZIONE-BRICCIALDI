// Finto Firestore per i test end-to-end. Durante i test sostituisce i due
// script Firebase caricati da gstatic.com (firebase-app-compat.js e
// firebase-firestore-compat.js): il vero SDK non viene mai scaricato e i dati
// restano in memoria nella pagina. Imita solo ciò che le pagine usano:
//   collection().get(), doc().get/set/update/delete, set con { merge: true },
//   update con nomi puntati ("stato.richieste_inviate.x"), runTransaction,
//   FieldValue.serverTimestamp() e FieldValue.delete().
// I dati iniziali arrivano da window.__FINTO_DB_INIZIALE, impostato dal test
// prima che la pagina parta. window.__fintoDb espone dati e scritture al test.
(function() {
  if (window.firebase && window.firebase.__finto) return; // i due script sostituiti caricano lo stesso file

  function FintoTimestamp(ms) { this.seconds = Math.floor(ms / 1000); this.nanoseconds = (ms % 1000) * 1e6; }
  FintoTimestamp.prototype.toDate = function() { return new Date(this.seconds * 1000 + this.nanoseconds / 1e6); };
  FintoTimestamp.prototype.toMillis = function() { return this.seconds * 1000 + this.nanoseconds / 1e6; };

  var SERVER_TIMESTAMP = { __fintoCampo: 'serverTimestamp' };
  var ELIMINA = { __fintoCampo: 'delete' };

  function eMappa(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof FintoTimestamp) && !v.__fintoCampo;
  }

  // Copia profonda che conserva i Timestamp e risolve i segnaposto serverTimestamp.
  function copia(v) {
    if (v === SERVER_TIMESTAMP) return new FintoTimestamp(Date.now());
    if (v instanceof FintoTimestamp) return new FintoTimestamp(v.toMillis());
    if (Array.isArray(v)) return v.map(copia);
    if (eMappa(v)) {
      var out = {};
      Object.keys(v).forEach(function(k) { if (v[k] !== ELIMINA && v[k] !== undefined) out[k] = copia(v[k]); });
      return out;
    }
    return v;
  }

  // Dati iniziali: i Timestamp arrivano come { __timestamp: ms } dal JSON del test.
  function riviviTimestamp(v) {
    if (Array.isArray(v)) return v.map(riviviTimestamp);
    if (v && typeof v === 'object') {
      if (typeof v.__timestamp === 'number') return new FintoTimestamp(v.__timestamp);
      var out = {};
      Object.keys(v).forEach(function(k) { out[k] = riviviTimestamp(v[k]); });
      return out;
    }
    return v;
  }

  var collezioni = riviviTimestamp(window.__FINTO_DB_INIZIALE || {});
  var scritture = [];

  function documenti(col) { return collezioni[col] || (collezioni[col] = {}); }

  // set con merge: le mappe si fondono ricorsivamente, FieldValue.delete toglie il campo.
  function fondi(destinazione, sorgente) {
    Object.keys(sorgente).forEach(function(k) {
      var v = sorgente[k];
      if (v === ELIMINA) { delete destinazione[k]; return; }
      if (eMappa(v) && eMappa(destinazione[k])) { fondi(destinazione[k], v); return; }
      destinazione[k] = copia(v);
    });
  }

  // update: ogni chiave è un percorso con i punti; il valore sostituisce per intero
  // quello che c'è a quel percorso (una mappa NON si fonde con la precedente).
  function aggiornaPercorsi(dati, campi) {
    Object.keys(campi).forEach(function(percorso) {
      var parti = percorso.split('.');
      var nodo = dati;
      for (var i = 0; i < parti.length - 1; i++) {
        if (!eMappa(nodo[parti[i]])) nodo[parti[i]] = {};
        nodo = nodo[parti[i]];
      }
      var ultima = parti[parti.length - 1];
      if (campi[percorso] === ELIMINA) delete nodo[ultima];
      else nodo[ultima] = copia(campi[percorso]);
    });
  }

  function erroreNonTrovato(col, id) {
    var e = new Error('No document to update: ' + col + '/' + id);
    e.code = 'not-found';
    return e;
  }

  function Istantanea(col, id) {
    var dati = documenti(col)[id];
    this.id = id;
    this.exists = dati !== undefined;
    this._dati = dati === undefined ? undefined : copia(dati);
  }
  Istantanea.prototype.data = function() { return this._dati === undefined ? undefined : copia(this._dati); };

  // Controlli che il Firestore vero fa prima di scrivere (errore "invalid-argument"):
  // niente valori undefined; FieldValue.delete() solo nei set con merge e, negli
  // update, solo come valore diretto di un campo (non dentro una mappa).
  function erroreArgomento(msg) { var e = new Error(msg); e.code = 'invalid-argument'; return e; }
  function valida(v, eliminaAmmesso, percorso) {
    if (v === undefined) throw erroreArgomento('Unsupported field value: undefined (campo ' + percorso + ')');
    if (v === ELIMINA) { if (!eliminaAmmesso) throw erroreArgomento('FieldValue.delete() non ammesso in ' + percorso); return; }
    if (Array.isArray(v)) { v.forEach(function(x, i) { valida(x, false, percorso + '[' + i + ']'); }); return; }
    if (eMappa(v)) Object.keys(v).forEach(function(k) { valida(v[k], eliminaAmmesso, percorso ? percorso + '.' + k : k); });
  }

  function validaSet(dati, opzioni) { valida(dati, !!(opzioni && opzioni.merge), ''); }
  function validaUpdate(campi) { Object.keys(campi).forEach(function(k) { valida(campi[k], campi[k] === ELIMINA, k); }); }

  // Operazioni sincrone sul "database"; i metodi pubblici le avvolgono in Promise.
  var op = {
    set: function(col, id, dati, opzioni) {
      scritture.push({ tipo: 'set', col: col, id: id, merge: !!(opzioni && opzioni.merge), dati: copia(dati) });
      if (opzioni && opzioni.merge && documenti(col)[id]) fondi(documenti(col)[id], dati);
      else documenti(col)[id] = copia(dati);
    },
    update: function(col, id, campi) {
      if (!documenti(col)[id]) throw erroreNonTrovato(col, id);
      scritture.push({ tipo: 'update', col: col, id: id, dati: copia(campi) });
      aggiornaPercorsi(documenti(col)[id], campi);
    },
    elimina: function(col, id) {
      scritture.push({ tipo: 'delete', col: col, id: id });
      delete documenti(col)[id];
    }
  };

  function asincrono(fn) {
    return new Promise(function(risolvi, rifiuta) {
      setTimeout(function() { try { risolvi(fn()); } catch (e) { rifiuta(e); } }, 0);
    });
  }

  function RiferimentoDoc(col, id) { this.col = col; this.id = id; }
  RiferimentoDoc.prototype.get = function() { var r = this; return asincrono(function() { return new Istantanea(r.col, r.id); }); };
  // Gli errori di formato escono subito (come nell'SDK vero), "documento inesistente" come promessa rifiutata.
  RiferimentoDoc.prototype.set = function(dati, opzioni) { validaSet(dati, opzioni); var r = this; return asincrono(function() { op.set(r.col, r.id, dati, opzioni); }); };
  RiferimentoDoc.prototype.update = function(campi) { validaUpdate(campi); var r = this; return asincrono(function() { op.update(r.col, r.id, campi); }); };
  RiferimentoDoc.prototype.delete = function() { var r = this; return asincrono(function() { op.elimina(r.col, r.id); }); };

  function RiferimentoCollezione(col) { this.col = col; }
  RiferimentoCollezione.prototype.doc = function(id) { return new RiferimentoDoc(this.col, String(id)); };
  RiferimentoCollezione.prototype.get = function() {
    var col = this.col;
    return asincrono(function() {
      var docs = Object.keys(documenti(col)).map(function(id) { return new Istantanea(col, id); });
      return { docs: docs, size: docs.length, empty: docs.length === 0, forEach: function(cb) { docs.forEach(cb); } };
    });
  };

  // Transazioni: le operazioni si eseguono una dopo l'altra, senza concorrenza.
  function Transazione() {}
  Transazione.prototype.get = function(ref) { return Promise.resolve(new Istantanea(ref.col, ref.id)); };
  Transazione.prototype.set = function(ref, dati, opzioni) { validaSet(dati, opzioni); op.set(ref.col, ref.id, dati, opzioni); return this; };
  Transazione.prototype.update = function(ref, campi) { validaUpdate(campi); op.update(ref.col, ref.id, campi); return this; };
  Transazione.prototype.delete = function(ref) { op.elimina(ref.col, ref.id); return this; };

  var db = {
    collection: function(col) { return new RiferimentoCollezione(col); },
    runTransaction: function(fn) { return asincrono(function() { return null; }).then(function() { return fn(new Transazione()); }); }
  };

  var configUsata = null;
  function firestore() { return db; }
  firestore.FieldValue = {
    serverTimestamp: function() { return SERVER_TIMESTAMP; },
    delete: function() { return ELIMINA; }
  };
  firestore.Timestamp = { fromMillis: function(ms) { return new FintoTimestamp(ms); }, now: function() { return new FintoTimestamp(Date.now()); } };

  window.firebase = {
    __finto: true,
    initializeApp: function(cfg) { configUsata = cfg; return {}; },
    firestore: firestore
  };

  window.__fintoDb = {
    dati: function() { return JSON.parse(JSON.stringify(collezioni)); },
    documento: function(col, id) { var d = documenti(col)[id]; return d === undefined ? null : JSON.parse(JSON.stringify(d)); },
    scritture: function() { return JSON.parse(JSON.stringify(scritture)); },
    configUsata: function() { return configUsata; }
  };
})();
