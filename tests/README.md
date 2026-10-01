# Test automatici

Solo per lo sviluppo: le pagine pubblicate non caricano niente da questa cartella.

## Installazione (una volta)

```
cd tests
npm install
npm run installa-browser    # Chromium in tests/.browsers, serve solo ai test end-to-end
```

`node_modules/` e `.browsers/` sono esclusi da git.

## Esecuzione

```
npm run test:unit    # funzioni pure, con Node, senza browser né Firestore
npm run test:e2e     # percorsi nei moduli, con Playwright
```

## Regole

- I test non leggono né scrivono mai sul Firestore di produzione.
- `helpers/estrai-funzioni.js` legge le funzioni direttamente dagli HTML: i test
  provano sempre il codice attuale delle pagine, senza modificarle.

## Progetti di prova

`progetti-prova/completo-m1.json` … `completo-m4.json`: un progetto completo per
modulo (tutte le sezioni, righe aggiunte, ogni tipo di disponibilità della
Dotazione), con dati solo inventati e date coerenti ("oggi" = 15/01/2031).
`e2e/progetti-prova.spec.js` controlla che si riaprano senza perdere niente e
che restino completi: se una pagina riceve un campo nuovo, il test lo segnala
e il progetto di prova va aggiornato.
