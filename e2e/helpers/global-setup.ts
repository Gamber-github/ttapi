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

function writeStorageState(tenant: TenantName, token: string) {
  const filePath = authStatePath(tenant);

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: UI_BASE_URL,
        localStorage: [{ name: 'access_token', value: token }],
      },
    ],
    __ttapi_access_token: token,
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(storageState));
  console.log(`Saved token for ${tenant}`);
}

export default async function globalSetup() {
  console.log('Starting global setup: fetching tokens...');

  const tenants = Object.keys(USERS) as TenantName[];

  for (const tenant of tenants) {
    const user = USERS[tenant];
    const token = await fetchToken(user.username, user.password);
    writeStorageState(tenant, token);
  }

  console.log('Global setup finished.');
}
