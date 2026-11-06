# Pro and Cons

Base Next.js con App Router, TypeScript ed ESLint.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

Apri http://localhost:3000 per lo sviluppo locale. La build statica è in `out/`.

GitHub Actions esegue lint, build e deploy su GitHub Pages a ogni push su `main`. Il workflow si può avviare anche manualmente dalla scheda Actions. In Settings → Pages, la sorgente deve essere GitHub Actions.
