import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  authStatePath,
  KC_CLIENT_ID,
  KC_TOKEN_URL,
  TenantName,
  UI_BASE_URL,
  USERS,
} from '../../playwright.config';

async function fetchToken(username: string, password: string) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KC_CLIENT_ID,
    username,
    password,
  });

  const res = await fetch(KC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to get token for ${username}: ${res.status}`);
  }

  const json = (await res.json()) as any;
  if (!json.access_token) {
    throw new Error(`Response for ${username} missing access_token`);
  }

  return json.access_token;
}

export default async function globalSetup() {
  console.log(
    'Starting global setup: fetching tokens and capturing Keycloak cookies...',
  );

  const browser = await chromium.launch({ headless: true });
  const tenants = Object.keys(USERS) as TenantName[];

  for (const tenant of tenants) {
    const user = USERS[tenant];
    const token = await fetchToken(user.username, user.password);
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log(`Capturing browser session for tenant: ${tenant}...`);
      await page.goto(UI_BASE_URL);
      await page.locator('#username').fill(user.username);
      await page.locator('#password').fill(user.password);
      await page.locator('#kc-login').click();
      await page.waitForURL(`${UI_BASE_URL}/**`);

      const storageState = await context.storageState();
      const finalState = {
        ...storageState,
        __ttapi_access_token: token,
      };

      const filePath = authStatePath(tenant);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(finalState));
      console.log(` Saved combined auth state for [${tenant}]`);
    } catch (error) {
      console.error(`❌ Failed to capture UI session for ${tenant}:`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('Global setup finished successfully.');
}
