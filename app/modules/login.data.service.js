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

  handleResponse(response) {
    console.log(response);
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      StorageService.saveLocal(StorageConstants.QUIRE.ACCESS_TOKEN, response.access_token, function(){
        console.log(`successfully saved ${StorageConstants.QUIRE.ACCESS_TOKEN}`);
      });
      StorageService.saveLocal(StorageConstants.QUIRE.REFRESH_TOKEN, response.refresh_token, function(){
        console.log(`successfully saved ${StorageConstants.QUIRE.REFRESH_TOKEN}`);
      });
      // number of seconds that it will last
      StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN, response.expires_in, function(){
        console.log(`successfully saved ${StorageConstants.QUIRE.EXPIRES_IN}`);
      });
      StorageService.saveLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE, ApiDataService.getExpireInAsDateString(response.expires_in), function(){
        console.log(`successfully saved ${StorageConstants.QUIRE.EXPIRES_IN_DATE}`);
      });
      StorageService.saveLocal(StorageConstants.QUIRE.LOGGED_IN,true);
      return true;
    } else {
      return false;
    }
  }

  loadLoginData(quire_state, thenFunction) {
    if (quire_state !== undefined) {
      console.log(quire_state);
      let self = this;
      LoginHttpService.postState(quire_state,function(response) {
        self.handleResponse(response);
        thenFunction(response);
      });
    } else {
      console.error("Failed to load quire state");
    }
  }

  attemptLogin(thenFunction) {
    const quireState = StorageService.readLocal(StorageConstants.QUIRE.STATE);
    if (quireState) {
      this.loadLoginData(quireState, thenFunction);
    } else {
      thenFunction(false);
    }
  }

  saveState(thenFunction) {
    StorageService.saveLocal(StorageConstants.QUIRE.STATE, this._loginHttpService.state, thenFunction);
  }

  isLoggedIn(loggedInFunction) {
    const quire_logged_in = StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN);
    if (quire_logged_in) {
      const quire_expires_in_date = StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE);
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

  attemptRefreshToken(loggedInFunction) {
    console.info("refreshing token...");
    const quire_state = StorageService.readLocal(StorageConstants.QUIRE.STATE);
    if (quire_state !== undefined) {
      console.log(quire_state);
      const refreshToken = StorageService.readLocal(StorageConstants.QUIRE.REFRESH_TOKEN);
      let self = this;
      LoginHttpService.postRefresh(quire_state, refreshToken, function(response) {
        const loggedIn = self.handleResponse(response);
        loggedInFunction(loggedIn);
      });
    }
  }

  logout(openQuireRevokePage) {
    StorageService.clearAllStorage();
    // wait for storage to clear
    if (openQuireRevokePage) {
      setTimeout(function () {
        window.open(AppConfig.quireAppSettingsUrl);
      }, 300);
    }
  }

  askQuireToGrantAccess() {
    this.saveState(() => {
      window.open(this.authUrl);
    });
  }
}


