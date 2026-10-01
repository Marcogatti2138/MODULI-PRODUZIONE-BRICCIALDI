// ═══ DURATE SCRITTE A MANO — condiviso da Dashboard e Moduli 1-4 ═══
// Il campo "durata" è testo libero (es. "90 minuti, con intervallo"). Qui c'è
// l'unica lettura: la usano la tabella Trasporti e gli orari degli Spazi
// (estraiDurataMinuti) e il Calendario PDF (calcolaOraFineDaDurata).

// Minuti di smontaggio dopo concerto o replica, aggiunti all'orario di occupazione
// della sala (calcolaOrarioEsteso, Mod. 1 e 2). Valore deciso da Marco il 01/10/2026.
var MINUTI_SMONTAGGIO_CONCERTO = 45;

// Minuti indicati nel testo, oppure null se non c'è una durata riconoscibile.
//   "90 minuti", "90 min", "90'", "90"     → 90  (un numero da solo vale minuti)
//   "2 ore", "2h"                          → 120
//   "1 ora e 30 minuti", "1h30", "1 h 30'" → 90
//   "1,5 ore", "circa 1,5 ore"             → 90
//   "1:30" (ore:minuti)                    → 90
//   "un'ora e mezza" → 90, "mezz'ora" → 30
function leggiDurataMinuti(testo) {
  if (!testo) return null;
  var t = String(testo).toLowerCase().replace(/[’`´]/g, "'");
  t = t.replace(/e\s+mezz[ao]\b/g, 'e 30 min').replace(/mezz'ora/g, '30 min').replace(/\bun'ora\b|\bun ora\b/g, '1 ora');

  var hm = /(\d{1,2}):(\d{2})/.exec(t);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);

  var ore = /(\d+(?:[.,]\d+)?)\s*(?:ore|ora|h)(?![a-z])/.exec(t);
  if (ore) {
    var minuti = Math.round(parseFloat(ore[1].replace(',', '.')) * 60);
    // minuti subito dopo le ore: "1h30", "1 ora e 30", "1 h 30'"
    var resto = /^\s*(?:e\s*)?(\d{1,2})(?!\d)/.exec(t.slice(ore.index + ore[0].length));
    if (resto) minuti += parseInt(resto[1], 10);
    return minuti;
  }

  var min = /(\d+)\s*(?:minuti|minuto|min|')/.exec(t) || /(\d+)/.exec(t);
  return min ? parseInt(min[1], 10) : null;
}

// Durata in minuti (null se assente): tabella Trasporti, orari degli Spazi.
function estraiDurataMinuti(durataStr) {
  return leggiDurataMinuti(durataStr);
}

// Ora di fine "HH:MM" da ora di inizio + durata, oltre la mezzanotte se serve;
// stringa vuota se manca l'ora di inizio o la durata. Calendario PDF.
function calcolaOraFineDaDurata(oraInizio, durataTesto) {
  var mIn = /(\d{1,2}):(\d{2})/.exec(oraInizio || '');
  if (!mIn) return '';
  var durata = leggiDurataMinuti(durataTesto);
  if (!durata) return '';
  var totMin = (parseInt(mIn[1], 10) * 60 + parseInt(mIn[2], 10) + durata) % 1440;
  return ('0' + Math.floor(totMin / 60)).slice(-2) + ':' + ('0' + (totMin % 60)).slice(-2);
}
