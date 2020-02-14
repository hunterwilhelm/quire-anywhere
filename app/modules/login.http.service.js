import { AppConfig } from "./app.config.js";
import { AppUtils } from "./app.utils.js";
import {ApiConfig} from "./api.config.js";

export class LoginHttpService {
  constructor() {
    this.state = AppUtils.getRandomString();
    this.authUrl = ApiConfig.authorizationUrl
        .replace("{client-id}", AppConfig.clientId)
        .replace("{redirect-uri}", AppConfig.redirectUri)
        .replace("{state}", this.state);
  }

  static postState(state, responseFunction) { // cannot see 'this', so I named 'this' to loginService
    const url = AppConfig.postUrl;
    const formData = new FormData();
    formData.append("state", state);
    this.post(url, formData, responseFunction);
  }

  static postRefresh(state, refreshToken, responseFunction) { // cannot see 'this', so I named 'this' to loginService
    const url = AppConfig.postUrl;
    const formData = new FormData();
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');
    this.post(url, formData, responseFunction);
  }

  static post(url, formData, thenFunction) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.send(formData);
    xhr.onload = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
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
