import { AppConfig } from "../../modules/app.config.js";
import { AppUtils } from "../../modules/app.utils.js";

export class LoginHttpService {
  constructor() {
    this.state = AppUtils.getRandomString();
    this.authUrl = AppConfig.authorizationUrl
        .replace("{client-id}", AppConfig.clientId)
        .replace("{redirect-uri}", AppConfig.redirectUri)
        .replace("{state}", this.state);
  }

  awaitAccessRequestResponse(thenFunction) {
    this.thenFunction = thenFunction;
    this.waitUntilPageNotHidden(this.postState$);
  }

  waitUntilPageNotHidden(fireEventFunction) {
    let handle = setInterval(function(fireEventFunction, loginService) {
      if (document.hidden) {
        console.log("waiting for user to return...")
      } else {
        clearInterval(handle);
        setTimeout(fireEventFunction, 100, loginService);
      }
    }, 100, fireEventFunction, this);
  }

  postState$(loginService) { // cannot see 'this', so I named 'this' to loginService
    const url = AppConfig.postUrl;
    const formData = new FormData();
    formData.append("state", loginService.state);
    loginService.post(url, formData, loginService.thenFunction);
  }

  post(url, formData, thenFunction) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.send(formData);
    xhr.onload = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          console.log(xhr.responseText);
          const json = JSON.parse(xhr.responseText);
          thenFunction(json);
        } catch (error) {
          thenFunction(AppConfig.jsonError);
        }
      } else {
        thenFunction(AppConfig.httpError);
      }
    }
  }
}