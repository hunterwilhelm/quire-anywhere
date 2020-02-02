import {LoginHttpService} from "./login.http.service.js";
import {TranslationService} from "./translation.service.js";
import {TranslationConfig} from "./translation.config.js";
import {AppStatusKeys} from "./app.status.keys.js";
import {StorageService} from "./storage.service.js";
import {PopupHo} from "../views/popup/popup.ho.js";

export class LoginDataService {
  constructor() {
    this._loginHttpService = new LoginHttpService();
    this.authUrl = this._loginHttpService.authUrl;
  }

  loadLoginData(quire_state) {
    if (quire_state !== undefined) {
      console.log(quire_state);
      LoginHttpService.postState(quire_state,function(response) {
        document.querySelector("#response").innerHTML =
            TranslationService.translateFromKey(TranslationConfig.AUTHENTICATION_RESPONSE, response.status);
        if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
          StorageService.saveLocal(
              "quire_access_token",
              response.access_token,
              function(){
                console.log("successfully saved");
              });
          StorageService.saveLocal("quire_logged_in",true);
        } else {
          // not logged in
          PopupHo.showLogin();
        }
      });
    } else {
      console.error("Failed to load quire state");
      PopupHo.showLogin();
    }
  }

  attemptLogin() {
    StorageService.readLocal('quire_state', this.loadLoginData);
  }

  saveState(thenFunction) {
    StorageService.saveLocal('quire_state', this._loginHttpService.state, thenFunction);
  }

  isLoggedIn(loggedInFunction) {
    StorageService.readLocal('quire_logged_in', function(quire_logged_in) {
      loggedInFunction(quire_logged_in);
    });
  }
}


