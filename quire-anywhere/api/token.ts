import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { cors, exchangeToken, handleOptions, methodNotAllowed, requiredEnv } from "./_lib/quire.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handleOptions(req, res)) return;
  cors(req, res);
  if (req.method !== "POST") return methodNotAllowed(res);

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const { code, redirect_uri: redirectUri } = body;
  if (typeof code !== "string" || code.length === 0 || code.length > 4096 ||
      typeof redirectUri !== "string" || !/^https:\/\/[a-p]{32}\.chromiumapp\.org\/$/.test(redirectUri)) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  try {
    const result = await exchangeToken({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
    result.status = result.error || !result.access_token ? "token.denied" : "token.success";
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (error) {
    console.error("Authorization code exchange failed:", error instanceof Error ? error.message : "unknown error");
    res.status(502).json({ status: "token.denied" });
  }
}
