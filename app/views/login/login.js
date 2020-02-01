import {LoginService} from "./login.service.js";
import {TranslationService} from "../../modules/translation.service.js";
import {TranslationConfig} from "../../modules/translation.config.js";

document.querySelector("#login-url").innerHTML = "Click to log in";
const loginService = new LoginService();
document.querySelector("#login-url").addEventListener("click", function () {
  window.open(loginService.authUrl);
  // Ask a Quire User to Grant Access to Your Application
  loginService.awaitAccessRequestResponse(function(response) {
    document.querySelector("#response").innerHTML =
        TranslationService.translateFromKey(TranslationConfig.AUTHENTICATION_RESPONSE, response.status);
  });
});