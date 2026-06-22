import { defineConfig, devices } from '@playwright/test';

export const API_BASE_URL = process.env.BASE_URL_API || 'http://localhost:8080';
export const UI_BASE_URL = process.env.BASE_URL_UI || 'http://localhost:3000';
export const KC_BASE_URL = process.env.KC_URL || 'http://localhost:8180';
export const KC_REALM = process.env.KC_REALM || 'ttapi';
export const KC_CLIENT_ID = process.env.KC_CLIENT_ID || 'ttapi-client';

export const KC_TOKEN_URL = `${KC_BASE_URL}/realms/${KC_REALM}/protocol/openid-connect/token`;

export const USERS = {
  alpha: { username: 'alpha', password: 'Test1234!', tenant: 'alpha' },
  beta: { username: 'beta', password: 'Test1234!', tenant: 'beta' },
  gamma: { username: 'gamma', password: 'Test1234!', tenant: 'gamma' },
};

export type TenantName = 'alpha' | 'beta' | 'gamma';

export const AUTH_STATE_DIR = '.auth';
export const authStatePath = (tenant: TenantName) =>
  `${AUTH_STATE_DIR}/${tenant}.json`;

export const VALID_SERVICE_ID_MIN = 100001;
export const VALID_SERVICE_ID_MAX = 100030;

export default defineConfig({
  testDir: './e2e/tests',
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  globalSetup: 'e2e/helpers/global-setup.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  projects: [
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
      use: {
        baseURL: API_BASE_URL,
        storageState: authStatePath('alpha'),
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'ui-chrome',
      testMatch: '**/tests/ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: UI_BASE_URL,
        storageState: authStatePath('alpha'),
        video: 'on-first-retry',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  outputDir: 'test-results',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});
