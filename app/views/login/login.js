import { LoginService } from "./login.service.js";

document.querySelector("#login-url").innerHTML = "Click to log in";
document.querySelector("#login-url").addEventListener("click", function () {
  var loginService = new LoginService();
  window.open(loginService.authUrl);
  loginService.awaitResponse(function(response) {
    console.log(response);
  });
});