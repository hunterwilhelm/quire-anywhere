import { ApiDataService } from "./api.data.service.js";
import { AppConfig } from "./app.config.js";
import { AppStatusKeys } from "./app.status.keys.js";
import { LoginHttpService } from "./login.http.service.js";
import { StorageConstants } from "./storage.constants.js";
import { StorageService } from "./storage.service.js";

export class LoginDataService {
  constructor() {
    this._loginHttpService = new LoginHttpService();
  }

  async handleResponse(response) {
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      await StorageService.saveLocal(StorageConstants.QUIRE.ACCESS_TOKEN, response.access_token);
      await StorageService.saveLocal(StorageConstants.QUIRE.REFRESH_TOKEN, response.refresh_token);
      await StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN, response.expires_in);
      await StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE,
          ApiDataService.getExpireInAsDateString(response.expires_in));
      await StorageService.saveLocal(StorageConstants.QUIRE.LOGGED_IN, true);
      return true;
    }
    return false;
  }

  async isLoggedIn(loggedInFunction) {
    const quireLoggedIn = await StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN);
    if (quireLoggedIn) {
      const expiresInDate = await StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE);
      if (expiresInDate && new Date(expiresInDate) <= new Date()) {
        this.attemptRefreshToken(loggedInFunction);
      } else {
        loggedInFunction(quireLoggedIn);
      }
    } else {
      loggedInFunction(quireLoggedIn);
    }
  }

  async attemptRefreshToken(loggedInFunction) {
    const refreshToken = await StorageService.readLocal(StorageConstants.QUIRE.REFRESH_TOKEN);
    if (!refreshToken) {
      loggedInFunction(false);
      return;
    }
    const response = await LoginHttpService.postRefresh(refreshToken);
    const loggedIn = await this.handleResponse(response);
    loggedInFunction(loggedIn);
  }

  async logout(openQuireRevokePage) {
    await StorageService.clearAllStorage();
    if (openQuireRevokePage) {
      chrome.tabs.create({url: AppConfig.quireAppSettingsUrl});
    }
  }

  async askQuireToGrantAccess() {
    const redirectUri = chrome.identity.getRedirectURL();
    const expectedState = this._loginHttpService.state;
    await StorageService.saveLocal(StorageConstants.QUIRE.STATE, expectedState);
    const url = this._loginHttpService.getAuthorizationUrl(redirectUri);
    try {
      const callbackUrlText = await chrome.identity.launchWebAuthFlow({
        url,
        interactive: true,
      });
      const callbackUrl = new URL(callbackUrlText);
      if (callbackUrl.searchParams.get("state") !== expectedState) return "Sign-in could not be verified. Please try again.";
      if (callbackUrl.searchParams.has("error")) return callbackUrl.searchParams.get("error_description") || callbackUrl.searchParams.get("error");
      const code = callbackUrl.searchParams.get("code");
      if (!code) return "Quire did not return an authorization code.";

      const response = await LoginHttpService.postCode(code, redirectUri);
      return await this.handleResponse(response) || response.error || response.message || "Quire sign-in failed while exchanging the authorization code.";
    } catch (error) {
      console.error("Quire sign-in failed:", error.message);
      try {
        const response = await fetch(url);
        const message = await response.text();
        console.error(">> Quire said: ", message);
        return message || error.message || "Quire sign-in failed.";
      } catch (error) {
        console.error("Quire sign-in failed:", error.message);
        return error.message || "Quire sign-in failed.";
      }
    } finally {
      await StorageService.removeLocal(StorageConstants.QUIRE.STATE);
    }
  }
}
