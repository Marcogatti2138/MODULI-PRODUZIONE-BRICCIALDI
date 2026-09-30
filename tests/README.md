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
