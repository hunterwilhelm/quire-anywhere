import {StorageService} from "../../modules/storage.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {ApiDataService} from "../../modules/api.data.service.js";
// try to load login data onload
const loginDataService = new LoginDataService();
loginDataService.isLoggedIn(function (loggedIn) {
  if (!loggedIn) {
    loginDataService.attemptLogin();
    console.log("logging in");
  } else {
    console.log("logged in");
  }
});


document.querySelector('#get-token').addEventListener('click', function () {
  document.querySelector('#access-token').innerHTML = ApiDataService.getToken();
});

document.querySelector('#clear-storage').addEventListener('click', function () {
  StorageService.clearLocal();
  StorageService.clearLocalStorage();
});

document.querySelector('#open-settings').addEventListener('click', function() {
  window.open(chrome.runtime.getURL('/views/settings/settings.html'));
});
