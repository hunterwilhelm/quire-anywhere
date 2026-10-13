import type { ApiRequest, ApiResponse } from "./_lib/types";
import { cors, exchangeToken, handleOptions, methodNotAllowed } from "./_lib/quire";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handleOptions(req, res)) return;
  cors(req, res);
  if (req.method !== "POST") return methodNotAllowed(res);

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const { grant_type: grantType, refresh_token: refreshToken } = body;
  if (grantType !== "refresh_token" || typeof refreshToken !== "string" ||
      refreshToken.length === 0 || refreshToken.length > 8192) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  try {
    const result = await exchangeToken({ grant_type: "refresh_token", refresh_token: refreshToken });
    result.status = result.error || !result.access_token ? "token.denied" : "token.success";
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (error) {
    console.error("Token refresh failed:", error instanceof Error ? error.message : "unknown error");
    res.status(502).json({ status: "token.denied" });
  }
}
