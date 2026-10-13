import {LoginHttpService} from "./login.http.service.js";
import {AppStatusKeys} from "./app.status.keys.js";
import {StorageService} from "./storage.service.js";
import {ApiDataService} from "./api.data.service.js";
import {StorageConstants} from "./storage.constants.js";
import {AppConfig} from "./app.config.js";

export class LoginDataService {
  constructor() {
    this._loginHttpService = new LoginHttpService();
    this.authUrl = this._loginHttpService.authUrl;
  }

  async handleResponse(response) {
    console.log(response);
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      await StorageService.saveLocal(StorageConstants.QUIRE.ACCESS_TOKEN, response.access_token);
      await StorageService.saveLocal(StorageConstants.QUIRE.REFRESH_TOKEN, response.refresh_token);
      // number of seconds that it will last
      await StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN, response.expires_in);
      await StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE, ApiDataService.getExpireInAsDateString(response.expires_in));
      await StorageService.saveLocal(StorageConstants.QUIRE.LOGGED_IN, true);
      return true;
    } else {
      return false;
    }
  }

  loadLoginData(quire_state, thenFunction) {
    if (quire_state !== undefined) {
      console.log(quire_state);
      let self = this;
      LoginHttpService.postState(quire_state, async function(response) {
        await self.handleResponse(response);
        thenFunction(response);
      });
    } else {
      console.error("Failed to load quire state");
    }
  }

  async attemptLogin(thenFunction) {
    const quireState = await StorageService.readLocal(StorageConstants.QUIRE.STATE);
    if (quireState) {
      this.loadLoginData(quireState, thenFunction);
    } else {
      thenFunction(false);
    }
  }

  async saveState(thenFunction) {
    await StorageService.saveLocal(StorageConstants.QUIRE.STATE, this._loginHttpService.state);
    thenFunction();
  }

  async isLoggedIn(loggedInFunction) {
    const quire_logged_in = await StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN);
    if (quire_logged_in) {
      const quire_expires_in_date = await StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE);
      if (quire_expires_in_date
          && (new Date(quire_expires_in_date)) <= (new Date())) {
        // access token expired
        console.log(quire_expires_in_date);
        this.attemptRefreshToken(loggedInFunction);
      } else {
        loggedInFunction(quire_logged_in);
      }
    } else {
      loggedInFunction(quire_logged_in);
    }
  }

  async attemptRefreshToken(loggedInFunction) {
    console.info("refreshing token...");
    const quire_state = await StorageService.readLocal(StorageConstants.QUIRE.STATE);
    if (quire_state !== null) {
      console.log(quire_state);
      const refreshToken = await StorageService.readLocal(StorageConstants.QUIRE.REFRESH_TOKEN);
      let self = this;
      LoginHttpService.postRefresh(quire_state, refreshToken, async function(response) {
        const loggedIn = await self.handleResponse(response);
        loggedInFunction(loggedIn);
      });
    }
  }

  async logout(openQuireRevokePage) {
    await StorageService.clearAllStorage();
    if (openQuireRevokePage) {
      chrome.tabs.create({url: AppConfig.quireAppSettingsUrl});
    }
  }

  askQuireToGrantAccess() {
    this.saveState(() => {
      chrome.tabs.create({url: this.authUrl});
    });
  }
}


