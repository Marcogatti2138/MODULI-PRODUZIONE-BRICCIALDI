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