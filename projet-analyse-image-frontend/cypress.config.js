const { defineConfig } = require('cypress');

module.exports = defineConfig({
  baseUrl: "http://localhost:3000",
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 5000,
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  experimentalStudio: true,
  e2e: {
    setupNodeEvents(on, config) {
      return config;
    },
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"
  }
});
