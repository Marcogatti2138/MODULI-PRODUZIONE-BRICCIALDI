// Testo dei documenti generati da una pagina già aperta, per confrontarli.
// I PDF non vengono salvati: si registra il testo che la pagina passa a jsPDF.
// Usato da documenti-una-data.spec.js e m4-documenti-piu-giorni.spec.js.

// Gira nella pagina. "quali": elenco di nomi di DOCUMENTI_M4 o 'determinaAcquisti'.
function testiDocumenti({ quali, cfgDetermina }) {
  const Originale = window.jspdf.jsPDF;
  const leggi = id => (document.getElementById(id) || {}).value || '';
  const pdf = genera => {
    const testi = [];
    window.jspdf.jsPDF = function(...a) {
      const d = new Originale(...a);
      const text = d.text.bind(d);
      d.text = (t, ...r) => { testi.push(Array.isArray(t) ? t.join(' ') : String(t)); return text(t, ...r); };
      d.save = () => {};
      return d;
    };
    try { genera(); } finally { window.jspdf.jsPDF = Originale; }
    return testi.join('\n');
  };
  const DOCUMENTI = {
    determinaAcquisti: () => { generaBozzaDeterminaNoleggio(1, cfgDetermina); return leggi('testo-determina-noleggio'); },
    richiestaNoleggio: () => { generaRichiestaNoleggio(); return leggi('testo-noleggio'); },
    centralino: () => (costruisciTestoCentralino().lines || []).join('\n'),
    dotazioneMateriale: () => { generaRichiestaDotazioneMateriale(); return leggi('testo-dotazione-materiale'); },
    determinaTrasportoPersone: () => { generaBozzaDeterminaTrasportoPersone(); return leggi('testo-determina-trper'); },
    determinaTrasporti: () => { generaBozzaDeterminaTrasporti(1); return leggi('testo-determina-trasporti'); },
    pdfPreventivoNoleggio: () => pdf(() => generaPDFRichiestaPreventivoNoleggio(1, cfgDetermina)),
    pdfPreventivoTrasportoPersone: () => pdf(() => generaPDFRichiestaPreventivoTrasportoPersone()),
    sintesiDate: () => { aggiornaSintesiCompleta(); return ['sint_data', 'sint_luogo', 'sint_repliche'].map(id => (document.getElementById(id) || {}).textContent).join(' | '); }
  };
  const out = {};
  for (const nome of quali) out[nome] = DOCUMENTI[nome]();
  return out;
}

const DOCUMENTI_M4 = ['determinaAcquisti', 'richiestaNoleggio', 'centralino', 'dotazioneMateriale', 'determinaTrasportoPersone',
  'determinaTrasporti', 'pdfPreventivoNoleggio', 'pdfPreventivoTrasportoPersone', 'sintesiDate'];

// Lo stesso progetto con la sola data principale: via repliche e date di concerto oltre la prima,
// e i campi del Responsabile legati a loro (spazi, assistenza, trasporti delle repliche).
function conUnaSolaData(progetto) {
  const p = JSON.parse(JSON.stringify(progetto));
  const via = k => /replica/.test(k) || /^dataconcerto_\w+_([2-9]|\d\d)$/.test(k);
  for (const sez of ['dati_referente', 'dati_responsabile']) {
    for (const k of Object.keys(p[sez] || {})) if (via(k)) delete p[sez][k];
  }
  return p;
}

module.exports = { testiDocumenti, DOCUMENTI_M4, conUnaSolaData };
