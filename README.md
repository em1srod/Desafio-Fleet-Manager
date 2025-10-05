# E2E – Fluxo de Login (Cypress)

Suite E2E para o fluxo de **Login** (LGN-001..105) com **evidências automáticas** (vídeo, screenshots) e **relatório HTML Mochawesome**. Inclui **CI com GitHub Actions**.

## Scripts
- `npm run cy:open` – Abre o Cypress no modo interativo.
- `npm run cy:run` – Executa os testes em modo headless (gera vídeos/prints e JSON dos testes).
- `npm run report` – Gera relatório HTML unificado em `reports/html/index.html`.

## Ajustes necessários
- Configure o `baseUrl` em `cypress.config.ts` (ex.: ambiente de homologação).
- Garanta que os seletores `data-testid` existam na aplicação:

```
[data-testid="email"]
[data-testid="senha"]
[data-testid="entrar"]
[data-testid="alerta-erro"]
[data-testid="card-login"]
```

## Evidências
- Vídeos: `cypress/videos`
- Screenshots (falhas): `cypress/screenshots`
- Relatório HTML: `reports/html/index.html`

## CI (GitHub Actions)
Workflow em `.github/workflows/e2e.yml`:
- Instala dependências
- Roda `cypress run`
- Gera relatório Mochawesome (`npm run report`)
- Publica artefatos (`reports/html`, `cypress/videos`, `cypress/screenshots`)
