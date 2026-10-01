// Rigenera i progetti di prova completi (tests/progetti-prova/completo-m*.json).
// Uso:  cd tests && node helpers/genera-progetti-prova.js [M1 M2 M3 M4]
//
// Apre ogni modulo nella pagina vera, con il finto Firestore e la rete Firebase
// bloccata, compila ogni campo con dati INVENTATI e coerenti (regole qui sotto,
// in base al nome del campo), lascia salvare la pagina e la riapre finché il
// progetto salvato smette di cambiare (alla riapertura compaiono righe nuove:
// trasporti e assistenza per ogni prova e replica).
// tests/ è pubblicata da GitHub Pages: mai dati veri, nemmeno in parte.
// Dopo averlo usato, rileggere il diff dei JSON e rilanciare npm run test:e2e.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIR_TEST = path.resolve(__dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(DIR_TEST, '.browsers');
const { chromium } = require('@playwright/test');

const PORTA = 8798;
const FINTO_FIRESTORE = fs.readFileSync(path.join(DIR_TEST, 'e2e/finto-firestore.js'), 'utf8');
const LOCALI = {
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': path.join(DIR_TEST, 'node_modules/jspdf/dist/jspdf.umd.min.js'),
  'https://unpkg.com/docx@7.1.0/build/index.js': path.join(DIR_TEST, 'node_modules/docx/build/index.js')
};
const MODULI = {
  M1: { file: 'Modulo_1_SinfonicoCORALE.html', tipologia: 'sinfonico-corale', id: '9201' },
  M2: { file: 'Modulo_2_PiccoloConcerto.html', tipologia: 'piccolo-concerto', id: '9202' },
  M3: { file: 'Modulo_3_Masterclass.html', tipologia: 'masterclass', id: '9203' },
  M4: { file: 'Modulo_4_EventoIstituzionale.html', tipologia: 'evento-istituzionale', id: '9204' }
};

// Bug F (M4, Assistenza logistica): la pagina perde studenti e orario alla
// riapertura, quindi il generatore non riesce a salvarli. Si scrivono a mano i
// valori voluti. Quando F sarà corretto questo blocco non servirà più.
const CORREZIONI_BUG_NOTI = {
  M4: { ass_log_studenti_concerto: '3', ass_log_orario_concerto: '14:00 – 19:00', ass_log_studenti_replica_1: '3', ass_log_studenti_replica_2: '3' }
};

function metadatiDiProva(sigla, m) {
  return {
    id: m.id, titolo: 'Progetto di prova completo ' + sigla, tipologia: m.tipologia,
    referente: 'Referente Prova ' + sigla, email: 'referente.' + sigla.toLowerCase() + '@example.org',
    delibera: 'Delibera prova n. 1', data_delibera: '15/01/2031', scadenza: '28/02/2031',
    sede: 'Sede Prova', data_evento_prevista: '15/03/2031'
  };
}

// Righe in più oltre quelle di partenza (solo le funzioni presenti nel modulo).
function aggiungiRigheReferente() {
  const chiama = (nome, n, ...a) => { for (let i = 0; i < n; i++) if (typeof window[nome] === 'function') window[nome](...a); };
  chiama('addReplica', 2); chiama('addProva', 1); chiama('addBrano', 1); chiama('addSolista', 1); chiama('addSpartito', 1);
  chiama('addDocente', 1); chiama('addEsecutore', 1); chiama('addRelatore', 2); chiama('addProgramma', 3); chiama('addCollo', 2);
  chiama('addDataConcerto', 2); chiama('addEsecutoreConcerto', 2); chiama('addCollaboratore', 2);
}
function aggiungiRigheResponsabile() {
  const chiama = (nome, n, ...a) => { for (let i = 0; i < n; i++) if (typeof window[nome] === 'function') window[nome](...a); };
  chiama('addPersona', 1); chiama('addDetermina', 2); chiama('addPreventivoTrasporti', 2); chiama('addPreventivoTrasportoPersone', 2);
  if (document.getElementById('preventivi-noleggio-body')) chiama('addPreventivoGenerico', 2, 'preventivi-noleggio-body', 'prevnol', true);
  if (document.getElementById('preventivi-personale-body')) chiama('addPreventivoGenerico', 2, 'preventivi-personale-body', 'prevpers', true, true);
}

// Gira nella pagina: compila i campi vuoti e restituisce quanti ne ha compilati.
// L'ordine delle regole conta (la prima che corrisponde vince).
function compilaCampiVuoti(sigla) {
  const pick = (el, pref) => { const ops = [...el.options].map(o => o.value).filter(Boolean); for (const p of pref || []) { const f = ops.find(o => o.startsWith(p)); if (f) return f; } return ops[0]; };
  const DISP = { sedie: 'Già disponibile', leggii: 'Prestito', podio: 'Prestito', piano: 'Disponibile nella struttura', audio: 'Da acquistare', luci: 'Da acquistare', service: 'Da acquistare', altro: 'Da acquistare', leggii_lum: 'Già disponibile', leggio_relatore: 'Prestito' };
  function valore(el) {
    const n = el.name, m = /_(\d+)$/.exec(n), i = m ? +m[1] : 1, ph = el.placeholder || '';
    if (el.tagName === 'SELECT') {
      if (n === 'trasferta') return pick(el, ['Sì — destinazione regionale']);
      if (n === 'trasporti_previsti' || n === 'alloggio_necessario') return pick(el, ['Sì']);
      if (n === 'stessa_sede_concerto') return pick(el, ['No']);
      if (n === 'musica_prevista') return 'si';
      if (/^spazio_prova_/.test(n)) return pick(el, ['Sala Orologio']);
      if (/^spazio_replica_/.test(n)) return pick(el, ['Altro']);
      if (/^spazio_/.test(n)) return pick(el, ['Teatro Secci', 'Sala Orologio']);
      if (/^dot_disp_/.test(n)) { const k = n.replace(/^dot_disp_(concerto_)?/, ''); return pick(el, [DISP[k] || 'Già disponibile']); }
      if (/_ruolo_|ruolomc/.test(n)) return pick(el, [i === 1 ? (n.includes('mc') ? 'Organizzatore' : 'Referente') : 'Collaboratore', 'Referente']);
      if (/_qual_/.test(n)) { const ops = [...el.options].map(o => o.value).filter(Boolean); return ops[(i - 1) % ops.length]; }
      if (/modalita/.test(n)) return pick(el, i % 2 ? ['Contratto singolo', 'Furgone'] : ['Cooperativa', 'Mezzi propri']);
      if (/alloggio_\d/.test(n) || /vitto_\d/.test(n)) return pick(el, ['Sì']);
      if (/mezzo/.test(n)) return pick(el, ['Treno']);
      return pick(el);
    }
    if (el.type === 'checkbox') {
      if (/sblocco_referente|no_materiale|senza_ente/.test(n)) return false;
      if (/_scelto_/.test(n)) return i === 1;
      if (/^(trasp_mat|ass_log)_check_/.test(n)) return /_concerto$|_1$/.test(n);
      return true;
    }
    // contatti
    if (el.type === 'email' || /_email/.test(n)) return n.replace(/_\d+$/, '').replace(/_/g, '.') + '.' + i + '@example.org';
    if (el.type === 'tel' || /_tel/.test(n)) return '+39 000 000 00' + String(i).padStart(2, '0');
    // date e luoghi
    if (/^prova_data_/.test(n)) return sigla === 'M3' ? (15 + Math.floor((i - 1) / 2)) + '/03/2031' : String(9 + i).padStart(2, '0') + '/03/2031';
    if (sigla === 'M3' && /riconsegna_data|^centralino_rientro_data/.test(n)) return '18/03/2031';
    if (n === 'luogo_concerto' || n === 'trasp_mat_dest_concerto') return 'Teatro Secci';
    if (/^prova_luogo_|^trasp_mat_dest_prova_/.test(n)) return 'Sala Orologio';
    if (/^replica_luogo_|^trasp_mat_dest_replica_/.test(n)) return 'Sede Prova Replica ' + i;
    if (/^spazio_replica_\d+_altro$/.test(n)) return 'Sede Prova Replica ' + /_(\d+)_altro$/.exec(n)[1];
    if (/^dot_prestito_ritiro_data_/.test(n)) return '09/03/2031';
    if (/furg_consegna/.test(n)) return '20:00';
    if (/furg_ritiro/.test(n)) return '23:00';
    if (n === 'data_evento') return '15/03/2031';
    if (n === 'data_evento_fine') return '17/03/2031';
    if (/^dataconcerto_data_/.test(n)) return (16 + i) + '/03/2031';
    if (/^replica_rientro_data_/.test(n)) return (16 + 7 * i) + '/03/2031';
    if (/^replica_rientro_ora_/.test(n)) return '12:00';
    if (/^replica_(data|partenza_data)_/.test(n)) return (15 + 7 * i) + '/03/2031';
    if (/^dot_prestito_luogo_/.test(n)) return 'Sede Prestito Prova ' + n.slice(19);
    if (/^dot_struttura_nota_/.test(n)) return 'Già presente nella struttura di prova';
    if (/^determina_voce_/.test(n)) return 'Voce determina prova ' + i;
    if (n === 'alloggio_arrivo') return '14/03/2031';
    if (n === 'alloggio_notti') return '4';
    if (n === 'alloggio_partenza') return '18/03/2031';
    if (/ritiro_data/.test(n)) return '13/03/2031';
    if (/riconsegna_data|rientro_data/.test(n)) return '31/03/2031';
    if (/scadenza_data/.test(n)) return '20/02/2031';
    if (/^prev\w*_data_/.test(n)) return '05/02/2031';
    if (/^determina_data_/.test(n)) return '25/02/2031';
    if (ph === 'GG/MM/AAAA') return '14/03/2031';
    // orari
    if (n === 'ora_evento' || /^replica_ora_|^dataconcerto_ora_/.test(n)) return '21:00';
    if (/^prova_inizio_/.test(n)) return '15:00';
    if (/^prova_fine_/.test(n)) return '18:30';
    if (/partenza_ora|furg_partenza/.test(n)) return '14:00';
    if (/rientro_ora|furg_rientro/.test(n)) return '23:30';
    if (/scadenza_ora/.test(n)) return '12:00';
    if (/ritiro_ora|riconsegna_ora/.test(n)) return '10:00';
    if (/^programma_orario_/.test(n)) return (9 + i) + ':00';
    if (/orario/.test(n)) return '14:00–19:00';
    if (ph === '__:__' || ph === 'HH:MM') return '10:00';
    // numeri, importi, dati delle ditte (tutti inventati)
    if (/_importo_/.test(n)) return ['1.234,56', '980,00', '12.000,00'][(i - 1) % 3];
    if (/doc_est_compenso/.test(n)) return '1.500,00';
    if (/_piva_/.test(n)) return '0000000000' + i;
    if (/_iban_/.test(n)) return 'IT00X0000000000000000000' + String(i).padStart(3, '0');
    if (/_prot_|prot_richiesta/.test(n)) return '00' + i + '/2031';
    if (/^determina_num_/.test(n)) return String(100 + i);
    if (/^brano_nato_/.test(n)) return String(1800 + i);
    if (/^brano_morto_/.test(n)) return String(1860 + i);
    if (/^brano_durata_|musica_durata/.test(n)) return (10 + i) + ':00';
    if (n === 'durata') return '1h30';
    if (/notti/.test(n)) return '1';
    if (/^dot_(concerto_)?[a-z_]+$/.test(n) && !/_n$/.test(n) && !/^dot_(prestito|struttura|disp)/.test(n) && el.type !== 'textarea') {
      if (n === 'dot_altro' || n === 'dot_concerto_altro') return '1 stendardo di prova';
      return String(/leggii/.test(n) ? 28 : /sedie/.test(n) ? 40 : 1);
    }
    if (/^org_/.test(n)) return '2';
    if (/^dist_(doc|stu|est)_/.test(n)) return '1';
    if (el.type === 'number' || ph === '0' || /_gg_|persone|studenti|trasporto_\d|capienza/.test(n)) return /capienza_sala/.test(n) ? '120' : '3';
    if (/_indirizzo_/.test(n)) return 'Via Inventata ' + i + ', 00000 Paese Prova';
    if (/_ditta_/.test(n)) return 'Ditta Prova ' + n.split('_')[0].replace('prev', '') + ' ' + i;
    if (/_nome/.test(n)) return 'Nome Prova ' + n.split('_')[0] + ' ' + i;
    if (/luogo|dest/.test(n)) return 'Sede Prova ' + i;
    return 'Testo di prova ' + n + (el.tagName === 'TEXTAREA' ? ' — àèéìòù «virgolette»' : '');
  }
  let compilati = 0;
  for (const el of document.querySelectorAll('input[name], select[name], textarea[name]')) {
    if (el.type === 'hidden' || el.disabled || el.readOnly) continue;
    if (el.type === 'checkbox' ? el.dataset.genFatto : el.value !== '') continue;
    if (el.type !== 'checkbox' && el.closest('[style*="display: none"], [style*="display:none"]')) continue;
    const v = valore(el);
    if (v === undefined || v === '') continue;
    if (el.type === 'checkbox') { el.dataset.genFatto = '1'; if (el.checked === v) continue; el.checked = v; }
    else el.value = v;
    ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
    compilati++;
  }
  return compilati;
}

async function apriPagina(browser, m, progetto) {
  const page = await browser.newPage({ locale: 'it-IT', timezoneId: 'Europe/Rome' });
  const log = [];
  await page.addInitScript(d => { window.__FINTO_DB_INIZIALE = d; window.__FINTO_DB_RITARDO_LETTURA = 0; }, { progetti: { [m.id]: progetto } });
  await page.route('**/*', async route => {
    const url = route.request().url(); const host = new URL(url).hostname;
    if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') return route.fulfill({ status: 200, body: '' });
    if (/(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com)$/i.test(host)) { log.push('BLOCCATA ' + url); return route.abort('blockedbyclient'); }
    if (host === 'www.gstatic.com' && url.includes('/firebasejs/')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: FINTO_FIRESTORE });
    if (LOCALI[url]) return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(LOCALI[url], 'utf8') });
    if (host === '127.0.0.1' || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort('blockedbyclient');
  });
  page.on('dialog', d => { log.push('FINESTRA ' + d.type() + ': ' + d.message().slice(0, 120)); return d.type() === 'confirm' ? d.accept() : d.dismiss(); });
  page.on('pageerror', e => log.push('ECCEZIONE ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') log.push('CONSOLE ' + msg.text().slice(0, 200)); });
  await page.clock.setFixedTime(new Date(2031, 0, 15, 10, 0, 0));
  await page.goto('http://127.0.0.1:' + PORTA + '/' + m.file + '?id=' + m.id + '&ruolo=responsabile');
  await page.waitForTimeout(2500);
  return { page, log };
}

async function generaModulo(browser, sigla) {
  const m = MODULI[sigla];
  const metadati = metadatiDiProva(sigla, m);
  let precedente = null;
  for (let giro = 0; giro < 6; giro++) {
    const progetto = { metadati, stato: {}, dati_referente: precedente ? precedente.dati_referente : { data_evento: '15/03/2031' }, dati_responsabile: precedente ? precedente.dati_responsabile : {} };
    const { page, log } = await apriPagina(browser, m, progetto);
    if (giro === 0) {
      await page.evaluate(aggiungiRigheReferente);
      await page.waitForTimeout(300);
      await page.evaluate(() => { document.querySelectorAll('#repliche-body [data-uid]').forEach(r => { if (typeof addRefLocale === 'function') addRefLocale(r.getAttribute('data-uid')); }); });
    }
    // Più passate: compilare un campo può far comparire altre parti della pagina.
    for (let passata = 0; passata < 10; passata++) {
      if (giro === 0 && passata === 4) await page.evaluate(aggiungiRigheResponsabile);
      const n = await page.evaluate(compilaCampiVuoti, sigla);
      await page.waitForTimeout(500);
      if (n === 0 && passata >= 5) break;
    }
    await page.evaluate(() => { salvaReferenteSuFirestore(); salvaResponsabileSuFirestore(); });
    await page.waitForTimeout(3500);
    const avviso = await page.evaluate(() => { verificaCoerenzaProgetto(); const e = document.getElementById('avviso-coerenza-progetto'); return e && e.style.display !== 'none' ? e.innerText.replace(/\n+/g, ' | ') : ''; });
    const doc = await page.evaluate(id => window.__fintoDb.documento('progetti', id), m.id);
    await page.close();
    if (log.length) console.log(sigla, 'giro', giro, '— segnalazioni:\n  ' + log.join('\n  '));
    if (avviso) console.log(sigla, 'giro', giro, '— avviso di congruità:', avviso);
    const stabile = precedente && JSON.stringify([doc.dati_referente, doc.dati_responsabile]) === JSON.stringify([precedente.dati_referente, precedente.dati_responsabile]);
    precedente = doc;
    if (stabile) break;
  }
  Object.assign(precedente.dati_referente, CORREZIONI_BUG_NOTI[sigla] || {});
  const finale = { metadati, stato: {}, dati_referente: precedente.dati_referente, dati_responsabile: precedente.dati_responsabile };
  const file = path.join(DIR_TEST, 'progetti-prova', 'completo-' + sigla.toLowerCase() + '.json');
  fs.writeFileSync(file, JSON.stringify(finale, null, 2) + '\n');
  console.log(sigla, '→', path.relative(DIR_TEST, file), '(referente ' + Object.keys(finale.dati_referente).length + ' campi, responsabile ' + Object.keys(finale.dati_responsabile).length + ')');
}

(async () => {
  const quali = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODULI);
  const server = spawn('node', [path.join(__dirname, 'server-statico.js')], { env: { ...process.env, PORTA_TEST: String(PORTA) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  try {
    for (const sigla of quali) await generaModulo(browser, sigla);
  } finally {
    await browser.close();
    server.kill();
  }
})();
