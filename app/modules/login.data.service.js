import {LoginHttpService} from "./login.http.service.js";
import {AppStatusKeys} from "./app.status.keys.js";
import {StorageService} from "./storage.service.js";
import {ApiDataService} from "./api.data.service.js";

export class LoginDataService {
  constructor() {
    this._loginHttpService = new LoginHttpService();
    this.authUrl = this._loginHttpService.authUrl;
  }

  handleResponse(response) {
    console.log(response);
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      StorageService.saveLocal("quire_access_token", response.access_token, function(){
        console.log("successfully saved quire_access_token");
      });
      StorageService.saveLocal("quire_refresh_token", response.refresh_token, function(){
        console.log("successfully saved quire_refresh_token");
      });
      // number of seconds that it will last
      StorageService.saveLocal("quire_expires_in", response.expires_in, function(){
        console.log("successfully saved quire_expires_in");
      });
      StorageService.saveLocal("quire_expires_in_date", ApiDataService.getExpireInAsDate(response.expires_in), function(){
        console.log("successfully saved quire_expires_in");
      });
      StorageService.saveLocal("quire_logged_in",true);
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
        thenFunction(response);
        self.handleResponse(response);
      });
    } else {
      console.error("Failed to load quire state");
    }
  }

  attemptLogin(thenFunction) {
    const quireState = StorageService.readLocal('quire_state');
    if (quireState) {
      this.loadLoginData(quireState, thenFunction);
    } else {
      thenFunction(false);
    }
  }

  saveState(thenFunction) {
    StorageService.saveLocal('quire_state', this._loginHttpService.state, thenFunction);
  }

  isLoggedIn(loggedInFunction) {
    const quire_logged_in = StorageService.readLocal('quire_logged_in');
    if (quire_logged_in) {
      const quire_expires_in_date = StorageService.readLocal('quire_expires_in_date');
      if (quire_expires_in_date
          && (new Date(quire_expires_in_date)) <= (new Date())
          || quire_expires_in_date.includes("[object Object]")) {
        // access token expired
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
    const quire_state = StorageService.readLocal('quire_state');
    if (quire_state !== undefined) {
      console.log(quire_state);
      const refreshToken = StorageService.readLocal('quire_refresh_token');
      let self = this;
      LoginHttpService.postRefresh(quire_state, refreshToken, function(response) {
        const loggedIn = self.handleResponse(response);
        loggedInFunction(loggedIn);
      });
    }
  }
}


