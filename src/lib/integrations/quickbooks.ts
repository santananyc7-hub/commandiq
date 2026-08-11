import type { QuickBooksConnection } from "@/lib/types";
import { quickBooksDemo } from "@/lib/demo/data";

/**
 * QuickBooks Online integration layer (§17).
 *
 * This is the extension point for the only mandatory V1 external integration.
 * It builds the OAuth2 authorization URL and exchanges the code for tokens
 * using the official Intuit endpoints. Credentials come exclusively from the
 * environment — nothing is hardcoded and no secret is ever sent to the client.
 *
 * When credentials are absent the app runs in demo mode with a seeded, clearly
 * labeled connection so the entire product is explorable without Intuit setup.
 */

const AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const SCOPE = "com.intuit.quickbooks.accounting";

export interface QboConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "sandbox" | "production";
}

/** Read config from the environment. Returns null if not fully configured. */
export function getQboConfig(): QboConfig | null {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return {
    clientId,
    clientSecret,
    redirectUri,
    environment: (process.env.QUICKBOOKS_ENVIRONMENT as "sandbox" | "production") ?? "sandbox",
  };
}

export function isQboConfigured(): boolean {
  return getQboConfig() !== null;
}

/** Build the Intuit authorization URL for the OAuth2 handshake. */
export function buildAuthUrl(config: QboConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: config.redirectUri,
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export interface QboTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: number;
}

/** Exchange an authorization code for bearer tokens (official token endpoint). */
export async function exchangeCode(
  config: QboConfig,
  code: string,
  realmId: string
): Promise<QboTokens> {
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    realmId,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/**
 * Resolve the current connection status. In production this reads persisted
 * tokens/sync metadata; in demo mode it returns the seeded connection.
 */
export function getConnection(): QuickBooksConnection {
  if (!isQboConfigured()) {
    return quickBooksDemo;
  }
  // Live credentials configured but no persisted tokens yet → ready to connect.
  return {
    status: "disconnected",
    realmId: null,
    companyName: null,
    lastSync: null,
    lastError: null,
    entities: [],
  };
}

/** Entities CommandIQ imports/normalizes on each sync (§17). */
export const SYNCED_ENTITIES = [
  "Accounts",
  "Chart of Accounts",
  "Profit & Loss",
  "Balance Sheet",
  "Vendors",
  "Bills",
  "Bill Payments",
  "Invoices",
  "Payments",
  "Purchases",
  "Customers",
] as const;
