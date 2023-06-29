// jest-puppeteer.config.cjs

/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    // headless: false,
    slowMo: 50,
  },
  server: {
    command: "npm run start",
    port: 8000,
    launchTimeout: 15000,
    debug: true,
  },
};
