import { AppConfig } from "../../modules/app.config.js";
import { AppUtils } from "../../modules/app.utils.js";

export class LoginService {
  constructor() {
    this.state = AppUtils.getRandomString();
    this.authUrl = AppConfig.authorizationUrl
        .replace("{client-id}", AppConfig.clientId)
        .replace("{redirect-uri}", AppConfig.redirectURI)
        .replace("{state}", this.state);
    this.thenFunction = function() {};
  }

  awaitAccessRequestResponse(thenFunction) {
    this.thenFunction = thenFunction;
    this.waitUntilPageNotHidden(this.postState$);
  }

  awaitAccessTokenResponse(code, thenFunction) {
    this.postCode(code, thenFunction);
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
    var url = AppConfig.postUrl;
    var params = JSON.stringify({
      state: loginService.state
    });
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.send(params);
    xhr.onreadystatechange = function () { 
      if (xhr.readyState == 4 && xhr.status == 200) {
        try {
          var json = JSON.parse(xhr.responseText);
          loginService.thenFunction(json);
        } catch (error) {
          loginService.thenFunction(AppConfig.jsonError);
        }
      } else {
        loginService.thenFunction(AppConfig.jsonError);
      }
    }
  }

  postCode(code, thenFunction) {
    console.log("posting code...");
    let url = AppConfig.tokenUrl;
    let params = `grant_type=authorization_code&code=${code}&client_id=${AppConfig.clientId}&client_secret=${AppConfig.clientSecret}`;
    this.post(url, params, thenFunction, thenFunction);
  }

  post(url, params, successFunction, errorFunction) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.send(params);
    xhr.onreadystatechange = function () { 
      if (xhr.readyState == 4 && xhr.status == 200) {
        try {
          console.log(xhr.responseText);
          var json = JSON.parse(xhr.responseText);
          successFunction(json);
        } catch (error) {
          errorFunction(AppConfig.jsonError);
        }
      } else {
        errorFunction(AppConfig.httpError);
      }
    }
  }
}