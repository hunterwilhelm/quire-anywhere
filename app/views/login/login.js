import { LoginService } from "./login.service.js";
import { TranslationService } from "../../modules/translation.service.js";

document.querySelector("#login-url").innerHTML = "Click to log in";
var loginService = new LoginService();
document.querySelector("#login-url").addEventListener("click", function () {
  window.open(loginService.authUrl);
  loginService.awaitAccessRequestResponse(function(response) {
    let responseMessage = TranslationService.translateFromKey('authentication-response', response.type);
    document.querySelector("#response").innerHTML = responseMessage;
    console.log(loginService.authUrl);
    console.log(response);
  });
});