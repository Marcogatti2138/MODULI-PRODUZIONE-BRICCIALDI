/**
 * SINCRONIZZAZIONE FIRESTORE → GOOGLE SHEET
 * Database Produzioni Briccialdi — Conservatorio "G. Briccialdi" di Terni
 *
 * Cosa fa:
 * - Legge tutti i progetti dalla collezione Firestore "progetti" (lettura pubblica,
 *   nessuna autenticazione richiesta — le regole del database la consentono).
 * - Aggiorna SOLO le 11 colonne che si possono ricavare in modo affidabile dai
 *   moduli: ID, Anno, Tipologia, Titolo, Docente Referente, Data Evento,
 *   N° Delibera CA, Data Delibera, Stato Progetto, N° Progetto Conservatorio,
 *   Link Modulo/Firestore.
 * - Non tocca MAI le altre colonne (Sede, budget, spese, SIAE, Fascicolo Drive,
 *   Note, Determine, Pacchetto Comunicazione) — quelle restano solo a tua cura,
 *   sia sulle righe nuove sia su quelle già esistenti.
 * - Se un progetto Firestore non è ancora nel foglio, aggiunge una riga nuova con
 *   solo i campi sincronizzabili compilati, più le formule di Spese Consuntivo
 *   e Scostamento (mai riscritte sulle righe già esistenti); le colonne
 *   manuali restano vuote, pronte per te.
 * - Se un ID che era nel foglio non risulta più su Firestore (probabile
 *   eliminazione), lo segnala con una nota sulla cella ID — non cancella mai
 *   la riga da solo.
 *
 * Come si avvia: menù "🔄 Sincronizza" → "Sincronizza ora da Firestore",
 * che compare in alto nel foglio ogni volta che lo apri, una volta installato
 * questo script.
 *
 * Posizione delle colonne nel foglio "📁 Archivio Progetti" (verificata a mano
 * il 13/09/2026 — se il foglio viene ristrutturato, questi numeri vanno
 * riallineati): NON sono nell'ordine "pulito" A-X + AA-AF che dice la guida
 * del foglio — le colonne Y/Z NON sono vuote, sono già "N° Progetto
 * Conservatorio" e "Determina Dotazione Tecnica".
 */

var FIRESTORE_PROJECT_ID = 'briccialdi-produzioni';
var NOME_FOGLIO = '📁 Archivio Progetti';

// Numero di colonna (A=1, B=2, ... Z=26, AA=27, AB=28, ...)
var COLONNA_ID = 1;                // A  — ID Progetto
var COLONNA_ANNO = 2;              // B  — Anno (ricavato dall'anno della Data Evento)
var COLONNA_TIPOLOGIA = 3;         // C  — Tipologia
var COLONNA_TITOLO = 4;            // D  — Titolo Progetto
var COLONNA_REFERENTE = 5;         // E  — Docente Referente
var COLONNA_DATA_EVENTO = 6;       // F  — Data Evento
var COLONNA_DELIBERA = 8;          // H  — N° Delibera CA
var COLONNA_DATA_DELIBERA = 9;     // I  — Data Delibera
var COLONNA_STATO_PROGETTO = 13;   // M  — Stato Progetto
var COLONNA_ID_CONSERVATORIO = 25; // Y  — N° Progetto Conservatorio
var COLONNA_LINK = 30;             // AD — Link Modulo / Firestore

// Queste due NON sono tra le colonne sincronizzabili: la formula viene scritta
// una sola volta, solo quando lo script crea una riga nuova — mai su una riga
// già esistente, per non sovrascrivere formule che avessi personalizzato tu.
var COLONNA_SPESE_CONSUNTIVO = 11; // K — Spese Consuntivo (€), somma voci di spesa
var COLONNA_SCOSTAMENTO = 12;      // L — Scostamento (€), Budget - Spese

// Colonne che lo script scrive — usate per sapere quali toccare, mai le altre.
var COLONNE_SINCRONIZZABILI = [
  COLONNA_ID, COLONNA_ANNO, COLONNA_TIPOLOGIA, COLONNA_TITOLO, COLONNA_REFERENTE,
  COLONNA_DATA_EVENTO, COLONNA_DELIBERA, COLONNA_DATA_DELIBERA, COLONNA_STATO_PROGETTO,
  COLONNA_ID_CONSERVATORIO, COLONNA_LINK
];

// Codice interno salvato nei moduli (campo metadati.tipologia) → etichetta
// usata nel menù a tendina "Tipologia" del foglio.
var TIPOLOGIA_LABEL = {
  'sinfonico-corale': 'Sinfonico-Corale',
  'piccolo-concerto': 'Piccolo Concerto',
  'masterclass': 'Masterclass / Seminario',
  'evento-istituzionale': 'Evento Istituzionale'
};

// Codice interno tipologia → nome file del modulo, per ricostruire il link diretto.
var TIPOLOGIA_MODULO = {
  'sinfonico-corale': 'Modulo_1_SinfonicoCORALE.html',
  'piccolo-concerto': 'Modulo_2_PiccoloConcerto.html',
  'masterclass': 'Modulo_3_Masterclass.html',
  'evento-istituzionale': 'Modulo_4_EventoIstituzionale.html'
};

/**
 * Aggiunge il menù "🔄 Sincronizza" in alto nel foglio, ogni volta che lo apri.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 Sincronizza')
    .addItem('Sincronizza ora da Firestore', 'sincronizzaFirestore')
    .addToUi();
}

/**
 * Funzione principale — richiamata dal pulsante di menù. Legge Firestore,
 * aggiorna le righe esistenti, aggiunge quelle nuove, segnala le orfane.
 */
function sincronizzaFirestore() {
  var ui = SpreadsheetApp.getUi();
  var foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_FOGLIO);
  if (!foglio) {
    ui.alert('Non trovo la scheda "' + NOME_FOGLIO + '". Controlla che il nome corrisponda esattamente (emoji incluso).');
    return;
  }

  var progetti;
  try {
    progetti = leggiProgettiDaFirestore();
  } catch (e) {
    ui.alert('Errore nel leggere Firestore:\n\n' + e.message);
    return;
  }

  if (progetti.length === 0) {
    ui.alert('Nessun progetto trovato su Firestore. Controllo interrotto per sicurezza — nessuna modifica al foglio.');
    return;
  }

  var ultimaRiga = foglio.getLastRow();
  var numColonne = Math.max(foglio.getLastColumn(), COLONNA_LINK);
  var datiEsistenti = ultimaRiga >= 2 ? foglio.getRange(2, 1, ultimaRiga - 1, 1).getValues() : [];

  // Mappa ID Progetto (colonna A) → numero di riga reale nel foglio.
  var rigaPerId = {};
  for (var i = 0; i < datiEsistenti.length; i++) {
    var idRiga = String(datiEsistenti[i][0] || '').trim();
    if (idRiga) rigaPerId[idRiga] = i + 2;
  }

  var aggiornate = 0;
  var aggiunte = 0;
  var righeNuoveDati = [];

  progetti.forEach(function(p) {
    var valori = valoriSincronizzabili(p);
    var rigaEsistente = rigaPerId[String(p.id)];

    if (rigaEsistente) {
      COLONNE_SINCRONIZZABILI.forEach(function(col) {
        foglio.getRange(rigaEsistente, col).setValue(valori[col]);
      });
      aggiornate++;
    } else {
      var nuovaRiga = new Array(numColonne).fill('');
      COLONNE_SINCRONIZZABILI.forEach(function(col) {
        nuovaRiga[col - 1] = valori[col];
      });
      righeNuoveDati.push(nuovaRiga);
      aggiunte++;
    }
  });

  if (righeNuoveDati.length > 0) {
    var rigaIniziale = foglio.getLastRow() + 1;
    foglio.getRange(rigaIniziale, 1, righeNuoveDati.length, numColonne).setValues(righeNuoveDati);
    for (var r = 0; r < righeNuoveDati.length; r++) {
      var rigaCorrente = rigaIniziale + r;
      foglio.getRange(rigaCorrente, COLONNA_SPESE_CONSUNTIVO).setFormula(formulaSpeseConsuntivo(rigaCorrente));
      foglio.getRange(rigaCorrente, COLONNA_SCOSTAMENTO).setFormula(formulaScostamento(rigaCorrente));
    }
  }

  // Segnala (senza mai cancellare) le righe il cui ID non esiste più su Firestore —
  // probabilmente un progetto eliminato. La nota compare come triangolino rosso
  // sulla cella ID, visibile passandoci sopra il mouse; nessun dato viene toccato.
  var idAttivi = {};
  progetti.forEach(function(p) { idAttivi[String(p.id)] = true; });
  var orfane = 0;
  Object.keys(rigaPerId).forEach(function(id) {
    if (!idAttivi[id]) {
      foglio.getRange(rigaPerId[id], COLONNA_ID).setNote(
        '⚠ Questo ID non risulta più su Firestore alla sincronizzazione del ' +
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') +
        ' — probabilmente il progetto è stato eliminato. La riga non è stata toccata.'
      );
      orfane++;
    }
  });

  ui.alert(
    'Sincronizzazione completata.\n\n' +
    'Righe aggiornate: ' + aggiornate + '\n' +
    'Righe nuove aggiunte: ' + aggiunte + '\n' +
    (orfane > 0 ? ('Righe segnalate come non più su Firestore: ' + orfane + ' (vedi nota sulla cella ID)\n') : '') +
    '\nLe colonne di Sede, budget, spese, SIAE, note e determine non sono mai state toccate.'
  );
}

/**
 * Costruisce l'oggetto {numero_colonna: valore} per un progetto, applicando
 * le mappature (tipologia, stato) e i calcoli (anno, link) necessari.
 */
function valoriSincronizzabili(p) {
  var valori = {};
  valori[COLONNA_ID] = p.id;
  valori[COLONNA_ANNO] = annoDaData(p.dataEvento);
  valori[COLONNA_TIPOLOGIA] = TIPOLOGIA_LABEL[p.tipologia] || p.tipologia || '';
  valori[COLONNA_TITOLO] = p.titolo || '';
  valori[COLONNA_REFERENTE] = p.referente || '';
  valori[COLONNA_DATA_EVENTO] = p.dataEvento || '';
  valori[COLONNA_DELIBERA] = p.delibera || '';
  valori[COLONNA_DATA_DELIBERA] = p.dataDelibera || '';
  valori[COLONNA_STATO_PROGETTO] = statoSincronizzato(p.stato || {});
  valori[COLONNA_ID_CONSERVATORIO] = p.idConservatorio || '';
  valori[COLONNA_LINK] = costruisciLinkModulo(p);
  return valori;
}

/**
 * Estrae l'anno (numero) da una data in formato italiano "GG/MM/AAAA".
 * Restituisce '' se la data manca o non è nel formato atteso — non forza mai
 * un valore indovinato.
 */
function annoDaData(dataIT) {
  if (!dataIT) return '';
  var parti = String(dataIT).split('/');
  if (parti.length !== 3) return '';
  var anno = parseInt(parti[2], 10);
  return isNaN(anno) ? '' : anno;
}

/**
 * Mappa lo stato Firestore (booleani stato.annullato/completato/rimandato,
 * usati identicamente in Dashboard_Briccialdi.html) sulle 4 opzioni REALI del
 * menu a tendina "Stato Progetto" nel foglio — verificate a mano il 13/09/2026:
 * In attesa / In corso / Chiuso / Annullato.
 * "Scaduto" e le sotto-fasi Dashboard (In compilazione, Inviato dal Referente)
 * confluiscono tutte in "In corso": nel foglio non c'è una voce più
 * specifica, e un progetto in ritardo è comunque ancora aperto, non chiuso.
 */
function statoSincronizzato(stato) {
  if (stato.annullato) return 'Annullato';
  if (stato.completato) return 'Chiuso';
  if (stato.rimandato) return 'In attesa';
  return 'In corso';
}

/**
 * Formula per la colonna "Spese Consuntivo": somma delle voci di spesa
 * (Compensi Collab./Coro Esterno, Noleggio, Trasporti, Service, Sala,
 * Accessori, Compenso Orchestrali Esterni). Scritta come SUM di un unico
 * intervallo più un addendo — niente virgole né punti e virgola tra
 * argomenti, quindi nessun problema di lingua/locale del foglio.
 */
function formulaSpeseConsuntivo(riga) {
  return '=SUM(R' + riga + ':X' + riga + ')+AC' + riga;
}

/**
 * Formula per la colonna "Scostamento": Budget Autorizzato meno Spese Consuntivo.
 */
function formulaScostamento(riga) {
  return '=J' + riga + '-K' + riga;
}

/**
 * Ricostruisce il link diretto al modulo, vista Responsabile, per un progetto.
 */
function costruisciLinkModulo(p) {
  var nomeFile = TIPOLOGIA_MODULO[p.tipologia];
  if (!nomeFile) return '';
  return 'https://marcogatti2138.github.io/MODULI-PRODUZIONE-BRICCIALDI/' + nomeFile +
    '?id=' + encodeURIComponent(p.id) + '&ruolo=responsabile';
}

/**
 * Legge tutti i documenti dalla collezione "progetti" via REST API pubblica di
 * Firestore, gestendo la paginazione se i progetti superano i 300. Ogni
 * documento ha struttura {metadati, dati_referente, dati_responsabile, stato}
 * — stessa struttura letta da Dashboard_Briccialdi.html.
 */
function leggiProgettiDaFirestore() {
  var urlBase = 'https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT_ID +
    '/databases/(default)/documents/progetti?pageSize=300';
  var risultati = [];
  var pageToken = null;

  do {
    var url = pageToken ? (urlBase + '&pageToken=' + encodeURIComponent(pageToken)) : urlBase;
    var risposta = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var codice = risposta.getResponseCode();
    if (codice !== 200) {
      throw new Error('Firestore ha risposto con codice ' + codice + ':\n' + risposta.getContentText());
    }

    var dati = JSON.parse(risposta.getContentText());
    var documenti = dati.documents || [];

    documenti.forEach(function(doc) {
      var campi = parseCampiFirestore(doc.fields || {});
      var id = doc.name.split('/').pop();
      var metadati = campi.metadati || {};
      var datiReferente = campi.dati_referente || {};
      var stato = campi.stato || {};

      risultati.push({
        id: id,
        tipologia: metadati.tipologia || '',
        titolo: metadati.titolo || '',
        referente: metadati.referente || '',
        dataEvento: datiReferente.data_evento || '',
        delibera: metadati.delibera || '',
        dataDelibera: metadati.data_delibera || '',
        idConservatorio: metadati.id_conservatorio || '',
        stato: stato
      });
    });

    pageToken = dati.nextPageToken || null;
  } while (pageToken);

  return risultati;
}

/**
 * Converte il formato tipizzato di Firestore REST ({stringValue:"..."} ecc.)
 * in un normale oggetto JavaScript {chiave: valore}.
 */
function parseCampiFirestore(campi) {
  var risultato = {};
  Object.keys(campi).forEach(function(chiave) {
    risultato[chiave] = parseValoreFirestore(campi[chiave]);
  });
  return risultato;
}

function parseValoreFirestore(valore) {
  if (valore.stringValue !== undefined) return valore.stringValue;
  if (valore.integerValue !== undefined) return parseInt(valore.integerValue, 10);
  if (valore.doubleValue !== undefined) return valore.doubleValue;
  if (valore.booleanValue !== undefined) return valore.booleanValue;
  if (valore.nullValue !== undefined) return null;
  if (valore.timestampValue !== undefined) return valore.timestampValue;
  if (valore.mapValue !== undefined) return parseCampiFirestore(valore.mapValue.fields || {});
  if (valore.arrayValue !== undefined) {
    return (valore.arrayValue.values || []).map(parseValoreFirestore);
  }
  return null;
}