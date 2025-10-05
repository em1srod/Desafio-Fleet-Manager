// cypress.config.cjs (CommonJS)
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://qe-test.recrutamento.avantsoft.com.br', // ajuste conforme necessário
    viewportWidth: 1366,
    viewportHeight: 768,
    video: true,
    retries: { runMode: 1, openMode: 0 },
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'reports',
      overwrite: false,
      html: false,
      json: true,
      charts: true,
      reportPageTitle: 'E2E Login – Cypress',
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false
    }
  },

  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos'
});
