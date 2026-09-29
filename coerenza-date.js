// ═══ CONGRUITÀ DATE NEL SINGOLO PROGETTO — condiviso dai Moduli 1-4 ═══
// Confronta tra loro le date di un progetto (evento, repliche, prove,
// trasporti, prestiti, centralino, trasferte, scadenze offerte) e restituisce
// le incongruenze in due gruppi: errori probabili e punti da verificare.
// Sola lettura: non modifica campi né dati salvati, non blocca nulla. Il
// risultato si aggiunge all'avviso ambra di verificaCoerenzaProgetto() in cima
// al modulo: ogni voce è cliccabile (porta al campo) e i campi coinvolti hanno
// il bordo ambra. Le regole sui campi del Responsabile (furgone, prestito,
// centralino, scadenze offerte) si vedono solo in vista Responsabile.
//
// Usa, se presenti nel modulo che carica il file: getField, metadati,
// elencoVociInPrestito, valoreSpazioSalvato, ricalcolaTextareaSezione,
// window._statoProgetto.
//
// Regole (decise con Marco il 29/09/2026):
//   E0 data evento a più di 12 mesi da oggi          (errore)
//   E1 data a più di 6 mesi dal periodo dell'evento  (errore)
//   E2 prestito ritirato dopo il primo uso / riconsegnato prima dell'ultimo (errore, Resp)
//   E3 trasferta replica invertita o fuori dalla data della replica (errore, Mod. 1-2)
//   E4 periodo masterclass / alloggio invertiti      (errore, Mod. 3)
//   E5 prove fuori sequenza o dopo l'evento          (errore, Mod. 4 — nei Mod. 1-3 c'è già)
//   E6 data non valida                                (errore)
//   D0 evento già passato con progetto ancora attivo (da verificare)
//   A1 sede del furgone diversa da quella dell'appuntamento (Resp, Mod. 1-3)
//   A2 nessun tempo di viaggio tra ritiro e consegna successiva (Resp, Mod. 1-3)
//   A3 consegna e ritiro alla stessa ora nella stessa tappa (Resp, Mod. 1-3)
//   A4 centralino fuori dal periodo prove–evento ±7 giorni (Resp)
//   A5 scadenza offerte non prima del primo servizio (Resp)
//   A6 replica in altra sede senza persone da trasportare indicate (Mod. 1, 2, 4)
//   A7 concerti finali fuori dal periodo masterclass ±7 giorni (Mod. 3)
//
// Ogni voce è { testo, campi }: campi elenca i riferimenti ai campi coinvolti —
// il nome del campo, oppure "prestito|<voce>|ritiro|riconsegna", "furgone|<tipo tappa>",
// "trasferta|<tappa>" quando il nome dipende da una riga della tabella.

var CD_MESI_E1 = 6;
var CD_MESI_E0 = 12;
var CD_MARGINE_GIORNI = 7;
var CD_SERVIZI = { trasp: 'Trasporti', nol: 'Noleggio/Service', trper: 'Trasferta Persone', pers: 'Personale Esterno' };

function cdCampo(nome) {
  if (typeof getField === 'function') return getField(nome);
  var el = document.querySelector('[name="' + nome + '"]');
  return el ? String(el.value || '').trim() : '';
}

// GG/MM/AAAA → Date (mezzanotte) oppure null. Rifiuta le date inesistenti
// (31/02) invece di farle scivolare al mese dopo.
function cdData(str) {
  if (!str) return null;
  var p = String(str).trim().split('/');
  if (p.length !== 3) return null;
  var gg = parseInt(p[0], 10), mm = parseInt(p[1], 10), aa = parseInt(p[2], 10);
  if (isNaN(gg) || isNaN(mm) || isNaN(aa)) return null;
  if (aa < 100) aa += 2000;
  var d = new Date(aa, mm - 1, gg);
  if (d.getFullYear() !== aa || d.getMonth() !== mm - 1 || d.getDate() !== gg) return null;
  return d;
}

function cdMinuti(ora) {
  var m = /^(\d{1,2})[:.](\d{2})$/.exec(String(ora || '').trim());
  if (!m) return null;
  var h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

function cdAggiungiMesi(d, mesi) { return new Date(d.getFullYear(), d.getMonth() + mesi, d.getDate()); }
function cdAggiungiGiorni(d, giorni) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + giorni); }
function cdFmt(d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }

// Confronto nomi di sede senza maiuscole, punteggiatura e spazi doppi.
function cdNormLuogo(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9àèéìòù]+/g, ' ').trim();
}

function cdIndici(prefisso) {
  var out = [], n = 1;
  while (document.querySelector('[name="' + prefisso + n + '"]')) { out.push(n); n++; }
  return out;
}

function cdMin(date) { return date.length ? new Date(Math.min.apply(null, date)) : null; }
function cdMax(date) { return date.length ? new Date(Math.max.apply(null, date)) : null; }

// Tappe spuntate della tabella Trasporti Materiale (Mod. 1-3), nell'ordine
// della tabella — lo stesso usato dal PDF Richiesta Preventivo Trasporti.
function cdTappeTrasporto() {
  var tappe = [];
  document.querySelectorAll('#trasporti-materiale-tbody tr').forEach(function(row) {
    var cb = row.querySelector('input[type="checkbox"][name^="trasp_mat_check_"]');
    if (!cb || !cb.checked) return;
    var key = cb.name.replace('trasp_mat_check_', '');
    var dataStr = row.children[2] ? row.children[2].textContent.trim() : '';
    tappe.push({
      key: key,
      tipo: row.children[1] ? row.children[1].textContent.trim() : key,
      dataStr: dataStr,
      data: cdData(dataStr),
      dest: cdCampo('trasp_mat_dest_' + key),
      consegna: cdCampo('trasp_mat_furg_consegna_' + key),
      ritiro: cdCampo('trasp_mat_furg_ritiro_' + key)
    });
  });
  return tappe;
}

// Sede dell'appuntamento: spazio assegnato dal Responsabile, altrimenti la
// sede proposta dal Referente (stessa priorità della tabella Trasporti).
function cdSedeAppuntamento(key) {
  var leggi = (typeof valoreSpazioSalvato === 'function') ? valoreSpazioSalvato : cdCampo;
  var spazio = leggi('spazio_' + key) || '';
  if (spazio === 'Altro') spazio = leggi('spazio_' + key + '_altro') || '';
  if (spazio) return spazio;
  if (key === 'concerto') return cdCampo('luogo_concerto');
  var m = /^replica_(\d+)$/.exec(key);
  if (m) return cdCampo('replica_luogo_' + m[1]) || cdCampo('luogo_concerto');
  m = /^prova_(\d+)$/.exec(key);
  if (m) return cdCampo('prova_luogo_' + m[1]);
  return '';
}

// modulo: 1 Sinfonico-Corale, 2 Piccolo Concerto, 3 Masterclass, 4 Evento Istituzionale
function verificaCongruitaDate(modulo) {
  var errori = [], attenzione = [];
  var err = function(testo, campi) { errori.push({ testo: testo, campi: campi || [] }); };
  var att = function(testo, campi) { attenzione.push({ testo: testo, campi: campi || [] }); };
  try {
    var isResp = typeof metadati !== 'undefined' && metadati && metadati.ruolo === 'responsabile';
    var masterclass = modulo === 3;
    var haTappe = modulo !== 4 && cdCampo('trasporti_previsti') !== 'No';
    var etichettaProva = masterclass ? 'Lezione ' : 'Prova ';
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    var segnalati = {}; // campi già segnalati da E1/E6: evita di ripeterli nelle regole successive

    // ── Raccolta date del Referente ──
    var inizioEvento = cdData(cdCampo('data_evento'));
    var fineEvento = masterclass ? (cdData(cdCampo('data_evento_fine')) || inizioEvento) : inizioEvento;
    var nomeEvento = masterclass ? 'Periodo Masterclass' : 'Data evento';
    var campiEvento = masterclass ? ['data_evento', 'data_evento_fine'] : ['data_evento'];

    var prove = cdIndici('prova_data_').map(function(n) {
      return { n: n, str: cdCampo('prova_data_' + n), data: cdData(cdCampo('prova_data_' + n)) };
    });
    var repliche = masterclass ? [] : cdIndici('replica_data_').map(function(n) {
      return {
        n: n, str: cdCampo('replica_data_' + n), data: cdData(cdCampo('replica_data_' + n)),
        luogo: cdCampo('replica_luogo_' + n), trasporto: cdCampo('replica_trasporto_' + n),
        partenzaStr: cdCampo('replica_partenza_data_' + n), partenza: cdData(cdCampo('replica_partenza_data_' + n)),
        partenzaOra: cdCampo('replica_partenza_ora_' + n),
        rientroStr: cdCampo('replica_rientro_data_' + n), rientro: cdData(cdCampo('replica_rientro_data_' + n)),
        rientroOra: cdCampo('replica_rientro_ora_' + n)
      };
    });
    var concerti = masterclass ? cdIndici('dataconcerto_data_').map(function(n) {
      return { n: n, str: cdCampo('dataconcerto_data_' + n), data: cdData(cdCampo('dataconcerto_data_' + n)) };
    }) : [];
    var prestiti = (isResp && typeof elencoVociInPrestito === 'function') ? elencoVociInPrestito() : [];

    var dateAppuntamenti = [];
    if (inizioEvento) dateAppuntamenti.push(inizioEvento);
    if (fineEvento) dateAppuntamenti.push(fineEvento);
    prove.concat(repliche, concerti).forEach(function(x) { if (x.data) dateAppuntamenti.push(x.data); });
    var primoAppuntamento = cdMin(dateAppuntamenti), ultimoAppuntamento = cdMax(dateAppuntamenti);

    // ── E6 — date non valide ──
    var campiReferente = [['data_evento', masterclass ? 'Inizio Periodo Masterclass' : 'Data evento']];
    if (masterclass) campiReferente.push(['data_evento_fine', 'Fine Periodo Masterclass'], ['alloggio_arrivo', 'Alloggio — arrivo'], ['alloggio_partenza', 'Alloggio — partenza']);
    prove.forEach(function(p) { campiReferente.push(['prova_data_' + p.n, etichettaProva + p.n]); });
    repliche.forEach(function(r) {
      campiReferente.push(['replica_data_' + r.n, 'Replica ' + r.n], ['replica_partenza_data_' + r.n, 'Trasferta Replica ' + r.n + ' — partenza'], ['replica_rientro_data_' + r.n, 'Trasferta Replica ' + r.n + ' — rientro']);
    });
    concerti.forEach(function(c) { campiReferente.push(['dataconcerto_data_' + c.n, 'Concerto ' + c.n]); });
    var campiResp = [];
    if (isResp) {
      campiResp.push(['centralino_ritiro_data', 'Centralino — ritiro materiale'], ['centralino_rientro_data', 'Centralino — rientro materiale']);
      document.querySelectorAll('[name^="determina_"]').forEach(function(el) {
        var m = /^determina_(trasp|nol|trper|pers)_scadenza_data(_\d+)?$/.exec(el.name);
        if (m) campiResp.push([el.name, 'Scadenza offerte ' + CD_SERVIZI[m[1]] + (m[2] ? ' (' + m[2].slice(1) + ')' : '')]);
      });
    }
    campiReferente.concat(campiResp).forEach(function(c) {
      var v = cdCampo(c[0]);
      if (v && !cdData(v)) { err(c[1] + ': "' + v + '" non è una data valida (formato GG/MM/AAAA)', [c[0]]); segnalati[c[0]] = true; }
    });
    prestiti.forEach(function(p) {
      [['ritiroData', 'ritiro'], ['riconsegnaData', 'riconsegna']].forEach(function(x) {
        if (p[x[0]] && !cdData(p[x[0]])) {
          err('Prestito "' + p.label + '" — ' + x[1] + ': "' + p[x[0]] + '" non è una data valida', ['prestito|' + p.label + '|' + x[1]]);
          segnalati['prestito_' + p.label] = true;
        }
      });
    });

    // ── E0 / D0 — data evento rispetto a oggi ──
    if (inizioEvento) {
      if (inizioEvento > cdAggiungiMesi(oggi, CD_MESI_E0)) {
        err(nomeEvento + ' (' + cdFmt(inizioEvento) + ') è a più di ' + CD_MESI_E0 + ' mesi da oggi: controlla l\'anno', ['data_evento']);
      }
      var st = window._statoProgetto || {};
      var attivo = !st.completato && !st.annullato && !st.rimandato;
      var ultimoEvento = cdMax([fineEvento].concat(repliche.map(function(r) { return r.data; }).filter(Boolean)));
      if (attivo && ultimoEvento && ultimoEvento < oggi) {
        att('L\'evento (' + cdFmt(ultimoEvento) + ') è già passato ma il progetto risulta ancora attivo: controlla l\'anno o aggiorna lo stato', campiEvento);
      }
    }

    // ── E1 — date lontane più di 6 mesi dal periodo dell'evento ──
    if (inizioEvento) {
      var limiteInf = cdAggiungiMesi(inizioEvento, -CD_MESI_E1), limiteSup = cdAggiungiMesi(fineEvento, CD_MESI_E1);
      var periodoTesto = cdFmt(inizioEvento) + (fineEvento - inizioEvento ? '–' + cdFmt(fineEvento) : '');
      var fuoriPeriodo = function(chiave, etichetta, d, campo) {
        if (!d || segnalati[chiave]) return;
        if (d < limiteInf || d > limiteSup) {
          err(etichetta + ' (' + cdFmt(d) + ') è a più di ' + CD_MESI_E1 + ' mesi dall\'evento (' + periodoTesto + '): controlla l\'anno', [campo]);
          segnalati[chiave] = true;
        }
      };
      campiReferente.concat(campiResp).forEach(function(c) {
        if (c[0] === 'data_evento' || c[0] === 'data_evento_fine' || c[0].indexOf('determina_') === 0) return;
        fuoriPeriodo(c[0], c[1], cdData(cdCampo(c[0])), c[0]);
      });
      prestiti.forEach(function(p) {
        fuoriPeriodo('prestito_' + p.label, 'Prestito "' + p.label + '" — ritiro', cdData(p.ritiroData), 'prestito|' + p.label + '|ritiro');
        fuoriPeriodo('prestito_' + p.label, 'Prestito "' + p.label + '" — riconsegna', cdData(p.riconsegnaData), 'prestito|' + p.label + '|riconsegna');
      });
    }

    // ── E2 — prestito fuori dal periodo d'uso (Resp) ──
    if (prestiti.length) {
      var tappeUso = haTappe ? cdTappeTrasporto().map(function(t) { return t.data; }).filter(Boolean) : [];
      var primoUso = tappeUso.length ? cdMin(tappeUso) : primoAppuntamento;
      var ultimoUso = tappeUso.length ? cdMax(tappeUso) : ultimoAppuntamento;
      prestiti.forEach(function(p) {
        if (segnalati['prestito_' + p.label]) return;
        var rit = cdData(p.ritiroData), ric = cdData(p.riconsegnaData);
        if (rit && primoUso && rit > primoUso) err('Prestito "' + p.label + '": ritiro (' + cdFmt(rit) + ') dopo il primo utilizzo (' + cdFmt(primoUso) + ')', ['prestito|' + p.label + '|ritiro']);
        if (ric && ultimoUso && ric < ultimoUso) err('Prestito "' + p.label + '": riconsegna (' + cdFmt(ric) + ') prima dell\'ultimo utilizzo (' + cdFmt(ultimoUso) + ')', ['prestito|' + p.label + '|riconsegna']);
      });
    }

    // ── E3 — trasferta della replica (Mod. 1-2) ──
    repliche.forEach(function(r) {
      var nomeP = 'replica_partenza_data_' + r.n, nomeR = 'replica_rientro_data_' + r.n, nomeD = 'replica_data_' + r.n;
      var etichetta = 'Trasferta Replica ' + r.n;
      if (r.partenza && r.rientro && !segnalati[nomeP] && !segnalati[nomeR]) {
        var tP = r.partenza.getTime() + (cdMinuti(r.partenzaOra) || 0) * 60000;
        var tR = r.rientro.getTime() + (cdMinuti(r.rientroOra) || 0) * 60000;
        if (tR < tP) err(etichetta + ': rientro (' + r.rientroStr + (r.rientroOra ? ' ' + r.rientroOra : '') + ') prima della partenza (' + r.partenzaStr + (r.partenzaOra ? ' ' + r.partenzaOra : '') + ')', [nomeP, nomeR]);
      }
      if (r.data && r.partenza && !segnalati[nomeP] && r.partenza > r.data) err(etichetta + ': partenza (' + r.partenzaStr + ') dopo la data della replica (' + r.str + ')', [nomeP, nomeD]);
      if (r.data && r.rientro && !segnalati[nomeR] && r.rientro < r.data) err(etichetta + ': rientro (' + r.rientroStr + ') prima della data della replica (' + r.str + ')', [nomeR, nomeD]);
    });

    // ── E4 / A7 — Masterclass ──
    if (masterclass) {
      var fineDich = cdData(cdCampo('data_evento_fine'));
      if (inizioEvento && fineDich && fineDich < inizioEvento) err('Fine Periodo Masterclass (' + cdFmt(fineDich) + ') prima dell\'inizio (' + cdFmt(inizioEvento) + ')', ['data_evento', 'data_evento_fine']);
      var arr = cdData(cdCampo('alloggio_arrivo')), par = cdData(cdCampo('alloggio_partenza'));
      if (arr && par && par < arr) err('Alloggio: partenza (' + cdFmt(par) + ') prima dell\'arrivo (' + cdFmt(arr) + ')', ['alloggio_arrivo', 'alloggio_partenza']);
      if (inizioEvento) {
        concerti.forEach(function(c) {
          if (!c.data || segnalati['dataconcerto_data_' + c.n]) return;
          if (c.data < cdAggiungiGiorni(inizioEvento, -CD_MARGINE_GIORNI) || c.data > cdAggiungiGiorni(fineEvento, CD_MARGINE_GIORNI)) {
            att('Concerto ' + c.n + ' (' + c.str + ') fuori dal Periodo Masterclass (oltre ' + CD_MARGINE_GIORNI + ' giorni)', ['dataconcerto_data_' + c.n]);
          }
        });
      }
    }

    // ── E5 — prove nel Mod. 4 (nei Mod. 1-3 lo fa già verificaCoerenzaProgetto) ──
    if (modulo === 4) {
      var precedente = null;
      prove.forEach(function(p) {
        if (!p.data || segnalati['prova_data_' + p.n]) return;
        if (precedente && p.data < precedente.data) err('Prova ' + p.n + ' (' + p.str + ') è prima di Prova ' + precedente.n + ' (' + precedente.str + ')', ['prova_data_' + p.n, 'prova_data_' + precedente.n]);
        if (inizioEvento && p.data > inizioEvento) err('Prova ' + p.n + ' (' + p.str + ') è dopo la data dell\'evento (' + cdFmt(inizioEvento) + ')', ['prova_data_' + p.n]);
        precedente = p;
      });
    }

    // ── A6 — replica in altra sede senza persone da trasportare indicate ──
    if (!masterclass) {
      var sedeConcerto = cdNormLuogo(cdCampo('luogo_concerto'));
      repliche.forEach(function(r) {
        if (!r.luogo || !sedeConcerto || cdNormLuogo(r.luogo) === sedeConcerto) return;
        if (r.trasporto === '' && !r.partenzaStr) att('Replica ' + r.n + ' a "' + r.luogo + '" (sede diversa dal concerto): indicare quante persone vanno trasportate (0 se nessuna)', ['replica_trasporto_' + r.n]);
      });
    }

    if (isResp) {
      // ── A1 / A2 / A3 — furgone (Mod. 1-3) ──
      if (haTappe) {
        var tappe = cdTappeTrasporto();
        tappe.forEach(function(t, i) {
          var sede = cdSedeAppuntamento(t.key);
          if (t.dest && sede && cdNormLuogo(t.dest) !== cdNormLuogo(sede)) {
            att('Furgone "' + t.tipo + '": destinazione "' + t.dest + '" diversa dalla sede dell\'appuntamento "' + sede + '"', ['trasp_mat_dest_' + t.key]);
          }
          var mC = cdMinuti(t.consegna), mR = cdMinuti(t.ritiro);
          if (mC !== null && mR !== null && mC === mR) {
            att('Furgone "' + t.tipo + '": consegna e ritiro alla stessa ora (' + t.consegna + ')', ['trasp_mat_furg_consegna_' + t.key, 'trasp_mat_furg_ritiro_' + t.key]);
          }
          var prec = tappe[i - 1];
          if (prec && prec.dataStr && prec.dataStr === t.dataStr && cdNormLuogo(prec.dest) !== cdNormLuogo(t.dest)) {
            var mRprec = cdMinuti(prec.ritiro);
            if (mRprec !== null && mC !== null && mC <= mRprec) {
              att('Furgone ' + t.dataStr + ': consegna a "' + t.dest + '" (' + t.tipo + ', ore ' + t.consegna + ') non dopo il ritiro da "' + prec.dest + '" (' + prec.tipo + ', ore ' + prec.ritiro + ') — manca il tempo di viaggio',
                ['trasp_mat_furg_ritiro_' + prec.key, 'trasp_mat_furg_consegna_' + t.key]);
            }
          }
        });
      }

      // ── A4 — centralino fuori dal periodo prove–evento ±7 giorni ──
      if (primoAppuntamento) {
        var da = cdAggiungiGiorni(primoAppuntamento, -CD_MARGINE_GIORNI), a = cdAggiungiGiorni(ultimoAppuntamento, CD_MARGINE_GIORNI);
        [['centralino_ritiro_data', 'Centralino — ritiro materiale'], ['centralino_rientro_data', 'Centralino — rientro materiale']].forEach(function(c) {
          var d = cdData(cdCampo(c[0]));
          if (!d || segnalati[c[0]]) return;
          if (d < da || d > a) att(c[1] + ' (' + cdFmt(d) + ') fuori dal periodo del progetto (' + cdFmt(primoAppuntamento) + '–' + cdFmt(ultimoAppuntamento) + ', ±' + CD_MARGINE_GIORNI + ' giorni)', [c[0]]);
        });
      }

      // ── A5 — scadenza offerte non prima del primo servizio ──
      var primoServizio = {
        trasp: (function() {
          var d = haTappe ? cdTappeTrasporto().map(function(t) { return t.data; }).filter(Boolean) : [];
          if (!d.length && primoAppuntamento) d.push(primoAppuntamento);
          prestiti.forEach(function(p) {
            if (segnalati['prestito_' + p.label]) return; // data già segnalata come errata: non fa da riferimento
            var r = cdData(p.ritiroData); if (r) d.push(r);
          });
          return cdMin(d);
        })(),
        nol: primoAppuntamento,
        pers: primoAppuntamento,
        trper: cdMin(repliche.map(function(r) { return r.partenza || r.data; }).filter(Boolean)) || primoAppuntamento
      };
      campiResp.forEach(function(c) {
        var m = /^determina_(trasp|nol|trper|pers)_scadenza_data(_\d+)?$/.exec(c[0]);
        if (!m || segnalati[c[0]]) return;
        var sc = cdData(cdCampo(c[0])), primo = primoServizio[m[1]];
        if (sc && primo && sc >= primo) att(c[1] + ' (' + cdFmt(sc) + ') non è prima del primo servizio (' + cdFmt(primo) + ')', [c[0]]);
      });
    }
  } catch (e) {
    console.warn('verificaCongruitaDate — errore non bloccante:', e);
  }
  return { errori: errori, attenzione: attenzione };
}

// ── Voci dell'avviso: dal riferimento al campo vero nella pagina ──

// Messaggi dei controlli già presenti nei moduli (stringhe semplici): ne
// ricavo i campi dal testo, così diventano cliccabili senza toccare i moduli.
function cdCampiDaMessaggio(msg) {
  var m;
  if ((m = /^Prestito "(.+?)": (.*)$/.exec(msg))) {
    var solo = /manca la data di riconsegna|riconsegna \(/.test(m[2]) ? ['riconsegna'] : /manca la data di ritiro/.test(m[2]) ? ['ritiro'] : ['ritiro', 'riconsegna'];
    return solo.map(function(t) { return 'prestito|' + m[1] + '|' + t; });
  }
  if (/^Centralino: /.test(msg)) return ['centralino_ritiro_data', 'centralino_rientro_data'];
  if ((m = /^Furgone "(.+?)": /.exec(msg))) return ['furgone|' + m[1]];
  if ((m = /^Trasferta "(.+?)": /.exec(msg))) return ['trasferta|' + m[1]];
  if ((m = /^(?:Prova|Lezione) (\d+) /.exec(msg))) return ['prova_data_' + m[1]];
  if ((m = /^Replica (\d+) /.exec(msg))) return ['replica_data_' + m[1]];
  return [];
}

// Campi nella riga di tabella che riporta un testo: nelle prime due colonne
// (tappa Trasporti / Trasferta) o come etichetta "— <voce>" (riga Prestito).
function cdCampiInRiga(selettoreCampi, testo) {
  var out = [];
  document.querySelectorAll(selettoreCampi).forEach(function(el) {
    var tr = el.closest('tr');
    if (!tr) return;
    var cella0 = tr.children[0] ? tr.children[0].textContent.trim() : '';
    var cella1 = tr.children[1] ? tr.children[1].textContent.trim() : '';
    if (cella0 === testo || cella1 === testo || tr.textContent.indexOf('— ' + testo) !== -1) out.push(el);
  });
  return out;
}

function cdElementiDaRiferimento(rif) {
  var p = rif.split('|');
  if (p[0] === 'prestito') return cdCampiInRiga('input[name^="dot_prestito_' + p[2] + '_data_"]', p[1]);
  if (p[0] === 'furgone') return cdCampiInRiga('input[name^="trasp_mat_furg_consegna_"], input[name^="trasp_mat_furg_ritiro_"]', p[1]);
  if (p[0] === 'trasferta') return cdCampiInRiga('input[name^="trasp_pers_partenza_"], input[name^="trasp_pers_rientro_"]', p[1]);
  var el = document.querySelector('[name="' + rif + '"]');
  return el ? [el] : [];
}

function cdElementiVoce(voce) {
  var out = [];
  voce.campi.forEach(function(rif) { out = out.concat(cdElementiDaRiferimento(rif)); });
  return out;
}

// Bordo ambra sui campi coinvolti (box-shadow: non tocca il bordo originale né
// l'impaginazione). Prima toglie quello messo al giro precedente.
function cdEvidenziaCampi(voci) {
  document.querySelectorAll('[data-cd-evidenza]').forEach(function(el) {
    el.style.boxShadow = el.getAttribute('data-cd-evidenza') === '-' ? '' : el.getAttribute('data-cd-evidenza');
    el.removeAttribute('data-cd-evidenza');
  });
  voci.forEach(function(voce) {
    cdElementiVoce(voce).forEach(function(el) {
      if (el.hasAttribute('data-cd-evidenza')) return;
      el.setAttribute('data-cd-evidenza', el.style.boxShadow || '-');
      el.style.boxShadow = '0 0 0 2px #F59E0B';
    });
  });
}

// Porta al primo campo della voce: apre sezioni collassate e <details> chiusi
// (come vaiASezione), poi scorre e mette il cursore nel campo.
function cdVaiAVoce(indice) {
  var voce = (window._cdVociAvviso || [])[indice];
  if (!voce) return;
  var el = cdElementiVoce(voce)[0];
  if (!el) return;
  for (var n = el.parentElement; n; n = n.parentElement) {
    if (n.tagName === 'DETAILS') n.open = true;
    if (n.classList && n.classList.contains('section-body') && n.classList.contains('hidden')) {
      n.classList.remove('hidden');
      var header = n.parentElement ? n.parentElement.querySelector('.section-header') : null;
      if (header) header.classList.remove('collapsed');
      if (typeof ricalcolaTextareaSezione === 'function') ricalcolaTextareaSezione(n);
    }
  }
  var bersaglio = el;
  while (bersaglio && bersaglio.offsetParent === null && bersaglio.parentElement) bersaglio = bersaglio.parentElement; // riga nascosta: scorro al primo contenitore visibile
  bersaglio.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { el.focus({ preventScroll: true }); } catch (e) {}
}

function cdEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Riquadro ambra unico: prima gli errori probabili, poi i punti da verificare.
// Accetta anche le stringhe dei controlli già presenti nei moduli. Restituisce
// '' se non c'è nulla da segnalare (e toglie comunque i bordi ambra rimasti).
function htmlAvvisoCoerenzaDate(errori, daVerificare) {
  var norm = function(v) { return typeof v === 'string' ? { testo: v, campi: cdCampiDaMessaggio(v) } : v; };
  errori = errori.map(norm);
  daVerificare = daVerificare.map(norm);
  var voci = errori.concat(daVerificare);
  window._cdVociAvviso = voci;
  cdEvidenziaCampi(voci);
  if (!voci.length) return '';
  var indice = 0;
  var lista = function(elenco) {
    return '<ul style="margin:4px 0 0 16px;padding:0">' + elenco.map(function(v) {
      var i = indice++;
      var cliccabile = cdElementiVoce(v).length > 0;
      return '<li' + (cliccabile ? ' onclick="cdVaiAVoce(' + i + ')" style="cursor:pointer;text-decoration:underline dotted" title="Vai al campo"' : '') + '>' + cdEscape(v.testo) + '</li>';
    }).join('') + '</ul>';
  };
  var html = '<div style="background:#FFF3E0;border:1px solid #FFCC80;border-radius:6px;padding:8px 12px;font-size:11px;color:#8B4A00">' +
    '⚠ Date/orari da verificare (non bloccante — potrebbe essere corretto così). Clicca una voce per andare al campo.';
  if (errori.length) html += '<div style="margin-top:6px;font-weight:700">Errori probabili</div>' + lista(errori);
  if (daVerificare.length) html += (errori.length ? '<div style="margin-top:6px;font-weight:700">Da verificare</div>' : '') + lista(daVerificare);
  return html + '</div>';
}
