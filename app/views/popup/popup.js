import {StorageService} from "../../modules/storage.service.js";
import {LoginDataService} from "./login.data.service.js";

export class PopupHo {
  static showLogin() {
    document.querySelector("#login-url").innerHTML = "Click to log in";
    document.querySelector("#login-url").addEventListener("click", function () {
      // Ask a Quire User to Grant Access to Your Application
      loginDataService.saveState(function() {
        window.open(loginDataService.authUrl);
      });
    });
  }
}

// try to load login data onload
const loginDataService = new LoginDataService();
loginDataService.isLoggedIn(function(result) {
  if (!result.quire_logged_in) {
    loginDataService.attemptLogin();
  } else {
    console.log("logged in");
  }
});


document.querySelector('#get-token').addEventListener('click', function () {
  StorageService.readLocal('quire_access_token', function(result) {
    document.querySelector('#access-token').innerHTML = result.quire_access_token;
  });
});

document.querySelector('#clear-storage').addEventListener('click', function () {
  StorageService.clearLocal();
});

