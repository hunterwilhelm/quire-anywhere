import {ApiDataService} from "./modules/api.data.service.js";
import {LoginDataService} from "./modules/login.data.service.js";
import {StorageService} from "./modules/storage.service.js";
import {ChromeService} from "./modules/chrome.service.js";
import {AppStatusKeys} from "./modules/app.status.keys.js";
import {StorageConstants} from "./modules/storage.constants.js";
import {ChromeConstants} from "./modules/chrome.constants.js";


StorageService.readAllLocal(function(localArray) {
  console.log(">> Loading Chrome's Local Storage to Local Storage");
  if (localArray) { // don't loop over null
    for (const item in localArray) {
      console.log(item, localArray[item]);
      localStorage.setItem('local.' + item, localArray[item]);
    }
  }
});
StorageService.readAllSync(function(syncArray) {
  console.log(">> Loading Chrome's Sync Storage to Local Storage");
  if (syncArray) { // don't loop over null
    for (const item in syncArray) {
      console.log(item, syncArray[item]);
      localStorage.setItem('sync.' + item, syncArray[item]);
    }
  }
});
function onClickHandler(info, tab) {
  const loginDataService = new LoginDataService();
  loginDataService.isLoggedIn(function(loggedIn) {
    if (!loggedIn) {
      const state = StorageService.readLocal(StorageConstants.QUIRE.STATE);
      if (state) {
        alert("Please finish logging in by clicking on the chrome extension again");
      } else {
        alert("Please log in first");
      }
      return;
    }
    const org = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);
    const proj =  StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
    if (!(org && proj)) {
      window.open(chrome.runtime.getURL('/views/settings/settings.html'));
      return;
    }
    console.log("-------------INFO----------------");
    console.log("info: ", info);
    console.log("tab: ", tab);
    switch (info.menuItemId) {
      case ChromeConstants.CONTEXT_MENU_TYPES.PAGE:
        ApiDataService.addPageTask(info, tab);
        break;
      case ChromeConstants.CONTEXT_MENU_TYPES.SELECTION:
        ApiDataService.addSelectionTask(info, tab);
        break;
      case ChromeConstants.CONTEXT_MENU_TYPES.LINK:
        ApiDataService.addLinkTask(info, tab);
        break;
    }
    console.log("---------------------------------");
  });
}

const oneHourInMilliseconds = 60*60*1000;
function onInstalledHandler() {
  StorageService.saveSync("color", '#57a73a', function() {
    console.log(">> Quire anywhere extension installed correctly!");
  });
  ChromeService.registerContextMenuItems();
  setInterval(ChromeService.registerContextMenuItems, oneHourInMilliseconds);
  window.addEventListener("storage", onStorageChangedController);
}

function onStorageChangedController(e) {
  if (e.key) {
    console.log(e);
    const key = e.key.replace("local.", "");
    switch (key) {
      case StorageConstants.QUIRE.STATE: onQuireStateChangeHandler();
        break;
      case StorageConstants.QUIRE.EXPIRES_IN: onQuireExpiresInHandler();
        break;
    }
  }
}

function onQuireStateChangeHandler() {
  const attemptingLogin = StorageService.readLocal(StorageConstants.ATTEMPT_LOGIN.ATTEMPTING);
  if (!(attemptingLogin === StorageConstants.TRUE)) {
    console.log(">> Attempting login...");
    let loginDataService = new LoginDataService();
    const attemptingLoginId = setInterval(function () {
          loginDataService.attemptLogin(responseHandler)
    }, 1000);
    StorageService.saveLocal(StorageConstants.ATTEMPT_LOGIN.ATTEMPTING, StorageConstants.TRUE);
    StorageService.saveLocal(StorageConstants.ATTEMPT_LOGIN.ID, attemptingLoginId);
    StorageService.saveLocal(StorageConstants.ATTEMPT_LOGIN.TRIES, 100);
  }
}

function responseHandler(response) {
  function onLoginHandler() {
    console.log(">> SUCCESS: Logged in successfully!");

    const attemptingLoginId = parseInt(StorageService.readLocal(StorageConstants.ATTEMPT_LOGIN.ID));
    clearInterval(attemptingLoginId);

    StorageService.saveLocal(StorageConstants.ATTEMPT_LOGIN.ATTEMPTING, StorageConstants.FALSE);
  }

  function onHttpErrorHandler() {
    let tries = parseInt(StorageService.readLocal(StorageConstants.ATTEMPT_LOGIN.TRIES)) - 1;

    console.log(">> ERROR: Could not log in yet. tries left:", tries);
    StorageService.saveLocal(StorageConstants.ATTEMPT_LOGIN.TRIES, tries);
  }

  if (StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN) === StorageConstants.TRUE) {
    onLoginHandler();
  } else if (response) {
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      onLoginHandler();
      onQuireExpiresInHandler();
    } else if (response.status === AppStatusKeys.HTTP_ERROR) {
      onHttpErrorHandler();
    }
  }
}


function onQuireExpiresInHandler() {
  let quireExpiresIn = StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN);

}


chrome.contextMenus.onClicked.addListener(onClickHandler);
chrome.runtime.onInstalled.addListener(onInstalledHandler);


