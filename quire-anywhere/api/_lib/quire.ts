import type { ApiRequest, ApiResponse } from "./types";

export const CLIENT_ID = "HSP1ENUG8Zm9PK9zOxyLnxfP";
const TOKEN_URL = "https://quire.io/oauth/token";

export interface TokenResponse {
  access_token?: string;
  error?: string;
  status?: string;
  [key: string]: unknown;
}

export async function exchangeToken(params: Record<string, string>): Promise<TokenResponse> {
  const body = new URLSearchParams({
    ...params,
    client_id: CLIENT_ID,
    client_secret: requiredEnv("QUIRE_CLIENT_SECRET"),
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(6000),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Quire token endpoint returned an invalid response");
  }
  return result as TokenResponse;
}

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } };
  return runtime.process?.env[name];
}

export function requiredEnv(name: string): string {
  const value = runtimeEnv(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function cors(req: ApiRequest, res: ApiResponse): void {
  const origin = req.headers.origin;
  // Chrome extension IDs are installation-specific, so don't require a separate
  // deployment setting just to answer the extension's CORS preflight.
  if (origin && /^chrome-extension:\/\/[a-p]{32}$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

export function handleOptions(req: ApiRequest, res: ApiResponse): boolean {
  cors(req, res);
  if (req.method !== "OPTIONS") return false;
  res.status(204).end();
  return true;
}

export function methodNotAllowed(res: ApiResponse): void {
  res.setHeader("Allow", "POST, OPTIONS");
  res.status(405).json({ error: "method_not_allowed" });
}
