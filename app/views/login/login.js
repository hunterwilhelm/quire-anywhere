import {LoginHttpService} from "./login.http.service.js";
import {TranslationService} from "../../modules/translation.service.js";
import {TranslationConfig} from "../../modules/translation.config.js";
import {AppStatusKeys} from "../../modules/app.status.keys.js";
import {StorageService} from "../../modules/storage.service.js";

document.querySelector("#login-url").innerHTML = "Click to log in";
const loginService = new LoginHttpService();
document.querySelector("#login-url").addEventListener("click", function () {
  window.open(loginService.authUrl);
  // Ask a Quire User to Grant Access to Your Application
  loginService.awaitAccessRequestResponse(function(response) {
    document.querySelector("#response").innerHTML =
        TranslationService.translateFromKey(TranslationConfig.AUTHENTICATION_RESPONSE, response.status);
        if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
          StorageService.saveLocal(
              "quire_access_token",
              response.access_token,
              function(){
                console.log("successfully saved");
              });
        }
  });
});