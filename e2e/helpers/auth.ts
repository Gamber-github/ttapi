import fs from 'fs';
import { authStatePath, TenantName } from '../../playwright.config';

const tokenCache: Record<string, string> = {};

export function tokenFor(tenant: TenantName): string {
  if (tokenCache[tenant]) {
    return tokenCache[tenant];
  }

  const filePath = authStatePath(tenant);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Auth file for tenant ${tenant} not found at ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);

  if (!json.__ttapi_access_token) {
    throw new Error(`__ttapi_access_token missing from ${filePath}`);
  }

  tokenCache[tenant] = json.__ttapi_access_token;
  return json.__ttapi_access_token;
}

export function bearerHeader(tenant: TenantName) {
  return { Authorization: `Bearer ${tokenFor(tenant)}` };
}
