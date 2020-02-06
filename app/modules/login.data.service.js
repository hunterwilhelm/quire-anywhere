import {LoginHttpService} from "./login.http.service.js";
import {AppStatusKeys} from "./app.status.keys.js";
import {StorageService} from "./storage.service.js";

export class LoginDataService {
  constructor() {
    this._loginHttpService = new LoginHttpService();
    this.authUrl = this._loginHttpService.authUrl;
  }

  loadLoginData(quire_state, thenFunction) {
    if (quire_state !== undefined) {
      console.log(quire_state);
      LoginHttpService.postState(quire_state,function(response) {
        thenFunction(response);
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
        }
      });
    } else {
      console.error("Failed to load quire state");
    }
  }

  attemptLogin(thenFunction) {
    const quireState = StorageService.readLocal('quire_state');
    this.loadLoginData(quireState, thenFunction);
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


