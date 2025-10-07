# 🧪 Desafio QA – Fleet Manager

Projeto desenvolvido como parte de um desafio técnico de **Qualidade de Software (QA)**, com o objetivo de validar as principais funcionalidades do sistema **Fleet Manager** através de **testes automatizados com Cypress**, bem como **documentar cenários de teste** e **reportar bugs** encontrados.

---

## 🎯 Objetivo

Avaliar o comportamento do sistema [Fleet Manager – Avantsoft](https://qe-test.recrutamento.avantsoft.com.br/) por meio de:

- ✅ **Código-fonte dos testes automatizados** (Cypress + TypeScript)  
- 🐞 **Relatório dos bugs encontrados** e sugestões de melhoria  
- 📄 **Documentação dos cenários de teste**

---

## ⚙️ Estrutura do Projeto

---

### 🧩 Execução dos Testes

- Para **executar toda a suíte de testes** (modo headless):  
  ```bash
  npx cypress run
  npx cypress open
  npm run generationreport
  ```
---

💡 **Estratégia de Testes**

- **Nível de teste:** Funcional e regressão

- **Tipo de teste:** End-to-end (E2E)

- **Ferramentas:** Cypress 13 + TypeScript + Mochawesome Reporter

**Abordagem:**

- Uso de Page Objects para manter o código limpo e reutilizável
- Cobertura de cenários positivos, negativos e de exceção
- Evidências automáticas (screenshots e vídeos)
- Registro de bugs com severidade e sugestão de melhoria

---

# 📋 Cenários de Teste – Desafio Fleet Manager

Os cenários de teste abaixo representam a cobertura total do sistema **Fleet Manager** e estão detalhados na **planilha de casos de teste** com pré-condições, dados, passos e resultados esperados.

📄 **Documento Final de Requisitos e Testes**  
[📘 FleetManager](https://drive.google.com/file/d/1Ahro3rtG2HjevjiXWI_TaD7-CO7wL2gp/view?usp=drive_link)

📎 **Planilha completa de casos de teste:** 

[Login](https://docs.google.com/spreadsheets/d/1W9PHdeASPh7T1NfMro6lrxXgXMsruzuW0sIbbXyfC-8/edit?usp=sharing)

---

[Home](https://docs.google.com/spreadsheets/d/1W9PHdeASPh7T1NfMro6lrxXgXMsruzuW0sIbbXyfC-8/edit?usp=sharing)

---

## 🔐 Login
- LGN-001 — Sucesso: login com e-mail e senha válidos  
- LGN-002 — Enter no campo senha executa login  
- LGN-101 — Validação: e-mail malformado  
- LGN-102 — Validação: senha incorreta  
- LGN-103 — Validação: usuário inexistente  
- LGN-104 — Validação: campos vazios  
- LGN-202 — Rota protegida sem sessão  
- LGN-203 — Logout: redirecionamento para `/login`

---

## 📊 Dashboard e KPIs
- CT-001 — Exibir KPIs  
- CT-001A — Total de veículos inicia em 8  
- CT-001B — Veículos Alugados inicia em 1  
- CT-001C — Receita Total inicia em R$ 1.850  

---

## 🚗 Busca e Listagem
- CT-002 — Buscar por modelo  
- CT-003 — Buscar por placa  
- CT-004 — Busca sem resultados  

---

## 💳 Aluguel e Pagamento
- CT-005 — Alugar veículo disponível  
- CT-006 — Bloquear aluguel de veículo Alugado  
- CT-007 — Bloquear aluguel de veículo em Manutenção  
- CT-008 — KPI Total não altera ao alugar  
- CT-009 — Receita Total soma preços/dia dos alugados  
- CT-010 — Prevenir duplicidade no clique de “Alugar”  
- CT-011 — Atualização do KPI “Veículos Alugados” após novo aluguel  
- CT-012 — Logout encerra sessão e redireciona  
- CT-013 — Aplicar cupom subtrai R$ 50 do subtotal  
- CT-014 — Subtotal < 50 ⇒ aluguel grátis (R$ 0)  
- CT-015 — Veículo não deve ficar “Alugado” antes do pagamento  
- CT-016 — Cancelar pagamento mantém veículo disponível  
- CT-017 — KPIs atualizam após novo aluguel  
- CT-018 — Confirmar pagamento exige confirmação do meio  
- CT-019 — Devolver/Cancelar aluguel deve existir  
- CT-020 — Aplicar cupom subtrai R$ 50 do subtotal  
- CT-021 — Subtotal < 50 ⇒ aluguel grátis (R$ 0)  
- CT-022 — Veículo não deve ficar “Alugado” antes do pagamento  
- CT-023 — Cancelar pagamento mantém veículo disponível  
- CT-024 — Devolver/Cancelar aluguel deve existir  

---

> 📘 **Observação:** Todos os testes acima são automatizados em Cypress, cobrem **cenários positivos, negativos e de exceção**, e possuem rastreabilidade com os **bugs reportados nas issues** correspondentes do GitHub.

---

# 🧾 Relatórios e Evidências

| Tipo | Descrição |
|------|------------|
| 📄 **Relatórios Mochawesome** | Geração automática de relatórios em HTML e JSON, armazenados em `cypress/reports/` |
| 🖼️ **Screenshots** | Capturados automaticamente em falhas de teste (`cypress/screenshots/`) |
| 🎥 **Vídeos** | Registros de execução completa dos testes (`cypress/videos/`) |
| 🔗 **Links nas Issues** | Cada bug registrado no GitHub contém link direto para as evidências correspondentes |
| 📊 **Planilha de Casos de Teste (Google Sheets)** | Versão tabular dos cenários e rastreabilidade com colunas: *Pré-condição*, *Passos*, *Resultado esperado*, *Bug relacionado* |

> Todos os relatórios e evidências estão organizados por suíte (Login, Dashboard, Pagamento).

---

## ⚙️ Stack Técnica e Execução dos Testes

| Componente | Descrição |
|-------------|------------|
| **Cypress** | Framework principal para testes End-to-End. Executado via `npx cypress run` e `npx cypress open`. |
| **TypeScript** | Linguagem utilizada para tipagem estática e melhor manutenção do código. |
| **Mochawesome** | Biblioteca usada para gerar relatórios HTML e JSON de forma independente, através do script personalizado `generationreport`. |
| **Node.js + npm** | Ambiente e gerenciador de pacotes para instalação e execução das dependências do projeto. |


> 💡 A stack foi escolhida por permitir testes rápidos, legíveis e totalmente integráveis com CI/CD.

---

# ✨ Autor

**👩🏻‍💻 Emilly Rodrigues**  
📧 [emillycarolinearruda@gmail.com](mailto:emillycarolinearruda@gmail.com)  
🔗 [LinkedIn](https://www.linkedin.com/in/emilly-rodrigues-qa/)  
💻 [GitHub](https://github.com/em1srod)

> _“A qualidade não é um ato, é um hábito.”_ – Aristóteles
