const path = require('path');
const { defineConfig } = require('@playwright/test');

// Il browser dei test sta in tests/.browsers, non nella cache di sistema.
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(__dirname, '.browsers');

const PORTA = 8765;

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:' + PORTA,
    browserName: 'chromium',
    headless: true,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    acceptDownloads: true
  },
  webServer: {
    command: 'node helpers/server-statico.js',
    url: 'http://127.0.0.1:' + PORTA + '/Dashboard_Briccialdi.html',
    reuseExistingServer: false,
    env: { PORTA_TEST: String(PORTA) }
  }
});
