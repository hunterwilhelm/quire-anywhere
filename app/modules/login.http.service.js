import { AppConfig } from "./app.config.js";
import { AppUtils } from "./app.utils.js";
import { ApiConfig } from "./api.config.js";

export class LoginHttpService {
  constructor() {
    this.state = AppUtils.getRandomString();
  }

  getAuthorizationUrl(redirectUri) {
    const url = new URL(ApiConfig.authorizationUrl);
    url.searchParams.set("client_id", AppConfig.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", this.state);
    return url.toString();
  }

  static async postCode(code, redirectUri) {
    const formData = new URLSearchParams({grant_type: "authorization_code", code, redirect_uri: redirectUri});
    return this.post(AppConfig.tokenUrl, formData);
  }

  static async postRefresh(refreshToken) {
    const formData = new URLSearchParams({grant_type: "refresh_token", refresh_token: refreshToken});
    return this.post(AppConfig.refreshUrl, formData);
  }

  static async post(url, formData) {
    try {
      const response = await fetch(url, {method: "POST", body: formData});
      if (!response.ok) return AppConfig.httpError;
      try {
        return await response.json();
      } catch (error) {
        return AppConfig.jsonError;
      }
    } catch (error) {
      return AppConfig.httpError;
    }
  }
}
