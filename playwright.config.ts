import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export const authStatePath = path.join(
  __dirname,
  'playwright',
  '.auth',
  'user.json'
);

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  timeout: 90_000,

  expect: {
    timeout: 15_000,
  },

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    headless: process.env.CI ? true : false,

    viewport: {
      width: 1600,
      height: 1000,
    },

    permissions: [
  'clipboard-read',
  'clipboard-write',
],

    locale: 'en-GB',

    timezoneId: process.env.TEST_TIME_ZONE || 'Europe/London',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    actionTimeout: 15_000,

    navigationTimeout: 45_000,
  },

  projects: [
  {
    name: 'excel-chrome',
    testMatch: /.*\.spec\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      channel: 'chrome',
      storageState: authStatePath,
    },
  },
  ],

  outputDir: 'test-results',
});