import {LoginHttpService} from "./login.http.service.js";
import {TranslationService} from "../../modules/translation.service.js";
import {TranslationConfig} from "../../modules/translation.config.js";
import {AppStatusKeys} from "../../modules/app.status.keys.js";
import {StorageService} from "../../modules/storage.service.js";
import {PopupHo} from "./popup.js";
export class LoginDataService {
  _loginHttpService = new LoginHttpService();

  constructor() {
    this.authUrl = this._loginHttpService.authUrl;
  }

  loadLoginData(result) {
    if (result.quire_state !== undefined) {
      console.log(result.quire_state);
      LoginHttpService.postState(result.quire_state,function(response) {
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

  isLoggedIn(thenFunction) {
    StorageService.readLocal('quire_logged_in', thenFunction);
  }
}


