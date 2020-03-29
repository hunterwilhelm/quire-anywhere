import {StorageService} from "../../modules/storage.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {ApiDataService} from "../../modules/api.data.service.js";
import {TranslationService} from "../../modules/translation.service.js";
import {TranslationConfig} from "../../modules/translation.config.js";
import {AppConfig} from "../../modules/app.config.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";

function showPopulateDefaultTable() {
  const orgName = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_NAME);
  const projName = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_NAME);
  if (orgName && projName) {
    $('#default-org').html(orgName);
    $('#default-proj').html(projName);
    $('#table-container').removeClass('d-none');
  } else {
    $("#warning-warn-body").html(TranslationService.translateFromKey(TranslationConfig.SETTINGS, "default-project-missing"));
    $("#warning-warn").removeClass('d-none');
  }
}

function showLoggedIn() {
  $("#logged-in-container").removeClass('d-none');
  $("#login-container").addClass('d-none');
  $("#loading-container").addClass('d-none');
  $("#open-settings").removeClass('disabled');
  showPopulateDefaultTable();
}

function showLogIn() {
  $("#logged-in-container").addClass('d-none');
  $("#login-container").removeClass('d-none');
  $("#loading-container").addClass('d-none');
  $("#open-settings").addClass('disabled');
}

// try to load login data onload
const loginDataService = new LoginDataService();
function checkIfLoggedIn() {
  loginDataService.isLoggedIn(function (loggedIn) {
    if (loggedIn) {
      console.log("logged in");
      showLoggedIn();
    } else {
      showLogIn();
      setTimeout(checkIfLoggedIn, 1000);
    }
  });
}
checkIfLoggedIn();

const getTokenButton = document.querySelector('#get-token');
if (getTokenButton) {
  getTokenButton.addEventListener('click', function () {
    document.querySelector('#access-token').innerHTML = ApiDataService.getToken();
  });
}


document.querySelector('#logout-button').addEventListener('click', function () {
  StorageService.clearAllStorage();
  // wait for storage to clear
  setTimeout(function() {
    window.open(AppConfig.quireAppSettingsUrl);
  }, 300)
});
const settingsButton = $('#open-settings');
settingsButton.on('click', function() {
  if (settingsButton.hasClass('disabled')) {
    $("#error-warn-body").html(TranslationService.translateFromKey(TranslationConfig.SETTINGS, "not-signed-in"));
    $("#error-warn").removeClass('d-none');
  } else {
    window.open(chrome.runtime.getURL('/views/settings/settings.html'));
  }
});

document.querySelector("#login-button").addEventListener("click", function () {
  // Ask a Quire User to Grant Access to Your Application
  loginDataService.saveState(function () {
    window.open(loginDataService.authUrl);
  });
});

// hide instead of delete warns
$(document).on('click', '.alert-close', function() {
  $(this).parent().addClass('d-none');
});

// register Context Menu again
ChromeService.registerContextMenuItems();
