import { AppConfig } from "../../modules/app.config.js";
import { AppUtils } from "../../modules/app.utils.js";

export class LoginService {
  constructor() {
    this.authUrl = AppConfig.authorizationUrl
      .replace("{client-id}", AppConfig.clientId)
      .replace("{redirect-uri}", AppConfig.redirectURI)
      .replace("{state}", AppUtils.getRandomString());
    this.thenFunction = function() {};
  }

  awaitResponse(thenFunction) {
    console.log(this.authUrl);
    this.thenFunction = thenFunction;
    this.waitUntilPageNotHidden(this.post, thenFunction);
  }

  waitUntilPageNotHidden(fireEventFunction, thenFunction) {
    let handle = setInterval(function(fireEventFunction, thenFunction) {
      if (document.hidden) {
        console.log("waiting for user to return...")
      } else {
        clearInterval(handle);
        setTimeout(fireEventFunction, 100, thenFunction);
      }
    }, 100, fireEventFunction, thenFunction);
  }

  post(thenFunction) {
    thenFunction("the response JSON");
  }
}