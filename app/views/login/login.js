import { AppConfig } from "../../modules/app.config.js";
import { AppUtils } from "../../modules/app.utils.js";

let authUrl = AppConfig.authorizationUrl
  .replace("{client-id}", AppConfig.clientId)
  .replace("{redirect-uri}", AppConfig.redirectURI)
  .replace("{state}", AppUtils.getRandomString());

document.querySelector("#login-url").innerHTML = "Click to log in";
document.querySelector("#login-url").onclick = function () {
  window.open(authUrl);
}