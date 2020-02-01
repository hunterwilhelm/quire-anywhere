import { LoginService } from "./login.service.js";
import { TranslationService } from "../../modules/translation.service.js";
import { TranslationConfig } from "../../modules/translation.config.js";

document.querySelector("#login-url").innerHTML = "Click to log in";
var loginService = new LoginService();
document.querySelector("#login-url").addEventListener("click", function () {
  window.open(loginService.authUrl);
  // Ask a Quire User to Grant Access to Your Application
  loginService.awaitAccessRequestResponse(function(response) {
    let responseMessage = TranslationService.translateFromKey(TranslationConfig.AUTHENTICATION_RESPONSE, response.type);
    document.querySelector("#response").innerHTML = responseMessage;

    // Retrieve access token
    if (response.type == "success") {
      // the code is stored with 'state' as the key
      let code = response[loginService.state];
      loginService.awaitAccessTokenResponse(code, function(response) {
        console.log(response);
      });
      console.log(loginService);
    }
  });
});