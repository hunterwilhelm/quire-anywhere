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

  static async post(url, formData, thenFunction) {
    let response;
    try {
      // the relay identifies the login attempt by its session cookie
      response = await fetch(url, {method: "POST", body: formData, credentials: "include"});
    } catch (error) {
      thenFunction(AppConfig.httpError);
      return;
    }
    if (response.status === 200) {
      let json;
      try {
        json = await response.json();
      } catch (error) {
        thenFunction(AppConfig.jsonError);
        return;
      }
      thenFunction(json);
    } else {
      thenFunction(AppConfig.httpError);
    }
  }
}
