// ═══════════════════════════════════════════════════════════════════
// determina-legale.js — Testo legale condiviso per le Determine
// Conservatorio "G. Briccialdi" — Terni
//
// Caricato da Modulo_1_SinfonicoCORALE.html, Modulo_2_PiccoloConcerto.html
// e Modulo_3_Masterclass.html (NON da Modulo_4_EventoIstituzionale.html,
// che ha un modello dati strutturalmente diverso — niente Furgone/Trasporti
// Materiale — e mantiene la propria versione locale di
// generaBozzaDeterminaTrasporti).
//
// generaBozzaDeterminaNoleggio() è invece condivisa da TUTTI E 4 i moduli.
//
// Ogni modulo chiamante passa un secondo parametro cfgSezioni con i
// riferimenti "Sezione X" corretti per la propria numerazione (che
// differisce da modulo a modulo):
//   Mod.1: { sezioneDotazione: 'Sezione 5A', sezioneTrasporti: 'Sezione 5B' }
//   Mod.2: { sezioneDotazione: 'Sezione 5A', sezioneTrasporti: 'Sezione 5B' }
//   Mod.3: { sezioneDotazione: 'Sezione 6A', sezioneTrasporti: 'Sezione 6C' }
//   Mod.4: { sezioneDotazione: 'Sezione 3' }  (solo Noleggio)
//
// Richiede che il file chiamante definisca già: getField, escapeHTML,
// formattaDataItaliana, metadati, dati_referente, dati_responsabile,
// elencoVociInPrestito, costruisciTratteConPrestito, leggiRigheTrasportoSelezionate
// (dove applicabile) — esattamente come già fanno tutti i moduli.
//
// Decisioni di contenuto confermate da Marco Gatti (03/09/2026):
//  - "e strumenti musicali" sempre presente nell'oggetto Trasporti
//  - formulazione CONSIDERATO/CONSIDERATA: quella storica di Modulo 1
//    ("...affidamento del servizio di trasporto di materiale didattico..."
//     e "...preventivo per la fornitura del servizio di trasporto
//     materiale didattico...")
// ═══════════════════════════════════════════════════════════════════

function costruisciTestoDeterminaTrasporti(cfg) {
  var scelto = cfg.scelto;
  var preventivi = cfg.preventivi;
  var importoScelto = parseImportoIt(scelto.importo);
  var nomeRUP = (!isNaN(importoScelto) && importoScelto < 5000) ? 'Dott.ssa Alessandra Angelucci' : 'Dott.ssa Susanna Fanizza';
  var ivaCalcolata = isNaN(importoScelto) ? NaN : importoScelto * 0.22;
  var totaleConIva = isNaN(importoScelto) ? NaN : importoScelto * 1.22;
  var lines = [];
  lines.push('Amministrazione');
  lines.push('');
  lines.push('Terni, [___ data Determina ___]');
  lines.push('');
  lines.push('Determina n. [___ N. Determina ___]/[___ anno ___]');
  lines.push('');
  lines.push('OGGETTO: Decisione a contrarre, impegno di spesa e contestuale affidamento diretto per il servizio di trasporto materiale didattico (arredi e attrezzature) e strumenti musicali in occasione ' + cfg.fraseOggetto + '.');
  lines.push('');
  lines.push('CIG [___ CIG ___]');
  lines.push('');
  lines.push('IL DIRETTORE AMMINISTRATIVO');
  lines.push('');
  lines.push('PREMESSO che');
  lines.push('');
  lines.push('il Conservatorio Statale di Musica "Giulio Briccialdi" di Terni organizza, nell\'ambito della propria missione istituzionale di promozione e diffusione della cultura musicale, ' + cfg.frasePremesso + ';');
  lines.push('');
  lines.push('l\'obiettivo principale è promuovere la cultura musicale e il ruolo del Conservatorio quale istituzione di alta formazione artistica sul territorio;');
  lines.push('');
  lines.push('che il servizio deve svolgersi nel rispetto dei criteri ambientali minimi di cui ai Decreti Ministeriali vigenti adottati nell\'ambito di quanto stabilito dal Piano per la sostenibilità ambientale dei consumi del settore della pubblica amministrazione;');
  lines.push('');
  lines.push('che per garantire il regolare svolgimento ' + cfg.eventoRichiamatoTxt + ' è necessario procedere all\'affidamento del servizio di trasporto di materiale didattico di cui in oggetto;');
  lines.push('');
  lines.push('CONSIDERATA la richiesta di preventivo per la fornitura del servizio di trasporto materiale didattico ns. prot. n. ' + protRichiesta + ', trasmessa tramite piattaforma di e-procurement TRASPARE a mezzo PEC, con termine di presentazione delle offerte fissato alle ore ' + scadenzaOraRichiesta + ' del ' + scadenzaDataRichiesta + ';');
  lines.push('');
  lines.push('RAVVISATA la necessità di supportare la realizzazione ' + cfg.realizzazioneEventoTxt + ' con il materiale didattico necessario;');
  lines.push('');
  lines.push('CONSIDERATO che, entro il termine sopra indicato sono pervenute n. ' + preventivi.length + ' offerta/e dalle seguenti ditte:');
  lines.push('');
  preventivi.forEach(function(p) {
    lines.push('- ditta ' + p.ditta + ', con sede in ' + (p.indirizzo || '[___ indirizzo ___]') + ' (P.IVA/C.F. ' + (p.piva || '[___ P.IVA/C.F. ___]') + '), acquisita al prot. n. ' + (p.prot || '[___ prot. ___]') + (p.data ? ' del ' + p.data : ' del [___ data ___]') + ', per un importo di € ' + p.importo + ' oltre IVA;');
  });
  lines.push('CONSIDERATO che le offerte pervenute risultano [___ di pari importo / di importo diverso — completare a cura di Acquisti/Ragioneria ___] e che, ' + (!isNaN(importoScelto) && importoScelto < 5000 ? 'trattandosi di affidamento di importo inferiore a € 5.000,00, non ricorre l\'obbligo di applicazione del principio di rotazione ai sensi dell\'art. 49, comma 6, del D.Lgs. 36/2023, ma che il RUP ha ritenuto opportuno applicarlo comunque in via facoltativa, in ossequio ai principi generali di cui all\'art. 1 e all\'art. 49, commi 1 e 2, del medesimo Codice [___ completare motivazione scelta operatore, se applicabile ___];' : 'nel rispetto del principio di rotazione degli affidamenti di cui all\'art. 49 del D.Lgs. 36/2023;'));
  lines.push('');
  lines.push('CONSIDERATO che la ditta ' + scelto.ditta + ' si è resa disponibile a svolgere il servizio alle condizioni economiche congrue e con le modalità richieste da questo Ente;');
  lines.push('');
  lines.push('ACCERTATO che la citata tipologia di servizio non risulta essere presente in alcuna convenzione di Consip S.p.A.;');
  lines.push('');
  lines.push('DATO ATTO che l\'affidamento in parola si connota come acquisizione di modesto importo, non rilevante rispetto alle dinamiche concorrenziali del settore di riferimento;');
  lines.push('');
  if (isNaN(importoScelto)) {
    lines.push('⚠ Importo non riconosciuto — verificare il formato (es. 850,00) prima di inviare.');
  } else if (importoScelto >= 140000) {
    lines.push('⚠ ATTENZIONE: importo pari o superiore a € 140.000 — la procedura di affidamento diretto non è gestita da questo sistema. Verificare con Acquisti/RUP la procedura corretta prima di procedere.');
  } else {
    lines.push('DATO ATTO di procedere all\'affidamento diretto ai sensi dell\'art. 50, comma 1, lett. b), D.Lgs. 36/2023 per il servizio di quanto indicato in premessa, attraverso piattaforma certificata e-procurement TRASPARE che interopera con le piattaforme CP e DND dell\'ANAC;');
  }
  lines.push('');
  lines.push('PRESO ATTO che il n. ID Appalto è il seguente: [___ ID Appalto ___];');
  lines.push('');
  lines.push('DATO ATTO che l\'esecuzione delle spese soggette alla tracciabilità dei flussi finanziari sarà conforme a quanto previsto dall\'art. 3, Legge 136/2010 e dagli artt. 6 e 7, Legge 217/2010;');
  lines.push('');
  lines.push('CONSIDERATA l\'affidabilità della ' + scelto.ditta + ' e verificato che non sussistono annotazioni sull\'operatore attraverso l\'accesso alla Banca dati nazionale dei contratti pubblici, con consultazione del Fascicolo Virtuale degli Operatori Economici presso ANAC, che consente le verifiche sulle cause di esclusione di cui agli artt. 94 e 95 del Codice dei contratti pubblici, nonché la regolarità contributiva e previdenziale, la regolarità fiscale e l\'insussistenza di procedure concorsuali, come da documentazione acquisita agli atti [___ da completare a cura di Acquisti/Ragioneria ___];');
  lines.push('');
  lines.push('DATO ATTO, ai sensi dell\'art. 17 del D.Lgs. 36/2023 e dell\'art. 192 del TUEL, che il presente procedimento è finalizzato alla stipulazione di un contratto per l\'affidamento di che trattasi le cui caratteristiche essenziali sono qui riassunte:');
  lines.push('');
  lines.push('– Fine che con il contratto si intende perseguire e relativo oggetto:');
  lines.push('');
  lines.push('Trasporto di materiale didattico (arredi e attrezzature), come da offerta della ditta ' + scelto.ditta + (scelto.prot ? ' prot. n. ' + scelto.prot : '') + ':');
  lines.push('');
  if (cfg.calendarioLines.length === 0) {
    lines.push('[___ ' + cfg.messaggioNessunaTappa + ' — completare prima di inviare ___]');
  } else {
    lines.push('Il piano di trasporto è basato sul seguente calendario (' + cfg.calendarioLines.length + ' movimentazioni complessive):');
    lines.push('');
    cfg.calendarioLines.forEach(function(riga) { lines.push(riga); });
  }
  lines.push('');
  lines.push('– Importo del contratto:');
  lines.push('');
  lines.push('€ ' + scelto.importo + ' oltre IVA split payment;');
  lines.push('');
  lines.push('– Forma del contratto:');
  lines.push('');
  lines.push('ai sensi dell\'art. 18, comma 1, secondo periodo, del D.Lgs. n. 36/2023, trattandosi di affidamento ai sensi dell\'art. 50 del medesimo decreto, mediante corrispondenza secondo l\'uso commerciale, consistente in un apposito scambio di lettere, anche tramite posta elettronica certificata o sistemi elettronici di recapito certificato qualificato ai sensi del regolamento UE n. 910/2014;');
  lines.push('');
  lines.push('– Modalità di scelta del contraente:');
  lines.push('');
  lines.push('affidamento diretto ai sensi dell\'art. 50 del D.Lgs. 36/2023;');
  lines.push('');
  lines.push('– Clausole ritenute essenziali:');
  lines.push('');
  lines.push('quelle contenute nella corrispondenza intercorsa tra le parti e nella documentazione della procedura di affidamento;');
  lines.push('');
  lines.push('CONSIDERATO che, all\'esito della verifica istruttoria condotta dall\'ufficio, il costo del servizio è da ritenersi congruo rispetto ai valori di mercato per servizi analoghi nel territorio provinciale di Terni, tenuto conto della specificità del carico [___ e delle eventuali condizioni particolari — completare a cura di Acquisti/Ragioneria ___]; si ritiene pertanto economicamente vantaggioso procedere all\'affidamento;');
  lines.push('');
  lines.push('VISTO l\'art. 48, comma 3, D.Lgs. 36/2023 che afferma l\'obbligo di utilizzo di strumenti informatici e di negoziazione previsti dalle vigenti disposizioni in materia di contenimento della spesa;');
  lines.push('');
  lines.push('VISTO che la motivazione per procedere all\'affidamento diretto è la garanzia dell\'economicità dell\'acquisto dalla circostanza che il costo è stato oggetto di analisi istruttoria che ha permesso di rilevarne la congruità con i parametri di qualità/prezzo dei valori medi di mercato;');
  lines.push('');
  lines.push('TENUTO CONTO altresì che viene al contempo rispettato il principio dell\'efficacia perché l\'affidamento non è assegnato esclusivamente in ragione della convenienza del prestatore, ma per rispondere alle esigenze dell\'Ente;');
  lines.push('');
  lines.push('VISTA la delibera del Consiglio di Amministrazione n. [___ N. Delibera Bilancio ___] del [___ data ___] di approvazione del Bilancio di Previsione e.f. [___ anno ___];');
  lines.push('');
  lines.push('VISTO e ritenuto pertanto necessario provvedere a un impegno di spesa pari a € ' + scelto.importo + ' oltre IVA split payment, data la disponibilità sull\'U.P.B. 1.2.1 art. 255 "Produzione artistica e ricerca";');
  lines.push('');
  lines.push('DETERMINA');
  lines.push('');
  lines.push('Di procedere all\'affidamento diretto per le motivazioni espresse in premessa, che si intendono integralmente riportate, del servizio di trasporto materiale didattico (arredi e attrezzature)' + cfg.fraseDeterminaFinale + ', alla Ditta ' + scelto.ditta + ', ' + (scelto.indirizzo || '[___ indirizzo completo ___]') + ', P.IVA/C.F. ' + (scelto.piva || '[___ P.IVA/C.F. ___]') + ', alle condizioni previste nell\'offerta prot. n. ' + (scelto.prot || '[___ prot. ___]') + ' e specificamente euro [___ importo in lettere ___]/00 (€ ' + scelto.importo + ') oltre IVA split payment;');
  lines.push('');
  lines.push('di impegnare la somma complessiva di € ' + formattaImportoIt(totaleConIva) + ', di cui € ' + formattaImportoIt(ivaCalcolata) + ' per IVA al 22% in regime di split payment, dando atto che la liquidazione della spesa avverrà con successivo e separato provvedimento, previa verifica della regolare esecuzione del servizio e ricezione di regolare fattura elettronica;');
  lines.push('');
  lines.push('che la spesa da imputare graverà sull\'U.P.B. 1.2.1 art. 255 "Produzione artistica e ricerca" di cui si attesta la disponibilità;');
  lines.push('');
  lines.push('di nominare ' + nomeRUP + ' quale Responsabile Unico del Progetto, ai sensi dell\'art. 15 del D.Lgs. 36/2023 e ss.mm.ii., che dovrà vigilare sullo svolgimento delle fasi di affidamento ed esecuzione della fornitura in parola, provvedendo a creare le condizioni affinché il processo di acquisto risulti condotto in modo unitario rispetto alle esigenze ed ai costi indicati nel presente atto, in conformità a qualsiasi altra disposizione di legge e di regolamento in materia ivi incluso l\'accertamento dei requisiti di carattere generale e tecnico-professionali, ove richiesti, in capo all\'operatore economico individuato; le funzioni di Direttore dell\'Esecuzione del Contratto sono svolte dal medesimo ' + nomeRUP + ' in qualità di RUP, ai sensi dell\'art. 114, comma 3, del D.Lgs. n. 36/2023, data la modesta entità e la limitata complessità del contratto;');
  lines.push('');
  lines.push('che il contratto si debba considerare sciolto nel caso il Responsabile Unico del Progetto rilevi la carenza del possesso dei prescritti requisiti.');
  lines.push('');
  lines.push('Per la copertura finanziaria');
  lines.push('');
  lines.push('Il Direttore amministrativo\tIl Direttore di ragioneria');
  lines.push('');
  lines.push('Dott.ssa Fanizza Susanna\tDott.ssa Angelucci Alessandra');
  lines.push('');
  lines.push('Documento informatico firmato digitalmente ai sensi dell\'art. 24 del D.Lgs. 82/2005 e ss.mm.ii. Pubblicato sul sito internet www.briccialditerni.it alla voce – "Amministrazione Trasparente" – "Bandi di Gara Contratti" e sulla Piattaforma digitale TRASPARE certificata e-procurement interoperabile con le Piattaforme ANAC al seguente link https://briccialditerni.traspare.com');

  return lines;
}

function generaBozzaDeterminaTrasporti(istanza, cfgSezioni) {
  cfgSezioni = cfgSezioni || {};
  var sezTrasp = cfgSezioni.sezioneTrasporti || 'Sezione 5B';
  istanza = istanza || 1;
  var suf = istanza > 1 ? '_' + istanza : '';
  var tagRigaTrasp = 'prevtrasp' + (istanza > 1 ? istanza : '');
  var tbodyIdPrevTrasp = 'preventivi-trasporti-body' + suf;
  var preventivi = [];
  var scelto = null;
  document.querySelectorAll('#' + tbodyIdPrevTrasp + ' tr[data-riga="' + tagRigaTrasp + '"]').forEach(function(row) {
    var ditta = row.querySelector('[data-f="ditta"]');
    var importo = row.querySelector('[data-f="importo"]');
    var prot = row.querySelector('[data-f="prot"]');
    var dataP = row.querySelector('[data-f="data"]');
    var indirizzo = row.querySelector('[data-f="indirizzo"]');
    var piva = row.querySelector('[data-f="piva"]');
    var sceltoCb = row.querySelector('[data-f="scelto"]');
    var v = { ditta: ditta ? ditta.value.trim() : '', importo: importo ? importo.value.trim() : '', prot: prot ? prot.value.trim() : '', data: dataP ? dataP.value.trim() : '', indirizzo: indirizzo ? indirizzo.value.trim() : '', piva: piva ? piva.value.trim() : '' };
    if (!v.ditta && !v.importo) return;
    preventivi.push(v);
    if (sceltoCb && sceltoCb.checked) scelto = v;
  });

  var righeSelezionateBD = [];
  document.querySelectorAll('#trasporti-materiale-tbody tr').forEach(function(row) {
    var cb = row.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;
    var tipo = row.children[1] ? row.children[1].textContent.trim() : '';
    var data = row.children[2] ? row.children[2].textContent.trim() : '';
    var destInput = row.children[4] ? row.children[4].querySelector('input') : null;
    var dest = destInput ? destInput.value.trim() : '';
    var materialeInput = row.children[5] ? row.children[5].querySelector('input, textarea') : null;
    var materiale = materialeInput ? materialeInput.value.trim() : '';
    var partenzaInput = row.children[6] ? row.children[6].querySelector('input') : null;
    var consegnaInput = row.children[7] ? row.children[7].querySelector('input') : null;
    var ritiroInput = row.children[8] ? row.children[8].querySelector('input') : null;
    var rientroInput = row.children[9] ? row.children[9].querySelector('input') : null;
    righeSelezionateBD.push({
      tipo: tipo, data: data, dest: dest, materiale: materiale,
      partenza: partenzaInput ? partenzaInput.value.trim() : '',
      consegna: consegnaInput ? consegnaInput.value.trim() : '',
      ritiro: ritiroInput ? ritiroInput.value.trim() : '',
      rientroTappa: rientroInput ? rientroInput.value.trim() : ''
    });
  });

  if (preventivi.length === 0) {
    alert('Nessun preventivo registrato. Aggiungi almeno un preventivo ricevuto prima di generare la bozza — la Determina non deve mai precedere i preventivi.');
    return;
  }
  if (!scelto) {
    alert('Nessun preventivo indicato come "Scelto". Spunta quale preventivo si intende affidare.');
    return;
  }

  var protRichiesta = getField('determina_trasp_prot_richiesta' + suf) || '[___ N. Protocollo Richiesta ___]';
  var scadenzaOraRichiesta = getField('determina_trasp_scadenza_ora' + suf) || '[___ ora scadenza offerte ___]';
  var scadenzaDataRichiesta = getField('determina_trasp_scadenza_data' + suf) || '[___ data scadenza offerte ___]';
  var dataEventoTesto = getField('dataconcerto_data_1') || getField('data_evento') || '';
  var luogoEventoTesto = getField('luogo_concerto') || '';
  var calendarioLines = [];
  var movimentiD = costruisciTratteConPrestito(righeSelezionateBD);
  movimentiD.forEach(function(m) {
    var riga = '– ' + (m.giorno || 'data da definire') + (m.haOrario ? ' ' + m.orarioTesto : '') + ': ' + (m.appuntamento || (m.tipo === 'rientro' ? 'rientro' : 'trasferimento')) + ' — da ' + m.da + ' a ' + m.a + ';';
    if (m.materiale) riga = riga.slice(0, -1) + ' — materiale: ' + m.materiale + ';';
    calendarioLines.push(riga);
  });
  if (righeSelezionateBD.length === 0 && elencoVociInPrestito().length === 0) calendarioLines = [];

  var cfg = {
    fraseOggetto: (metadati.titolo ? 'del progetto "' + metadati.titolo + '"' : 'dell\'evento') + (dataEventoTesto ? ' del giorno ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    frasePremesso: (metadati.titolo ? '"' + metadati.titolo + '"' : 'l\'evento in oggetto') + (dataEventoTesto ? ', in programma il giorno ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    eventoRichiamatoTxt: 'dell\'evento richiamato',
    realizzazioneEventoTxt: 'dell\'evento',
    fraseDeterminaFinale: (dataEventoTesto ? ' per l\'evento del ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    protRichiesta: protRichiesta,
    scadenzaOraRichiesta: scadenzaOraRichiesta,
    scadenzaDataRichiesta: scadenzaDataRichiesta,
    preventivi: preventivi,
    scelto: scelto,
    calendarioLines: calendarioLines,
    messaggioNessunaTappa: 'nessuna tappa spuntata in ' + sezTrasp
  };
  var lines = costruisciTestoDeterminaTrasporti(cfg);
  document.getElementById('testo-determina-trasporti').value = lines.join('\n');
  autoResizeTextarea(document.getElementById('testo-determina-trasporti'));
  if (!registraRichiestaGenerata('determina_trasporti' + suf, 'Determina Trasporti' + (istanza > 1 ? ' — Istanza ' + istanza : ''))) return;
  var titElT = document.getElementById('titolo-modal-determina-trasporti');
  if (titElT) titElT.textContent = 'Bozza Determina — Trasporti' + (istanza > 1 ? ' — Istanza ' + istanza : '');
  document.getElementById('modal-determina-trasporti').style.display = 'block';
}

function costruisciTestoDeterminaNoleggio(cfg) {
  var scelto = cfg.scelto;
  var preventivi = cfg.preventivi;
  var importoScelto = parseImportoIt(scelto.importo);
  var nomeRUP = (!isNaN(importoScelto) && importoScelto < 5000) ? 'Dott.ssa Alessandra Angelucci' : 'Dott.ssa Susanna Fanizza';
  var ivaCalcolata = isNaN(importoScelto) ? NaN : importoScelto * 0.22;
  var totaleConIva = isNaN(importoScelto) ? NaN : importoScelto * 1.22;
  var lines = [];
  lines.push('Amministrazione');
  lines.push('');
  lines.push('Terni, [___ data Determina ___]');
  lines.push('');
  lines.push('Determina n. [___ N. Determina ___]/[___ anno ___]');
  lines.push('');
  lines.push('OGGETTO: Decisione a contrarre, impegno di spesa e contestuale affidamento diretto per la fornitura di beni e/o servizi in occasione ' + cfg.fraseOggetto + '.');
  lines.push('');
  lines.push('CIG [___ CIG ___]');
  lines.push('');
  lines.push('IL DIRETTORE AMMINISTRATIVO');
  lines.push('');
  lines.push('PREMESSO che');
  lines.push('');
  lines.push('il Conservatorio Statale di Musica "Giulio Briccialdi" di Terni organizza, nell\'ambito della propria missione istituzionale di promozione e diffusione della cultura musicale, ' + cfg.frasePremesso + ';');
  lines.push('');
  lines.push('l\'obiettivo principale è promuovere il sentimento di appartenenza e orgoglio verso la cultura musicale attraverso l\'evento in oggetto;');
  lines.push('');
  lines.push('che il servizio deve svolgersi nel rispetto dei criteri ambientali minimi di cui ai Decreti Ministeriali vigenti adottati nell\'ambito di quanto stabilito dal Piano per la sostenibilità ambientale dei consumi del settore della pubblica amministrazione;');
  lines.push('');
  lines.push('che per garantire il regolare funzionamento amministrativo-didattico del Conservatorio è necessario l\'acquisto di beni e servizi;');
  lines.push('');
  lines.push('si rende necessario procedere all\'affidamento del servizio di cui in oggetto al fine di consentire lo svolgimento ' + cfg.eventoRichiamatoTxt + ';');
  lines.push('');
  lines.push('TENUTO CONTO della Delibera del Consiglio Accademico ' + (metadati.delibera ? 'n. ' + metadati.delibera + (metadati.data_delibera ? ' del ' + metadati.data_delibera : '') : '[___ N. Delibera ___]') + ' di approvazione ' + cfg.approvazioneEventoTxt + ';');
  lines.push('');
  lines.push('RAVVISATA come da richieste inviate, via e-mail, dal Responsabile Produzione avente prot. ' + protRichiesta + ', la necessità di supportare la realizzazione ' + cfg.realizzazioneEventoTxt + ' con la fornitura di quanto segue:');
  lines.push('');
  cfg.elencoNoleggio.forEach(function(v) { lines.push('- ' + v + ';'); });
  lines.push('');
  lines.push('CONSIDERATA la richiesta di preventivo di fornitura del servizio ns. prot. ' + protRichiesta + ', trasmessa tramite piattaforma di e-procurement TRASPARE a mezzo PEC, con termine di presentazione delle offerte fissato alle ore ' + scadenzaOraRichiesta + ' del ' + scadenzaDataRichiesta + ';');
  lines.push('');
  lines.push('CONSIDERATO che, entro il termine sopra indicato sono pervenute n. ' + preventivi.length + ' offerta/e dalle seguenti ditte:');
  lines.push('');
  preventivi.forEach(function(p) {
    lines.push('- ditta ' + p.ditta + ', con sede in [___ indirizzo ___] (P.IVA/C.F. [___ P.IVA/C.F. ___]), acquisita al prot. n. ' + (p.prot || '[___ prot. ___]') + (p.data ? ' del ' + p.data : ' del [___ data ___]') + ', per un importo di € ' + p.importo + ' oltre IVA;');
    lines.push('');
  });
  lines.push('CONSIDERATO che la ditta ' + scelto.ditta + ' si è resa disponibile a svolgere il servizio alle condizioni economiche più vantaggiose e con le modalità richieste da questo Ente;');
  lines.push('');
  lines.push('ACCERTATO che la citata tipologia di servizio non risulta essere presente in alcuna convenzione di Consip S.p.A.;');
  lines.push('');
  lines.push('DATO ATTO che l\'affidamento in parola si connota come acquisizione di modesto importo, non rilevante rispetto alle dinamiche concorrenziali del settore di riferimento;');
  lines.push('');
  if (isNaN(importoScelto)) {
    lines.push('⚠ Importo non riconosciuto — verificare il formato (es. 850,00) prima di inviare.');
  } else if (importoScelto >= 140000) {
    lines.push('⚠ ATTENZIONE: importo pari o superiore a € 140.000 — la procedura di affidamento diretto non è gestita da questo sistema. Verificare con Acquisti/RUP la procedura corretta prima di procedere.');
  } else {
    lines.push('DATO ATTO di procedere all\'affidamento diretto ai sensi dell\'art. 50, comma 1, lett. b), D.Lgs. 36/2023 per il servizio di quanto indicato in premessa, attraverso piattaforma certificata e-procurement TRASPARE che interopera con le piattaforme CP e DND dell\'ANAC;');
  }
  lines.push('');
  lines.push('PRESO ATTO che il n. ID Appalto è il seguente: [___ ID Appalto ___];');
  lines.push('');
  lines.push('DATO ATTO che l\'esecuzione delle spese soggette alla tracciabilità dei flussi finanziari sarà conforme a quanto previsto dall\'art. 3, Legge 136/2010 e dagli artt. 6 e 7, Legge 217/2010;');
  lines.push('');
  lines.push('CONSIDERATA l\'affidabilità della ' + scelto.ditta + ', per le sue documentate esperienze pregresse [___ se applicabile — completare a cura di Acquisti/Ragioneria ___] e verificato che non sussistono annotazioni sull\'operatore attraverso l\'accesso alla Banca dati nazionale dei contratti pubblici, con consultazione del Fascicolo Virtuale degli Operatori Economici presso ANAC, che consente le verifiche sulle cause di esclusione di cui agli artt. 94 e 95 del Codice dei contratti pubblici, nonché la regolarità contributiva e previdenziale attraverso il DURC;');
  lines.push('');
  lines.push('ACCERTATA, ai sensi di quanto specificamente previsto dall\'art. 49 (Principio di rotazione degli affidamenti), comma 6, del D.Lgs. 36/2023 e successivo D.Lgs. n. 209/2024, la possibilità di derogare al principio di rotazione degli affidamenti in quanto trattasi di affidamento ' + (!isNaN(importoScelto) && importoScelto < 5000 ? 'al di sotto dei 5.000,00 euro' : '[___ verificare applicabilità deroga — importo pari o superiore a € 5.000 ___]') + ';');
  lines.push('');
  lines.push('DATO ATTO, ai sensi dell\'art. 17 del D.Lgs. 36/2023 e dell\'art. 192 del TUEL, che il presente procedimento è finalizzato alla stipulazione di un contratto per l\'affidamento di che trattasi le cui caratteristiche essenziali sono qui riassunte:');
  lines.push('');
  lines.push('– Fine che con il contratto si intende perseguire e relativo oggetto:');
  lines.push('');
  lines.push('Fornitura di beni/servizi' + cfg.fraseFornitura + ', come da offerta della ditta ' + scelto.ditta + (scelto.prot ? ' prot. n. ' + scelto.prot : '') + ':');
  lines.push('');
  cfg.elencoNoleggio.forEach(function(v) { lines.push('- ' + v + ';'); });
  lines.push('');
  lines.push('– Importo del contratto:');
  lines.push('');
  lines.push('€ ' + scelto.importo + ' oltre IVA split payment;');
  lines.push('');
  lines.push('– Forma del contratto:');
  lines.push('');
  lines.push('ai sensi dell\'art. 18, comma 1, secondo periodo, del D.Lgs. n. 36/2023, trattandosi di affidamento ai sensi dell\'art. 50 del medesimo decreto, mediante corrispondenza secondo l\'uso commerciale, consistente in un apposito scambio di lettere, anche tramite posta elettronica certificata o sistemi elettronici di recapito certificato qualificato ai sensi del regolamento UE n. 910/2014 del Parlamento europeo e del Consiglio del 23 luglio 2014;');
  lines.push('');
  lines.push('– Modalità di scelta del contraente:');
  lines.push('');
  lines.push('affidamento diretto ai sensi dell\'art. 50 del D.Lgs. 36/2023;');
  lines.push('');
  lines.push('– Clausole ritenute essenziali:');
  lines.push('');
  lines.push('quelle contenute nella corrispondenza intercorsa tra le parti e nella documentazione della procedura di affidamento;');
  lines.push('');
  lines.push('CONSIDERATO che il costo del servizio è da ritenersi conveniente, considerata la congruità del prezzo e che una qualsiasi forma di gara o indagine di mercato sarebbe antieconomica in relazione all\'eventuale risparmio, confrontato con il tempo e l\'impegno delle strutture dedicate allo scopo;');
  lines.push('');
  lines.push('VISTO l\'art. 48, comma 3, D.Lgs. 36/2023 che afferma l\'obbligo di utilizzo di strumenti informatici e di negoziazione previsti dalle vigenti disposizioni in materia di contenimento della spesa;');
  lines.push('');
  lines.push('VISTO che la motivazione per procedere all\'affidamento diretto è la garanzia dell\'economicità dell\'acquisto dalla circostanza che il costo è stato oggetto di analisi istruttoria che ha permesso di rilevarne la congruità con i parametri di qualità/prezzo dei valori medi di mercato;');
  lines.push('');
  lines.push('TENUTO CONTO altresì che viene al contempo rispettato il principio dell\'efficacia perché l\'affidamento non è assegnato esclusivamente in ragione della convenienza del prestatore, ma per rispondere alle esigenze dell\'Ente;');
  lines.push('');
  lines.push('VISTA la delibera del Consiglio di Amministrazione n. [___ N. Delibera Bilancio ___] del [___ data ___] di approvazione del Bilancio di Previsione e.f. [___ anno ___];');
  lines.push('');
  lines.push('VISTO e ritenuto pertanto necessario provvedere a un impegno di spesa pari a € ' + scelto.importo + ' oltre IVA split payment, data la disponibilità sull\'U.P.B. 1.2.1 art. 255 "Produzione artistica e ricerca";');
  lines.push('');
  lines.push('DETERMINA');
  lines.push('');
  lines.push('Di procedere all\'affidamento diretto per le motivazioni espresse in premessa, che si intendono integralmente riportate, della fornitura di beni/servizi' + cfg.fraseDeterminaFinale + ', alla ' + scelto.ditta + ', [___ indirizzo completo ___], P.IVA/C.F. [___ P.IVA/C.F. ___], alle condizioni previste nell\'offerta prot. n. ' + (scelto.prot || '[___ prot. ___]') + ' e specificamente euro [___ importo in lettere ___]/00 (€ ' + scelto.importo + ') oltre IVA split payment;');
  lines.push('');
  lines.push('di impegnare la somma complessiva di € ' + formattaImportoIt(totaleConIva) + ', di cui € ' + formattaImportoIt(ivaCalcolata) + ' per IVA al 22% in regime di split payment, dando atto che la liquidazione della spesa avverrà con successivo e separato provvedimento, previa verifica della regolare esecuzione del servizio e ricezione di regolare fattura elettronica;');
  lines.push('');
  lines.push('che la spesa da imputare graverà sull\'U.P.B. 1.2.1 art. 255 "Produzione artistica e ricerca" di cui si attesta la disponibilità;');
  lines.push('');
  lines.push('di nominare ' + nomeRUP + ' quale Responsabile Unico del Procedimento, ai sensi dell\'art. 15 del D.Lgs. 36/2023 e ss.mm.ii., che dovrà vigilare sullo svolgimento delle fasi di affidamento ed esecuzione della fornitura in parola, provvedendo a creare le condizioni affinché il processo di acquisto risulti condotto in modo unitario rispetto alle esigenze ed ai costi indicati nel presente atto, in conformità a qualsiasi altra disposizione di legge e di regolamento in materia ivi incluso l\'accertamento dei requisiti di carattere generale e tecnico-professionali, ove richiesti, in capo all\'operatore economico individuato;');
  lines.push('');
  lines.push('che il contratto si debba considerare sciolto nel caso il Responsabile Unico del Procedimento rilevi la carenza del possesso dei prescritti requisiti.');
  lines.push('');
  lines.push('Per la copertura finanziaria');
  lines.push('');
  lines.push('Il Direttore amministrativo\tIl Direttore di ragioneria');
  lines.push('');
  lines.push('Dott.ssa Fanizza Susanna\tDott.ssa Angelucci Alessandra');
  lines.push('');
  lines.push('Documento informatico firmato digitalmente ai sensi dell\'art. 24 del D.Lgs. 82/2005 e ss.mm.ii. Pubblicato sul sito internet www.briccialditerni.it alla voce – "Amministrazione Trasparente" – "Bandi di Gara Contratti".');

  return lines;
}

function generaBozzaDeterminaNoleggio(istanza, cfgSezioni) {
  cfgSezioni = cfgSezioni || {};
  var sezDotazione = cfgSezioni.sezioneDotazione || 'Sezione 5A';
  istanza = istanza || 1;
  var suf = istanza > 1 ? '_' + istanza : '';
  var tagRigaNol = 'prevnol' + (istanza > 1 ? istanza : '');
  var tbodyIdPrevNol = 'preventivi-noleggio-body' + suf;
  var elencoNoleggio = [];
  VOCI_DOTAZIONE_NOLEGGIO.forEach(function(v) {
    var qta = getField(v[0]);
    if (!qta) return;
    if (getField('dot_disp_' + v[2]) === 'Da acquistare/noleggiare') {
      var assegnata = getField('determina_nol_voce_' + v[2]) || '1';
      if (String(assegnata) !== String(istanza)) return;
      var nota = getField(v[1]);
      elencoNoleggio.push(v[3] + (nota ? ' — ' + nota : ''));
    }
  });
  var oggettoLiberoNolBozza = getField('determina_nol_oggetto' + suf);
  if (oggettoLiberoNolBozza) {
    oggettoLiberoNolBozza.split('\n').map(function(r) { return r.trim(); }).filter(Boolean).forEach(function(riga) {
      elencoNoleggio.push(riga);
    });
  }
  if (elencoNoleggio.length === 0) {
    alert('Nessuna voce marcata "Da acquistare/noleggiare" assegnata a questa Determina, e nessun testo libero compilato. Controlla il pannello "Assegna le voci alle Determine", classifica la Dotazione Tecnica in ' + sezDotazione + ', oppure compila "Cosa altro stai acquistando".');
    return;
  }

  var preventivi = [];
  var scelto = null;
  document.querySelectorAll('#' + tbodyIdPrevNol + ' tr[data-riga="' + tagRigaNol + '"]').forEach(function(row) {
    var ditta = row.querySelector('[data-f="ditta"]');
    var importo = row.querySelector('[data-f="importo"]');
    var prot = row.querySelector('[data-f="prot"]');
    var dataP = row.querySelector('[data-f="data"]');
    var sceltoCb = row.querySelector('[data-f="scelto"]');
    var v = { ditta: ditta ? ditta.value.trim() : '', importo: importo ? importo.value.trim() : '', prot: prot ? prot.value.trim() : '', data: dataP ? dataP.value.trim() : '' };
    if (!v.ditta && !v.importo) return;
    preventivi.push(v);
    if (sceltoCb && sceltoCb.checked) scelto = v;
  });

  if (preventivi.length === 0) {
    alert('Nessun preventivo registrato. Aggiungi almeno un preventivo ricevuto prima di generare la bozza — la Determina non deve mai precedere i preventivi.');
    return;
  }
  if (!scelto) {
    alert('Nessun preventivo indicato come "Scelto". Spunta quale preventivo si intende affidare.');
    return;
  }

  var protRichiesta = getField('determina_nol_prot_richiesta' + suf) || '[___ N. Protocollo Richiesta ___]';
  var scadenzaOraRichiesta = getField('determina_nol_scadenza_ora' + suf) || '[___ ora scadenza offerte ___]';
  var scadenzaDataRichiesta = getField('determina_nol_scadenza_data' + suf) || '[___ data scadenza offerte ___]';
  var dataEventoTesto = getField('dataconcerto_data_1') || getField('data_evento') || '';
  var luogoEventoTesto = getField('luogo_concerto') || getField('dest_trasferta') || '';
  var cfg = {
    fraseOggetto: (metadati.titolo ? 'del progetto "' + metadati.titolo + '"' : 'dell\'evento') + (dataEventoTesto ? ' del giorno ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    frasePremesso: (metadati.titolo ? '"' + metadati.titolo + '"' : 'l\'evento in oggetto') + (dataEventoTesto ? ', in programma il giorno ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    approvazioneEventoTxt: 'dell\'evento',
    eventoRichiamatoTxt: 'dell\'evento richiamato',
    realizzazioneEventoTxt: 'dell\'evento',
    fraseFornitura: (dataEventoTesto ? ' del ' + dataEventoTesto : '') + (metadati.titolo ? ' in occasione di "' + metadati.titolo + '"' : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : ''),
    fraseDeterminaFinale: (dataEventoTesto ? ' del ' + dataEventoTesto : '') + (metadati.titolo ? ' in occasione di "' + metadati.titolo + '"' : ''),
    protRichiesta: protRichiesta,
    scadenzaOraRichiesta: scadenzaOraRichiesta,
    scadenzaDataRichiesta: scadenzaDataRichiesta,
    preventivi: preventivi,
    scelto: scelto,
    elencoNoleggio: elencoNoleggio
  };
  var lines = costruisciTestoDeterminaNoleggio(cfg);
  document.getElementById('testo-determina-noleggio').value = lines.join('\n');
  autoResizeTextarea(document.getElementById('testo-determina-noleggio'));
  if (!registraRichiestaGenerata('determina_noleggio' + suf, 'Determina Acquisti e Servizi' + (istanza > 1 ? ' — Istanza ' + istanza : ''))) return;
  var titElN = document.getElementById('titolo-modal-determina-noleggio');
  if (titElN) titElN.textContent = 'Bozza Determina — Acquisti e Servizi' + (istanza > 1 ? ' — Istanza ' + istanza : '');
  document.getElementById('modal-determina-noleggio').style.display = 'block';
}
// ═══════════════════════════════════════════════════════════════════
// Richiesta di Preventivo (PDF) — condivisa tra Mod.1/2/3 (Trasporti) e
// tutti e 4 i Moduli (Noleggio) + Dashboard cumulativa.
// Mod.4/Trasporti resta separato: modello dati diverso (collo_N invece
// di Furgone/Trasporti Materiale), stessa scelta già fatta per la Determina.
// ═══════════════════════════════════════════════════════════════════

function costruisciPDFRichiestaPreventivoTrasporti(cfg, jsPDFCtor) {
  var doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
  var pageWidth = doc.internal.pageSize.getWidth();
  var pageHeight = doc.internal.pageSize.getHeight();
  var marginL = 18, marginR = 18, marginTop = 15, marginBottom = 22;
  var maxWidth = pageWidth - marginL - marginR;
  var y = marginTop;

  function checkPageBreak(spazio) { if (y + spazio > pageHeight - marginBottom) { doc.addPage(); y = marginTop; } }
  function scriviParagrafo(testo, opz) {
    opz = opz || {};
    var fontSize = opz.size || 12;
    var lineHeight = opz.lineHeight || (fontSize * 0.42);
    doc.setFont('times', opz.bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    var wrapped = doc.splitTextToSize(testo, maxWidth);
    checkPageBreak(wrapped.length * lineHeight);
    if (!opz.bold && wrapped.length > 1) {
      doc.text(wrapped.slice(0, -1), marginL, y, { maxWidth: maxWidth, align: 'justify' });
      y += lineHeight * (wrapped.length - 1);
      doc.text(wrapped[wrapped.length - 1], marginL, y);
      y += lineHeight;
    } else {
      wrapped.forEach(function(riga) { doc.text(riga, marginL, y); y += lineHeight; });
    }
  }

  var logoW = 70, logoH = logoW * (289 / 1495);
  try { doc.addImage(LOGO_BRICCIALDI_BASE64, 'JPEG', marginL, y, logoW, logoH); } catch (e) {}
  doc.setFont('times', 'normal'); doc.setFontSize(12);
  doc.text('Terni, ' + cfg.dataOggi, pageWidth - marginR, y + 5, { align: 'right' });
  y += logoH + 10;

  doc.setFont('times', 'bold'); doc.setFontSize(16);
  doc.text('RICHIESTA DI PREVENTIVO', marginL, y);
  y += 7;
  scriviParagrafo('Servizio di trasporto materiale didattico e strumenti musicali', { bold: true, size: 11 });
  y += 3;

  var datiStazione = [
    ['Denominazione', 'Conservatorio di Musica "G. Briccialdi" – Terni'],
    ['Indirizzo', 'Via del Tribunale, 22, 05100 Terni (TR)'],
    ['Codice Fiscale', '91052640553'],
    ['Referente istruttore (RUP)', '[___ Nome RUP ___]'],
    ['Contatto e-mail', 'acquisti@briccialditerni.it']
  ];
  doc.setDrawColor(200);
  var colW1 = 55, rowH = 6.5;
  datiStazione.forEach(function(riga) {
    checkPageBreak(rowH);
    doc.setFont('times', 'bold'); doc.setFontSize(10.5);
    doc.text(riga[0], marginL + 1, y + 4.5);
    doc.setFont('times', 'normal');
    doc.text(riga[1], marginL + colW1 + 3, y + 4.5);
    doc.rect(marginL, y, maxWidth, rowH);
    doc.line(marginL + colW1, y, marginL + colW1, y + rowH);
    y += rowH;
  });
  y += 6;

  scriviParagrafo(cfg.introFrase);
  y += 2;
  scriviParagrafo('L\'affidamento avviene in modalità diretta ai sensi dell\'art. 50, comma 1, lett. b), del D.Lgs. 36/2023 (Codice dei contratti pubblici), trattandosi di servizio di importo inferiore alla soglia di € 140.000. La valutazione di congruità del costo sarà condotta dall\'ufficio sulla base dei prezzi unitari dichiarati in offerta e del raffronto con i valori di mercato.');
  y += 4;

  checkPageBreak(10);
  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text('Elenco materiale da trasportare', marginL, y);
  y += 6;
  if (cfg.elencoMateriale.length === 0) {
    scriviParagrafo('[___ nessun materiale segnato "già disponibile in Conservatorio" in Sezione 5A ___]');
  } else {
    cfg.elencoMateriale.forEach(function(voce) {
      var wrappedVoce = doc.splitTextToSize(voce, maxWidth - 4);
      var hRiga = wrappedVoce.length * 4 + 2.5;
      checkPageBreak(hRiga);
      doc.setFont('times', 'normal'); doc.setFontSize(11);
      doc.rect(marginL, y, maxWidth, hRiga);
      wrappedVoce.forEach(function(l, idx) { doc.text(l, marginL + 2, y + 4.5 + idx * 4); });
      y += hRiga;
    });
  }
  y += 6;

  checkPageBreak(10);
  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text('Trasporti Previsti', marginL, y);
  y += 6;
  var colGiorno = 30, colOrario = 42, colTratta = maxWidth - colGiorno - colOrario;
  checkPageBreak(7);
  doc.setFillColor(230, 230, 230);
  doc.rect(marginL, y, maxWidth, 6.5, 'F');
  doc.setFont('times', 'bold'); doc.setFontSize(9.5);
  doc.text('GIORNO', marginL + 1, y + 4.5);
  doc.text('TRATTA', marginL + colGiorno + 1, y + 4.5);
  doc.text('ORARIO', marginL + colGiorno + colTratta + 1, y + 4.5);
  y += 6.5;
  cfg.righeTabella.forEach(function(riga) {
    doc.setFont('times', 'normal'); doc.setFontSize(8.5);
    var wrappedGiorno = doc.splitTextToSize(riga.giorno, colGiorno - 3);
    var wrappedTratta = doc.splitTextToSize(riga.tratta, colTratta - 3);
    var wrappedOrario = doc.splitTextToSize(riga.orario, colOrario - 3);
    var righeAltezza = Math.max(wrappedGiorno.length, wrappedTratta.length, wrappedOrario.length, 1) * 4 + 2.5;
    checkPageBreak(righeAltezza);
    doc.rect(marginL, y, colGiorno, righeAltezza);
    doc.rect(marginL + colGiorno, y, colTratta, righeAltezza);
    doc.rect(marginL + colGiorno + colTratta, y, colOrario, righeAltezza);
    wrappedGiorno.forEach(function(l, idx) { doc.text(l, marginL + 1, y + 4.5 + idx * 4); });
    wrappedTratta.forEach(function(l, idx) { doc.text(l, marginL + colGiorno + 1, y + 4.5 + idx * 4); });
    wrappedOrario.forEach(function(l, idx) { doc.text(l, marginL + colGiorno + colTratta + 1, y + 4.5 + idx * 4); });
    y += righeAltezza;
  });
  y += 6;

  checkPageBreak(10);
  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text('Requisiti minimi del servizio', marginL, y);
  y += 6;
  [
    'Automezzo idoneo al trasporto di strumenti musicali, materiale didattico e attrezzature (arredi, leggii, materiale audio/video); disponibilità di coperte protettive e sistemi di fissaggio antiscivolo.',
    'Personale addetto al carico e scarico (almeno 2 persone), incluso nel prezzo offerto.',
    'Disponibilità a operare in orari serali.',
    'Iscrizione al Registro delle Imprese (CCIAA) per attività di trasporto conto terzi; regolarità contributiva (DURC).',
    'Possesso di adeguata copertura assicurativa RC per merci trasportate.'
  ].forEach(function(req) { scriviParagrafo('•  ' + req); y += 1; });
  y += 4;

  scriviParagrafo('L\'offerta, redatta sul fac-simile allegato (All. A), deve pervenire a mezzo e-mail certificata all\'indirizzo PEC dell\'istituto entro le ore ' + cfg.scadenzaOra + ' del ' + cfg.scadenzaData + '. L\'offerta deve indicare il prezzo complessivo IVA inclusa (con split payment) per l\'intero servizio nonché il costo unitario per singolo trasporto, al fine di consentire la verifica della congruità.');
  y += 2;
  scriviParagrafo('Offerte incomplete, condizionate o prive dei dati richiesti saranno escluse.');
  y += 1;
  scriviParagrafo('Il Conservatorio non è vincolato all\'affidamento in caso di offerta unica se il prezzo non risulta congruo.');
  y += 10;

  checkPageBreak(15);
  doc.setFont('times', 'normal'); doc.setFontSize(12);
  doc.text('Il Responsabile del Procedimento', marginL, y);
  y += 5;
  doc.text('[___ Nome RUP ___]', marginL, y);

  var nPagine = doc.internal.getNumberOfPages();
  for (var pg = 1; pg <= nPagine; pg++) {
    doc.setPage(pg);
    doc.setFont('times', 'normal'); doc.setFontSize(8);
    doc.setTextColor(120);
    var footer = 'Conservatorio Statale di Musica "Giulio Briccialdi" - Via del Tribunale, 22 - 05100 Terni – Tel. +39 0744 432170 | CF 91052640553 – www.briccialditerni.it – PEO info@briccialditerni.it – PEC ist.briccialdi@pec.it';
    var wrappedFooter = doc.splitTextToSize(footer, maxWidth);
    doc.text(wrappedFooter, marginL, pageHeight - 10);
    doc.setTextColor(0);
  }

  return doc;
}

function costruisciPDFRichiestaPreventivoNoleggio(cfg, jsPDFCtor) {
  var doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
  var pageWidth = doc.internal.pageSize.getWidth();
  var pageHeight = doc.internal.pageSize.getHeight();
  var marginL = 18, marginR = 18, marginTop = 15, marginBottom = 22;
  var maxWidth = pageWidth - marginL - marginR;
  var y = marginTop;

  function checkPageBreak(spazio) { if (y + spazio > pageHeight - marginBottom) { doc.addPage(); y = marginTop; } }
  function scriviParagrafo(testo, opz) {
    opz = opz || {};
    var fontSize = opz.size || 12;
    var lineHeight = opz.lineHeight || (fontSize * 0.42);
    doc.setFont('times', opz.bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    var wrapped = doc.splitTextToSize(testo, maxWidth);
    checkPageBreak(wrapped.length * lineHeight);
    if (!opz.bold && wrapped.length > 1) {
      doc.text(wrapped.slice(0, -1), marginL, y, { maxWidth: maxWidth, align: 'justify' });
      y += lineHeight * (wrapped.length - 1);
      doc.text(wrapped[wrapped.length - 1], marginL, y);
      y += lineHeight;
    } else {
      wrapped.forEach(function(riga) { doc.text(riga, marginL, y); y += lineHeight; });
    }
  }

  var logoW = 70, logoH = logoW * (289 / 1495);
  try { doc.addImage(LOGO_BRICCIALDI_BASE64, 'JPEG', marginL, y, logoW, logoH); } catch (e) {}
  doc.setFont('times', 'normal'); doc.setFontSize(12);
  doc.text('Terni, ' + cfg.dataOggi, pageWidth - marginR, y + 5, { align: 'right' });
  y += logoH + 10;

  doc.setFont('times', 'bold'); doc.setFontSize(16);
  doc.text('RICHIESTA DI PREVENTIVO', marginL, y);
  y += 7;
  scriviParagrafo('Fornitura di beni e/o servizi', { bold: true, size: 11 });
  y += 3;

  var datiStazione = [
    ['Denominazione', 'Conservatorio di Musica "G. Briccialdi" – Terni'],
    ['Indirizzo', 'Via del Tribunale, 22, 05100 Terni (TR)'],
    ['Codice Fiscale', '91052640553'],
    ['Referente istruttore (RUP)', '[___ Nome RUP ___]'],
    ['Contatto e-mail', 'acquisti@briccialditerni.it']
  ];
  doc.setDrawColor(200);
  var colW1 = 55, rowH = 6.5;
  datiStazione.forEach(function(riga) {
    checkPageBreak(rowH);
    doc.setFont('times', 'bold'); doc.setFontSize(10.5);
    doc.text(riga[0], marginL + 1, y + 4.5);
    doc.setFont('times', 'normal');
    doc.text(riga[1], marginL + colW1 + 3, y + 4.5);
    doc.rect(marginL, y, maxWidth, rowH);
    doc.line(marginL + colW1, y, marginL + colW1, y + rowH);
    y += rowH;
  });
  y += 6;

  scriviParagrafo(cfg.introFrase);
  y += 2;
  scriviParagrafo('L\'affidamento avviene in modalità diretta ai sensi dell\'art. 50, comma 1, lett. b), del D.Lgs. 36/2023 (Codice dei contratti pubblici), trattandosi di servizio di importo inferiore alla soglia di € 140.000. La valutazione di congruità del costo sarà condotta dall\'ufficio sulla base dei prezzi unitari dichiarati in offerta e del raffronto con i valori di mercato.');
  y += 4;

  checkPageBreak(10);
  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text('Elenco materiale/servizio richiesto in noleggio', marginL, y);
  y += 6;
  cfg.elencoNoleggio.forEach(function(voce) {
    var wrappedVoce = doc.splitTextToSize(voce, maxWidth - 4);
    var hRiga = wrappedVoce.length * 4 + 2.5;
    checkPageBreak(hRiga);
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    doc.rect(marginL, y, maxWidth, hRiga);
    wrappedVoce.forEach(function(l, idx) { doc.text(l, marginL + 2, y + 4.5 + idx * 4); });
    y += hRiga;
  });
  y += 6;

  checkPageBreak(10);
  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text('Requisiti minimi del servizio', marginL, y);
  y += 6;
  [
    'Materiale/attrezzatura in buono stato d\'uso e conforme alle norme di sicurezza vigenti.',
    'Consegna, allestimento e ritiro a cura del fornitore, incluso nel prezzo offerto.',
    'Disponibilità a operare in orari serali, se richiesto dal programma dell\'evento.',
    'Iscrizione al Registro delle Imprese (CCIAA) per l\'attività oggetto della richiesta; regolarità contributiva (DURC).',
    'Possesso di adeguata copertura assicurativa RC.'
  ].forEach(function(req) { scriviParagrafo('•  ' + req); y += 1; });
  y += 4;

  scriviParagrafo('L\'offerta, redatta sul fac-simile allegato (All. A), deve pervenire a mezzo e-mail certificata all\'indirizzo PEC dell\'istituto entro le ore ' + cfg.scadenzaOra + ' del ' + cfg.scadenzaData + '. L\'offerta deve indicare il prezzo complessivo IVA inclusa (con split payment) per l\'intero servizio, al fine di consentire la verifica della congruità.');
  y += 2;
  scriviParagrafo('Offerte incomplete, condizionate o prive dei dati richiesti saranno escluse.');
  y += 1;
  scriviParagrafo('Il Conservatorio non è vincolato all\'affidamento in caso di offerta unica se il prezzo non risulta congruo.');
  y += 10;

  checkPageBreak(15);
  doc.setFont('times', 'normal'); doc.setFontSize(12);
  doc.text('Il Responsabile del Procedimento', marginL, y);
  y += 5;
  doc.text('[___ Nome RUP ___]', marginL, y);

  var nPagine = doc.internal.getNumberOfPages();
  for (var pg = 1; pg <= nPagine; pg++) {
    doc.setPage(pg);
    doc.setFont('times', 'normal'); doc.setFontSize(8);
    doc.setTextColor(120);
    var footer = 'Conservatorio Statale di Musica "Giulio Briccialdi" - Via del Tribunale, 22 - 05100 Terni – Tel. +39 0744 432170 | CF 91052640553 – www.briccialditerni.it – PEO info@briccialditerni.it – PEC ist.briccialdi@pec.it';
    var wrappedFooter = doc.splitTextToSize(footer, maxWidth);
    doc.text(wrappedFooter, marginL, pageHeight - 10);
    doc.setTextColor(0);
  }

  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTORE CONDIVISO — Richieste di Preventivo e Determine (PDF), riusabile da
// qualunque finalità (Trasporti, Noleggio/Service, Personale Esterno, Acquisti
// /Beni). Trasporti resta sul proprio codice dedicato (migrazione a parte, a
// mente fresca) — Noleggio è il primo banco di prova di questo motore.
// Ogni funzione "pdf*" lavora su un "ctx" (contesto) condiviso invece che su
// variabili sparse, così le stesse routine servono a qualunque documento.
// ═══════════════════════════════════════════════════════════════════════════

function pdfNuovoDocumento() {
  var jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
  if (!jsPDFCtor) return null;
  var doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
  var ctx = {
    doc: doc,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    marginL: 18, marginR: 18, marginTop: 15, marginBottom: 22,
    y: 15
  };
  ctx.maxWidth = ctx.pageWidth - ctx.marginL - ctx.marginR;
  return ctx;
}

function pdfCheckPageBreak(ctx, spazio) {
  if (ctx.y + spazio > ctx.pageHeight - ctx.marginBottom) { ctx.doc.addPage(); ctx.y = ctx.marginTop; }
}

function pdfParagrafo(ctx, testo, opz) {
  opz = opz || {};
  var fontStyle = opz.bold ? 'bold' : 'normal';
  var fontSize = opz.size || 12;
  ctx.doc.setFont('times', fontStyle);
  ctx.doc.setFontSize(fontSize);
  var wrapped = ctx.doc.splitTextToSize(testo, ctx.maxWidth);
  var lineHeight = opz.lineHeight || (fontSize * 0.42);
  pdfCheckPageBreak(ctx, wrapped.length * lineHeight);
  // Giustificato su tutte le righe tranne l'ultima (prassi tipografica standard
  // — l'ultima riga di un paragrafo non si stira per riempire la larghezza).
  // Titoli/grassetti e paragrafi di una sola riga restano allineati a sinistra.
  var giustifica = !opz.bold && !opz.align && wrapped.length > 1;
  if (giustifica) {
    ctx.doc.text(wrapped.slice(0, -1), ctx.marginL, ctx.y, { maxWidth: ctx.maxWidth, align: 'justify' });
    ctx.y += lineHeight * (wrapped.length - 1);
    ctx.doc.text(wrapped[wrapped.length - 1], ctx.marginL, ctx.y);
    ctx.y += lineHeight;
  } else {
    wrapped.forEach(function(riga) {
      ctx.doc.text(riga, ctx.marginL, ctx.y);
      ctx.y += lineHeight;
    });
  }
}

function pdfSottotitoloSezione(ctx, testo) {
  pdfCheckPageBreak(ctx, 10);
  ctx.doc.setFont('times', 'bold'); ctx.doc.setFontSize(12);
  ctx.doc.text(testo, ctx.marginL, ctx.y);
  ctx.y += 6.5;
}

function pdfIntestazioneIstituzionale(ctx, titolo, sottotitolo) {
  var logoW = 70, logoH = logoW * (289 / 1495);
  try { ctx.doc.addImage(LOGO_BRICCIALDI_BASE64, 'JPEG', ctx.marginL, ctx.y, logoW, logoH); } catch (e) {}
  var oggi = new Date();
  var dataOggi = ('0' + oggi.getDate()).slice(-2) + '/' + ('0' + (oggi.getMonth() + 1)).slice(-2) + '/' + oggi.getFullYear();
  ctx.doc.setFont('times', 'normal'); ctx.doc.setFontSize(12);
  ctx.doc.text('Terni, ' + dataOggi, ctx.pageWidth - ctx.marginR, ctx.y + 5, { align: 'right' });
  ctx.y += logoH + 10;
  ctx.doc.setFont('times', 'bold'); ctx.doc.setFontSize(16);
  ctx.doc.text(titolo, ctx.marginL, ctx.y);
  ctx.y += 8;
  if (sottotitolo) { pdfParagrafo(ctx, sottotitolo, { bold: true, size: 12.5 }); ctx.y += 3; }
}

function pdfTabellaStazioneAppaltante(ctx, rupPlaceholder) {
  var dati = [
    ['Denominazione', 'Conservatorio di Musica "G. Briccialdi" – Terni'],
    ['Indirizzo', 'Via del Tribunale, 22, 05100 Terni (TR)'],
    ['Codice Fiscale', '91052640553'],
    ['Referente istruttore (RUP)', rupPlaceholder || '[___ Nome RUP ___]'],
    ['Contatto e-mail', 'acquisti@briccialditerni.it']
  ];
  ctx.doc.setDrawColor(200);
  var colW1 = 55, rowH = 7;
  dati.forEach(function(riga) {
    pdfCheckPageBreak(ctx, rowH);
    ctx.doc.setFont('times', 'bold'); ctx.doc.setFontSize(10.5);
    ctx.doc.text(riga[0], ctx.marginL + 1, ctx.y + 4.7);
    ctx.doc.setFont('times', 'normal');
    ctx.doc.text(riga[1], ctx.marginL + colW1 + 3, ctx.y + 4.7);
    ctx.doc.rect(ctx.marginL, ctx.y, ctx.maxWidth, rowH);
    ctx.doc.line(ctx.marginL + colW1, ctx.y, ctx.marginL + colW1, ctx.y + rowH);
    ctx.y += rowH;
  });
  ctx.y += 6;
}

function pdfElencoTabellare(ctx, voci, vuoto) {
  if (!voci || voci.length === 0) {
    pdfParagrafo(ctx, vuoto || '[___ nessuna voce ___]');
    ctx.y += 6;
    return;
  }
  voci.forEach(function(voce) {
    ctx.doc.setFont('times', 'normal'); ctx.doc.setFontSize(11);
    var wrapped = ctx.doc.splitTextToSize(voce, ctx.maxWidth - 4);
    var h = wrapped.length * 4.7 + 2.5;
    pdfCheckPageBreak(ctx, h);
    ctx.doc.rect(ctx.marginL, ctx.y, ctx.maxWidth, h);
    wrapped.forEach(function(l, idx) { ctx.doc.text(l, ctx.marginL + 2, ctx.y + 4.7 + idx * 4.7); });
    ctx.y += h;
  });
  ctx.y += 6;
}

function pdfRequisitiMinimi(ctx, elenco) {
  pdfSottotitoloSezione(ctx, 'Requisiti minimi del servizio');
  elenco.forEach(function(req) { pdfParagrafo(ctx, '•  ' + req); ctx.y += 1; });
  ctx.y += 4;
}

function pdfChiusuraLegaleEFirma(ctx, scadenzaData, scadenzaOra, oggettoOfferta, rupPlaceholder) {
  pdfParagrafo(ctx, 'L\'offerta, redatta sul fac-simile allegato (All. A), deve pervenire a mezzo e-mail certificata all\'indirizzo PEC dell\'istituto entro le ore ' + scadenzaOra + ' del ' + scadenzaData + '. L\'offerta deve indicare il prezzo complessivo IVA inclusa (con split payment) per ' + (oggettoOfferta || 'l\'intero servizio') + ', al fine di consentire la verifica della congruità.');
  ctx.y += 2;
  pdfParagrafo(ctx, 'Offerte incomplete, condizionate o prive dei dati richiesti saranno escluse.');
  ctx.y += 1;
  pdfParagrafo(ctx, 'Il Conservatorio non è vincolato all\'affidamento in caso di offerta unica se il prezzo non risulta congruo.');
  ctx.y += 10;
  pdfCheckPageBreak(ctx, 15);
  ctx.doc.setFont('times', 'normal'); ctx.doc.setFontSize(12);
  ctx.doc.text('Il Responsabile del Procedimento', ctx.marginL, ctx.y);
  ctx.y += 5;
  ctx.doc.text(rupPlaceholder || '[___ Nome RUP ___]', ctx.marginL, ctx.y);
}

function pdfFooterOgniPagina(ctx) {
  var n = ctx.doc.internal.getNumberOfPages();
  for (var pg = 1; pg <= n; pg++) {
    ctx.doc.setPage(pg);
    ctx.doc.setFont('times', 'normal'); ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(120);
    var footer = 'Conservatorio Statale di Musica "Giulio Briccialdi" - Via del Tribunale, 22 - 05100 Terni – Tel. +39 0744 432170 | CF 91052640553 – www.briccialditerni.it – PEO info@briccialditerni.it – PEC ist.briccialdi@pec.it';
    var wrapped = ctx.doc.splitTextToSize(footer, ctx.maxWidth);
    ctx.doc.text(wrapped, ctx.marginL, ctx.pageHeight - 10);
    ctx.doc.setTextColor(0);
  }
}

function pdfSalva(ctx, prefisso) {
  var nomeProgetto = (metadati.titolo || 'Progetto').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  ctx.doc.save(prefisso + '_' + nomeProgetto + '.pdf');
}

function generaPDFRichiestaPreventivoGenerica(config) {
  var ctx = pdfNuovoDocumento();
  if (!ctx) {
    alert('Libreria PDF non ancora caricata — verifica la connessione internet e riprova tra qualche secondo.');
    return;
  }
  pdfIntestazioneIstituzionale(ctx, 'RICHIESTA DI PREVENTIVO', config.sottotitolo);
  pdfTabellaStazioneAppaltante(ctx);
  pdfParagrafo(ctx, config.introTesto);
  ctx.y += 2;
  pdfParagrafo(ctx, 'L\'affidamento avviene in modalità diretta ai sensi dell\'art. 50, comma 1, lett. b), del D.Lgs. 36/2023 (Codice dei contratti pubblici), trattandosi di servizio di importo inferiore alla soglia di € 140.000. La valutazione di congruità del costo sarà condotta dall\'ufficio sulla base dei prezzi unitari dichiarati in offerta e del raffronto con i valori di mercato.');
  ctx.y += 4;
  pdfSottotitoloSezione(ctx, config.elencoTitolo || 'Elenco richiesto');
  pdfElencoTabellare(ctx, config.elencoVoci, config.elencoVuotoMsg);
  if (config.requisitiMinimi) pdfRequisitiMinimi(ctx, config.requisitiMinimi);
  var scadenzaData = getField(config.scadenzaDataFieldName) || '[___ Data scadenza ___]';
  var scadenzaOra = getField(config.scadenzaOraFieldName) || '[___ Ora scadenza ___]';
  pdfChiusuraLegaleEFirma(ctx, scadenzaData, scadenzaOra, config.oggettoOfferta);
  pdfFooterOgniPagina(ctx);
  pdfSalva(ctx, config.nomeFilePrefisso);
}

function costruisciTestoDeterminaPersonaleEsterno(cfg) {
  var scelto = cfg.scelto;
  var preventivi = cfg.preventivi;
  var elencoPersonale = cfg.elencoPersonale;
  var importoScelto = parseImportoIt(scelto.importo);
  var nomeRUP = (!isNaN(importoScelto) && importoScelto < 5000) ? 'Dott.ssa Alessandra Angelucci' : 'Dott.ssa Susanna Fanizza';
  var protRichiesta = cfg.protRichiesta;
  var scadenzaOraRichiesta = cfg.scadenzaOraRichiesta;
  var scadenzaDataRichiesta = cfg.scadenzaDataRichiesta;
  var capitolo = cfg.capitolo;
  var dataEventoTesto = cfg.dataEventoTesto;
  var luogoEventoTesto = cfg.luogoEventoTesto;
  var altreOfferte = preventivi.filter(function(p) { return p !== scelto; });
  var unicoOfferente = preventivi.length === 1;
  var ivaCalcolata = isNaN(importoScelto) ? NaN : importoScelto * 0.22;
  var totaleConIva = isNaN(importoScelto) ? NaN : importoScelto * 1.22;
  var lines = [];
  lines.push('Amministrazione');
  lines.push('');
  lines.push('Terni, [___ data Determina ___]');
  lines.push('');
  lines.push('Determina n. [___ N. Determina ___]/[___ anno ___]');
  lines.push('');
  lines.push('Oggetto: Decisione a contrarre, impegno di spesa e affidamento diretto per il servizio di personale artistico esterno (strumentisti/ruoli)' + (metadati.titolo ? ' per "' + metadati.titolo + '"' : '') + (dataEventoTesto ? ' — ' + dataEventoTesto : '') + '.');
  lines.push('CIG: [___ CIG ___]');
  lines.push('');
  lines.push('IL DIRETTORE AMMINISTRATIVO');
  lines.push('PREMESSO CHE');
  lines.push('Il Conservatorio Statale di Musica "G. Briccialdi" di Terni è impegnato nell\'organizzazione di ' + (metadati.titolo ? '"' + metadati.titolo + '"' : 'quanto in oggetto') + (dataEventoTesto ? ', in programma il ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : '') + ';');
  lines.push('');
  lines.push('Il Docente di riferimento, [___ Nome Docente ___], con comunicazione del [___ data comunicazione ___], ha confermato la disponibilità per le date indicate e ha specificato l\'organico necessario' + (elencoPersonale.length ? ':' : ';'));
  if (elencoPersonale.length) {
    lines.push('');
    elencoPersonale.forEach(function(v) { lines.push('– ' + v + ';'); });
  }
  lines.push('');
  lines.push('Con nota prot. n. ' + protRichiesta + ', il RUP ha proceduto all\'invio della richiesta di preventivo a n. [___ numero operatori contattati ___] operatori economici del settore, tramite piattaforma di e-procurement TRASPARE a mezzo PEC, con scadenza fissata al ' + scadenzaDataRichiesta + ' ore ' + scadenzaOraRichiesta + ';');
  lines.push('');
  if (unicoOfferente) {
    lines.push('L\'unico operatore economico che ha trasmesso offerta entro il termine prescritto è ' + scelto.ditta + (scelto.prot ? ', mediante nota prot. n. ' + scelto.prot : '') + (scelto.data ? ' del ' + scelto.data : '') + ', allegando la documentazione richiesta (atto costitutivo, DURC in corso di validità, documento d\'identità del rappresentante legale) [___ verificare documentazione effettivamente ricevuta ___];');
  } else {
    lines.push('Entro il termine sopra indicato sono pervenute n. ' + preventivi.length + ' offerte dalle seguenti ditte/cooperative:');
    lines.push('');
    preventivi.forEach(function(p) {
      lines.push('– ' + p.ditta + ', con sede in [___ indirizzo ___] (P.IVA/C.F. [___ P.IVA/C.F. ___]), acquisita al prot. n. ' + (p.prot || '[___ prot. ___]') + (p.data ? ' del ' + p.data : ' del [___ data ___]') + ', per un importo di € ' + p.importo + ' oltre IVA' + (p === scelto ? ' — SCELTA' : '') + ';');
    });
  }
  lines.push('');
  lines.push('Il Direttore Amministrativo, con nota interna del [___ data ___], ha evidenziato che il costo del servizio risulta congruo rispetto ai valori medi di mercato per prestazioni analoghe;');
  lines.push('');
  lines.push('non ravvisando soluzioni alternative praticabili e vista l\'impossibilità di rinviare l\'evento senza arrecare pregiudizio agli studenti;');
  lines.push('');
  lines.push('TENUTO CONTO');
  lines.push('Dell\'offerta economica di ' + scelto.ditta + ', per un importo complessivo di € ' + scelto.importo + ' oltre IVA, ritenuta congrua e vantaggiosa in relazione alla natura specialistica del servizio;');
  lines.push('');
  lines.push('Che ' + scelto.ditta + ' [___ è / non è già iscritta all\'Albo Fornitori del Conservatorio — completare ___];');
  lines.push('');
  lines.push('Dell\'affidabilità di ' + scelto.ditta + ', accertata attraverso l\'accesso alla Banca Dati Nazionale dei Contratti Pubblici e il Fascicolo Virtuale degli Operatori Economici presso ANAC (assenza di cause di esclusione ex artt. 94 e 95 D.Lgs. 36/2023) e mediante verifica della regolarità contributiva e previdenziale (DURC) [___ da completare a cura di Acquisti/Ragioneria ___];');
  lines.push('');
  if (cfg.applicaDeroga) {
    lines.push('Della necessità di derogare al principio di rotazione (ex art. 49 D.Lgs. 36/2023) in virtù della comprovata professionalità, della non fungibilità del servizio artistico specialistico' + (unicoOfferente ? ', del fatto che nessun altro operatore ha presentato offerta' : '') + ' e delle tempistiche non differibili dell\'evento;');
    lines.push('');
    lines.push('RILEVATO CHE');
    lines.push('Nel caso di specie la deroga al principio di rotazione è giustificata dai seguenti elementi:');
    lines.push('');
    lines.push('Dalla comprovata affidabilità e professionalità dimostrata dall\'operatore economico [___ in precedenti incarichi analoghi, se applicabile ___];');
    lines.push('');
    lines.push('Dalla natura altamente specialistica e artistica del servizio di fornitura di personale artistico esterno, non surrogabile con operatori ordinari;');
    if (unicoOfferente) {
      lines.push('');
      lines.push('Dal fatto che gli altri operatori economici consultati non hanno presentato offerta entro il termine prescritto, rendendo di fatto ' + scelto.ditta + ' l\'unico offerente;');
    }
    lines.push('');
    lines.push('Dall\'esigenza di garantire la corretta esecuzione delle attività didattico-artistiche, con ricadute dirette sul percorso accademico degli studenti;');
    lines.push('');
    lines.push('Dalle tempistiche ristrette e non differibili dell\'evento, che renderebbero una nuova procedura comparativa sproporzionata e pregiudizievole;');
    if (!isNaN(importoScelto) && importoScelto < 5000) {
      lines.push('');
      lines.push('Dal modesto importo dell\'affidamento, con conseguente ridotto impatto sulla concorrenza;');
    }
    lines.push('');
  } else {
    lines.push('che l\'affidamento avviene nel rispetto del principio di rotazione degli affidamenti di cui all\'art. 49 del D.Lgs. 36/2023;');
    lines.push('');
  }
  lines.push('DATO ATTO');
  lines.push('Ai sensi dell\'art. 17 del D.Lgs. 36/2023 e dell\'art. 192 del TUEL, che le caratteristiche essenziali del contratto sono le seguenti:');
  lines.push('');
  lines.push('Oggetto del contratto: Servizio di personale artistico esterno (strumentisti/ruoli)' + (metadati.titolo ? ' per "' + metadati.titolo + '"' : '') + (dataEventoTesto ? ' — ' + dataEventoTesto : '') + (luogoEventoTesto ? ', ' + luogoEventoTesto : ''));
  lines.push('Operatore economico affidatario: ' + scelto.ditta + ' – [___ indirizzo completo ___] – P.IVA/C.F. [___ P.IVA/C.F. ___] – Rappresentante legale: [___ nome ___]');
  lines.push('Importo del contratto: € ' + scelto.importo + ' oltre IVA' + (isNaN(totaleConIva) ? '' : ' = € ' + formattaImportoIt(totaleConIva) + ' totale') + ' (split payment)');
  lines.push('Modalità di svolgimento: [___ luogo prove/orari, a carico di chi — completare ___]');
  lines.push('Forma del contratto: Scambio di lettere tramite PEC/sistemi elettronici di recapito certificato qualificato, ai sensi dell\'art. 18, Allegato I.1 D.Lgs. 36/2023');
  lines.push('Modalità di scelta del contraente: Affidamento diretto ai sensi dell\'art. 50, co. 1, lett. b), D.Lgs. 36/2023');
  lines.push('Copertura finanziaria: ' + capitolo + ' — Bilancio [___ anno ___]');
  lines.push('Tracciabilità (L. 136/2010): IBAN ' + (cfg.iban || '[___ IBAN ___]') + ' – [___ Istituto bancario ___] – Intestato a: ' + scelto.ditta);
  lines.push('');
  if (isNaN(importoScelto)) {
    lines.push('⚠ Importo non riconosciuto — verificare il formato (es. 850,00) prima di inviare.');
    lines.push('');
  } else if (importoScelto >= 140000) {
    lines.push('⚠ ATTENZIONE: importo pari o superiore a € 140.000 — la procedura di affidamento diretto non è gestita da questo sistema. Verificare con Acquisti/RUP la procedura corretta prima di procedere.');
    lines.push('');
  }
  lines.push('CONSIDERATO');
  lines.push('Che il costo del servizio è da ritenersi congruo e conveniente, come risultante dall\'analisi istruttoria del RUP e dall\'esame dell\'offerta pervenuta; che il prezzo è in linea con i valori medi di mercato per prestazioni artistiche professionali analoghe; che una nuova procedura sarebbe antieconomica in relazione ai tempi e ai risultati attesi;');
  lines.push('');
  lines.push('DATO ATTO di procedere all\'affidamento diretto ai sensi dell\'art. 50 comma 1 lett. b) D.Lgs. 36/2023 per il servizio di quanto indicato in premessa, attraverso piattaforma certificata e-procurement TRASPARE che interopera con le piattaforme CP e DND dell\'ANAC;');
  lines.push('');
  lines.push('PRESO ATTO che il n. ID Appalto è il seguente: [___ ID Appalto ___];');
  lines.push('');
  lines.push('VISTI');
  lines.push('L\'art. 50, co. 1, lett. b) del D.Lgs. 31 marzo 2023, n. 36;');
  lines.push('L\'art. 108, co. 2 del D.Lgs. 36/2023 — criterio del minor prezzo;');
  lines.push('L\'art. 49 del D.Lgs. 36/2023 e D.Lgs. 209/2024 — deroga al principio di rotazione;');
  lines.push('L\'art. 3 della Legge 13 agosto 2010, n. 136 — tracciabilità dei flussi finanziari;');
  lines.push('L\'art. 25 del D.Lgs. 36/2023 — utilizzo di piattaforme telematiche;');
  lines.push('La Delibera del Consiglio di Amministrazione n. [___ N. Delibera Bilancio ___] del [___ data ___] di approvazione del Bilancio di Previsione e.f. [___ anno ___];');
  lines.push('');
  lines.push('DETERMINA');
  lines.push('');
  lines.push('DI AFFIDARE per le motivazioni espresse in premessa il servizio di personale artistico esterno (strumentisti/ruoli)' + (dataEventoTesto ? ' per l\'evento del ' + dataEventoTesto : '') + (luogoEventoTesto ? ' presso ' + luogoEventoTesto : '') + ' a ' + scelto.ditta + ' – [___ indirizzo completo ___] (P.IVA/C.F. [___ P.IVA/C.F. ___]).');
  lines.push('');
  lines.push('DI IMPEGNARE la somma complessiva di € ' + (isNaN(totaleConIva) ? scelto.importo + ' oltre IVA' : formattaImportoIt(totaleConIva) + ' (di cui € ' + scelto.importo + ' per imponibile ed € ' + formattaImportoIt(ivaCalcolata) + ' per IVA al 22% in regime di split payment)') + ' sul ' + capitolo + ' del Bilancio [___ anno ___], dando atto che la liquidazione della spesa avverrà con successivo e separato provvedimento, previa verifica della regolare esecuzione del servizio e ricezione di regolare fattura elettronica.');
  lines.push('');
  lines.push('DI NOMINARE ' + nomeRUP + ' quale Responsabile Unico del Progetto (RUP) ai sensi dell\'art. 15 del D.Lgs. 36/2023.');
  lines.push('');
  lines.push('DI DARE ATTO che il contratto sarà stipulato mediante scambio di corrispondenza, anche tramite PEC o sistemi elettronici di recapito certificato qualificato, ai sensi dell\'art. 18, Allegato I.1, D.Lgs. 36/2023.');
  lines.push('');
  lines.push('DI DISPORRE la pubblicazione del presente atto sul sito istituzionale nella sezione "Amministrazione Trasparente".');
  lines.push('');
  lines.push('Il Direttore amministrativo\tPer la copertura finanziaria');
  lines.push('Dott.ssa Susanna Fanizza\tIl Direttore di ragioneria');
  lines.push('\tDott.ssa Alessandra Angelucci');
  lines.push('');
  lines.push('Documento informatico firmato digitalmente ai sensi dell\'art. 24 del D.Lgs. 82/2005 e ss.mm.ii. Pubblicato sul sito internet www.briccialditerni.it alla voce – "Amministrazione Trasparente" – "Bandi di Gara Contratti".');

  return lines;
}
