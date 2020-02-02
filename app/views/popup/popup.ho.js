import {LoginDataService} from "../../modules/login.data.service.js";

export class PopupHo {
  static showLogin() {
    const loginDataService = new LoginDataService();
    document.querySelector("#login-url").innerHTML = "Click to log in";
    document.querySelector("#login-url").addEventListener("click", function () {
      // Ask a Quire User to Grant Access to Your Application
      loginDataService.saveState(function () {
        window.open(loginDataService.authUrl);
      });
    });
  }
}
