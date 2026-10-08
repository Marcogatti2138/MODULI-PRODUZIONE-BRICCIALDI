// Livello 1 — Documento Word delle Determine (costruisciDocDetermina, determina-legale.js).
// Impaginazione decisa da Marco (07/10/2026) sul modello della Personale Esterno:
// testo identico alla bozza; evidenziatore giallo solo sui [___ … ___], righe ⚠ in
// turchese, senza w:highlightCs (non valido per lo schema); tabella grigia dei
// DATO ATTO solo nella Personale; trattino di Word solo dove la bozza non lo scrive;
// firme in tabella senza bordi e non spezzabile; piè di pagina "Pagina X di Y".
// Tutti i dati sono inventati (bozze degli attesi e2e e testi costruiti qui).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const docx = require('docx');
const JSZip = require('jszip');
const { caricaFile } = require('../helpers/estrai-funzioni');

const importi = caricaFile('importi.js');
const legale = caricaFile('determina-legale.js', {
  parseImportoIt: importi.parseImportoIt, formattaImportoIt: importi.formattaImportoIt, calcolaIva22: importi.calcolaIva22,
  importoPerTesto: importi.importoPerTesto, importoInFormaChiara: importi.importoInFormaChiara,
  metadati: { id: '9601', titolo: 'Progetto di prova', delibera: '00', data_delibera: '01/01/2030' }
});

const ATTESI = require(path.join(__dirname, '..', 'e2e', 'attesi', 'm1-pulsanti.json'));

// Personale Esterno con deroga (RILEVATO CHE) e importo che fa scattare un avviso ⚠.
function bozzaPersonaleConAvviso() {
  const scelto = { ditta: 'Ditta Prova Uno', importo: '140.000,00', prot: '0001', data: '01/01/2030', indirizzo: 'Via Inventata 1, Paese Prova', piva: '00000000000' };
  return legale.costruisciTestoDeterminaPersonaleEsterno({
    scelto, preventivi: [scelto], protRichiesta: '0000', scadenzaDataRichiesta: '01/01/2030', scadenzaOraRichiesta: '12:00',
    elencoPersonale: ['Violino: Esecutore Prova'], capitolo: '0000', iban: '', applicaDeroga: true,
    dataEventoTesto: '01/02/2030', luogoEventoTesto: 'Sala Prova'
  }).join('\n');
}

const CASI = [
  { nome: 'Personale Esterno', tipo: 'personale', bozza: ATTESI.determinaPersonale },
  { nome: 'Personale Esterno (deroga, avviso ⚠)', tipo: 'personale', bozza: bozzaPersonaleConAvviso() },
  { nome: 'Trasporti', tipo: 'trasporti', bozza: ATTESI.determinaTrasporti },
  { nome: 'Noleggio/Service', tipo: 'noleggio', bozza: ATTESI.determinaNoleggio },
  { nome: 'Trasporto persone', tipo: 'trper', bozza: ATTESI.determinaTrasportoPersone }
];

async function parti(bozza, tipo) {
  const zip = await JSZip.loadAsync(await docx.Packer.toBuffer(legale.costruisciDocDetermina(docx, bozza, tipo, null)));
  const file = async n => { const f = zip.file(n); return f ? f.async('string') : ''; };
  const piedi = Object.keys(zip.files).filter(n => /^word\/footer\d*\.xml$/.test(n));
  return { documento: await file('word/document.xml'), piede: (await Promise.all(piedi.map(file))).join('') };
}

const decodifica = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const testoDi = xml => decodifica((xml.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(''));
const runs = xml => xml.match(/<w:r>[\s\S]*?<\/w:r>/g) || [];
const paragrafi = xml => xml.match(/<w:p>[\s\S]*?<\/w:p>/g) || [];
const tabelle = xml => xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || [];
const spazi = s => s.replace(/\s+/g, ' ').trim();

for (const c of CASI) {
  test(c.nome + ' — stesso testo della bozza, firme a parte', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const tabFirme = tabelle(documento).pop();
    const senzaFirme = documento.replace(tabFirme, '');
    const righe = c.bozza.split('\n');
    const inizio = righe.findIndex(r => r.trim() === 'Per la copertura finanziaria' || r.includes('\t'));
    const fine = righe.length - 1 - [...righe].reverse().findIndex(r => r.includes('\t'));
    const corpo = righe.slice(0, inizio).concat(righe.slice(fine + 1)).join('\n');
    assert.equal(spazi(paragrafi(senzaFirme).map(testoDi).join('\n')), spazi(corpo));
    const pezzi = righe.slice(inizio, fine + 1).join('\t').split('\t').map(s => s.trim()).filter(Boolean).sort();
    assert.deepEqual(paragrafi(tabFirme).map(testoDi).filter(Boolean).sort(), pezzi);
  });

  test(c.nome + ' — evidenziatore giallo solo sui campi da compilare, mai w:highlightCs', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    assert.doesNotMatch(documento, /highlightCs/);
    const gialli = runs(documento).filter(r => r.includes('<w:highlight w:val="yellow"/>')).map(testoDi);
    assert.deepEqual(gialli, c.bozza.match(/\[___[\s\S]*?___\]/g));
    gialli.forEach(g => assert.match(g, /^\[___[\s\S]*___\]$/));
  });

  test(c.nome + ' — righe ⚠ in turchese, il resto senza', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const avvisi = paragrafi(documento).filter(p => testoDi(p).startsWith('⚠'));
    assert.equal(avvisi.length, c.bozza.split('\n').filter(r => r.trim().startsWith('⚠')).length);
    if (c.nome.includes('⚠')) assert.ok(avvisi.length > 0, 'la bozza di prova deve avere almeno una riga ⚠');
    avvisi.forEach(p => runs(p).filter(r => !/\[___/.test(testoDi(r))).forEach(r => assert.match(r, /<w:highlight w:val="cyan"\/>/)));
    paragrafi(documento).filter(p => !testoDi(p).startsWith('⚠')).forEach(p => assert.doesNotMatch(p, /w:val="cyan"/));
  });

  test(c.nome + ' — tabella grigia dei DATO ATTO solo nella Personale Esterno', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const grigie = tabelle(documento).filter(t => t.includes('w:fill="F2F2F2"'));
    if (c.tipo !== 'personale') { assert.equal(grigie.length, 0); return; }
    assert.equal(grigie.length, 1);
    const righe = grigie[0].match(/<w:tr>[\s\S]*?<\/w:tr>/g);
    assert.equal(righe.length, 8);
    righe.forEach(r => {
      const [etichetta] = r.match(/<w:tc>[\s\S]*?<\/w:tc>/g).map(testoDi);
      assert.match(etichetta, /:$/, 'due punti nella cella dell\'etichetta: ' + etichetta);
      assert.match(r, /<w:cantSplit\/>/);
    });
    assert.ok(testoDi(grigie[0]).startsWith('Oggetto del contratto:'));
    assert.ok(testoDi(grigie[0]).includes('Tracciabilità (L. 136/2010):'));
  });

  test(c.nome + ' — firme: tabella senza bordi, non spezzabile, nomi in grassetto alla stessa altezza', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const tabFirme = tabelle(documento).pop();
    assert.match(tabFirme, /<w:cantSplit\/>/);
    assert.doesNotMatch(tabFirme, /w:val="single"/);
    const celle = tabFirme.match(/<w:tc>[\s\S]*?<\/w:tc>/g);
    assert.equal(celle.length, 2);
    const nomi = celle.map(cella => paragrafi(cella));
    assert.equal(nomi[0].length, nomi[1].length, 'stesso numero di righe nelle due colonne');
    nomi.forEach(p => {
      const nome = p[p.length - 1];
      assert.match(testoDi(nome), /^Dott\.ssa /);
      assert.match(nome, /<w:b\/>|<w:b w:val="true"\/>/);
      assert.ok(p.slice(-4, -1).every(v => testoDi(v) === ''), 'tre righe vuote sopra il nome');
    });
    assert.equal(testoDi(celle[1]).indexOf('Per la copertura finanziaria'), 0);
  });

  test(c.nome + ' — trattino di Word solo dove la bozza non lo scrive', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const numerati = paragrafi(documento).filter(p => p.includes('<w:numPr>'));
    numerati.forEach(p => assert.doesNotMatch(testoDi(p), /^[–-] /));
    paragrafi(documento).filter(p => /^[–-] /.test(testoDi(p))).forEach(p => {
      assert.doesNotMatch(p, /<w:numPr>/);
      assert.match(p, /w:hanging="283"/, 'trattino scritto con rientro sporgente: ' + testoDi(p).slice(0, 40));
    });
    if (c.tipo === 'personale') {
      const visti = c.bozza.split('\n').slice(c.bozza.split('\n').indexOf('VISTI') + 1).filter(r => r.trim()).slice(0, 6);
      assert.deepEqual(numerati.map(testoDi).filter(t => visti.includes(t)), visti);
      if (c.bozza.includes('RILEVATO CHE')) assert.ok(numerati.some(p => testoDi(p).startsWith('Dalla comprovata affidabilità')));
    } else {
      assert.equal(numerati.length, 0);
    }
  });

  test(c.nome + ' — piè di pagina "Pagina X di Y"', async () => {
    const { piede } = await parti(c.bozza, c.tipo);
    assert.equal(testoDi(piede), 'Pagina  di ');
    assert.match(piede, /PAGE[\s\S]*NUMPAGES/);
  });
}

test('Trasporti — l\'etichetta "– X:" delle altre Determine resta in grassetto con rientro', async () => {
  const { documento } = await parti(ATTESI.determinaTrasporti, 'trasporti');
  const etichetta = paragrafi(documento).find(p => testoDi(p).startsWith('– Importo del contratto:'));
  assert.match(etichetta, /<w:b\/>|<w:b w:val="true"\/>/);
  assert.match(etichetta, /w:hanging="283"/);
});

test('Bozza corretta a mano senza blocco firme: il Word si fa lo stesso, con il testo intero', async () => {
  const bozza = 'Amministrazione\n\nTesto di prova [___ campo ___].\n\nVISTI\nRiga di prova;';
  const { documento } = await parti(bozza, 'trasporti');
  assert.equal(spazi(paragrafi(documento).map(testoDi).join('\n')), spazi(bozza));
  assert.equal(tabelle(documento).length, 0);
});

// Grassetto: solo formule d'apertura, intestazioni, etichette, nomi in firma.
// Le sigle (CIG, IVA, DURC, ANAC…) dentro le frasi restano normali.
const GRASSETTI_AMMESSI = new Set([
  'ACCERTATA,', 'ACCERTATO', 'CONSIDERATA', 'CONSIDERATO', 'DATO ATTO', 'DATO ATTO,', 'PRESO ATTO', 'RAVVISATA', 'TENUTO CONTO', 'VISTA', 'VISTO',
  'DI AFFIDARE', 'DI DARE ATTO', 'DI DISPORRE', 'DI IMPEGNARE', 'DI NOMINARE',
  'IL DIRETTORE AMMINISTRATIVO', 'DETERMINA', 'PREMESSO CHE', 'PREMESSO che', 'RILEVATO CHE', 'VISTI',
  'Determina n.', '/', '[___ N. Determina ___]', '[___ anno ___]', 'OGGETTO:', 'Oggetto:', 'CIG', 'CIG:',
  'Oggetto del contratto:', 'Operatore economico affidatario:', 'Importo del contratto:', 'Modalità di svolgimento:',
  'Forma del contratto:', 'Modalità di scelta del contraente:', 'Copertura finanziaria:', 'Tracciabilità (L. 136/2010):',
  '– Fine che con il contratto si intende perseguire e relativo oggetto:', '– Importo del contratto:', '– Forma del contratto:',
  '– Modalità di scelta del contraente:', '– Clausole ritenute essenziali:',
  'Dott.ssa Susanna Fanizza', 'Dott.ssa Alessandra Angelucci', 'Dott.ssa Fanizza Susanna', 'Dott.ssa Angelucci Alessandra'
]);
const grassetti = xml => runs(xml).filter(r => /<w:b\/>/.test(r)).map(r => testoDi(r).trim()).filter(Boolean);

test('Tutte le Determine degli attesi (M1-M4) — in grassetto solo formule, intestazioni, etichette e nomi', async () => {
  const fs = require('fs');
  const dir = path.join(__dirname, '..', 'e2e', 'attesi');
  let quante = 0;
  for (const f of fs.readdirSync(dir)) {
    const attesi = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [voce, bozza] of Object.entries(attesi)) {
      if (!/^determina/.test(voce)) continue;
      quante++;
      const { documento } = await parti(bozza, voce === 'determinaPersonale' ? 'personale' : 'trasporti');
      grassetti(documento).forEach(g => assert.ok(GRASSETTI_AMMESSI.has(g), f + ' ' + voce + ': grassetto inatteso "' + g + '"'));
    }
  }
  assert.ok(quante >= 20, 'Determine trovate negli attesi: ' + quante);
});

test('Sigle in maiuscolo mai in grassetto, nemmeno a inizio riga scritta a mano', async () => {
  const bozza = [
    'CONSIDERATO che il CIG e l\'IVA al 22% sono indicati, verificato il DURC presso ANAC;',
    'IVA al 22% in regime di split payment;',
    'DURC regolare, U.P.B. 1.2.1;',
    'DI AFFIDARE alla ditta il servizio, CIG da richiedere;',
    'CONSIDERATORE di prova;'
  ].join('\n\n');
  const { documento } = await parti(bozza, 'trasporti');
  assert.deepEqual(grassetti(documento), ['CONSIDERATO', 'DI AFFIDARE']);
});

for (const c of CASI) {
  test(c.nome + ' — firme: ogni ruolo sopra il proprio nome', async () => {
    const { documento } = await parti(c.bozza, c.tipo);
    const [sinistra, destra] = tabelle(documento).pop().match(/<w:tc>[\s\S]*?<\/w:tc>/g).map(cella => paragrafi(cella).map(testoDi).filter(Boolean));
    assert.equal(sinistra[0], 'Il Direttore amministrativo');
    assert.match(sinistra[sinistra.length - 1], /Fanizza/);
    assert.deepEqual(destra.slice(0, 2), ['Per la copertura finanziaria', 'Il Direttore di ragioneria']);
    assert.match(destra[destra.length - 1], /Angelucci/);
  });
}
