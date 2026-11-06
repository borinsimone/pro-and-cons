# A mente

Un taccuino personale per raccogliere pro e contro, ritrovare gli argomenti e segnare le riflessioni concluse. L’archivio parte vuoto e viene salvato nel localStorage del browser.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

Apri http://localhost:3000 per lo sviluppo locale. Il service worker si registra nella build di produzione. Dopo la prima apertura online, puoi riaprire il taccuino anche offline.

Per installare l’app su iPhone, apri il sito in Safari e scegli **Condividi → Aggiungi alla schermata Home**. Su Android, apri il menu di Chrome e scegli **Installa app** o **Aggiungi a schermata Home**.

GitHub Actions esegue lint, build e deploy statico su GitHub Pages a ogni push su `main`. Il workflow si può avviare anche dalla scheda Actions. In Settings → Pages, la sorgente è GitHub Actions.
