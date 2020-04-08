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
function onContextMenuClickedHandler(info, tab) {
  const loginDataService = new LoginDataService();
  loginDataService.isLoggedIn(function(loggedIn) {
    if (!loggedIn) {
      const state = StorageService.readLocal(StorageConstants.QUIRE.STATE);
      if (state) {
        // unlikely
        alert("Please finish logging in by clicking on the chrome extension again");
      } else {
        alert("Please log in first\nClick on the chrome extension to sign in to Quire");
      }
      return;
    }
    const org = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);
    const proj =  StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
    if (!(org && proj)) {
      window.open(chrome.runtime.getURL('/views/settings/settings.html'));
      return;
    }
    const contextMenuEntries = JSON.parse(StorageService.readLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS));
    console.log("-------------INFO----------------");
    console.log("contextMenuEntries: ", contextMenuEntries);
    console.log("info: ", info);
    console.log("tab: ", tab);
    switch (info.menuItemId) {
      case contextMenuEntries[ChromeConstants.CONTEXT_MENU_TYPES.PAGE]:
        ApiDataService.addPageTask(info, tab);
        break;
      case contextMenuEntries[ChromeConstants.CONTEXT_MENU_TYPES.SELECTION]:
        ApiDataService.addSelectionTask(info, tab);
        break;
      case contextMenuEntries[ChromeConstants.CONTEXT_MENU_TYPES.LINK]:
        ApiDataService.addLinkTask(info, tab);
        break;
    }
    console.log("---------------------------------");
  });
}

const oneMinuteInMilliseconds = 60*1000;
function onInstalledHandler() {
  StorageService.saveSync("color", '#57a73a', function() {
    console.log(">> Quire anywhere extension installed correctly!");
  });
  ChromeService.registerStorageListener(onQuireStateChangeHandler, StorageConstants.QUIRE.STATE);
  ChromeService.registerStorageListener(onQuireExpiresInHandler, StorageConstants.QUIRE.EXPIRES_IN);
  quireRefreshTokenExpiredChecker();

  ChromeService.registerContextMenuItems();
  setInterval(function() {
    ChromeService.registerContextMenuItems();
  }, oneMinuteInMilliseconds);
}

function onQuireStateChangeHandler() {
  const attemptingLogin = StorageService.readLocal(StorageConstants.LOGIN.ATTEMPTING);
  if (!(attemptingLogin === StorageConstants.TRUE)) {
    console.log(">> Attempting login...");
    let loginDataService = new LoginDataService();
    const attemptingLoginId = setInterval(function () {
          loginDataService.attemptLogin(responseHandler)
    }, 1000);
    StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, StorageConstants.TRUE);
    StorageService.saveLocal(StorageConstants.LOGIN.ID, attemptingLoginId);
    StorageService.saveLocal(StorageConstants.LOGIN.TRIES, 100);
  }
}

function responseHandler(response) {
  function onLoginHandler() {
    console.log(">> SUCCESS: Logged in successfully!");

    const attemptingLoginId = parseInt(StorageService.readLocal(StorageConstants.LOGIN.ID));
    clearInterval(attemptingLoginId);

    StorageService.saveLocal(StorageConstants.QUIRE.REFRESH_TOKEN_EXPIRED, StorageConstants.FALSE);
    StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, StorageConstants.FALSE);
    onQuireExpiresInHandler();
  }

  function onHttpErrorHandler() {
    let tries = parseInt(StorageService.readLocal(StorageConstants.LOGIN.TRIES)) - 1;

    console.log(">> ERROR: Could not log in yet. tries left:", tries);
    StorageService.saveLocal(StorageConstants.LOGIN.TRIES, tries);
  }

  if (StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN) === StorageConstants.TRUE) {
    onLoginHandler();
  } else if (response) {
    if (response.status === AppStatusKeys.TOKEN_SUCCESS) {
      onLoginHandler();
    } else if (response.status === AppStatusKeys.HTTP_ERROR) {
      onHttpErrorHandler();
    }
  }
}


function onQuireExpiresInHandler() {
  const quireExpiresIn = parseInt(StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN));
  if (quireExpiresIn) {
    const quireExpiresInMilliseconds = quireExpiresIn * 1000;
    console.log(">>> Setting up onQuireExpiresInHandler quireExpiresInMilliseconds:", quireExpiresInMilliseconds);
    setTimeout(function () {
      StorageService.saveLocal(StorageConstants.QUIRE.REFRESH_TOKEN_EXPIRED, StorageConstants.TRUE);
    }, quireExpiresInMilliseconds);
  } else {
    console.log(">>> ERROR: Could not set up onQuireExpiresInHandler because quireExpiresIn:", quireExpiresIn);
  }
}


function quireRefreshTokenExpiredChecker() {
  setInterval(function () {
    const refreshTokenExpired = StorageService.readLocal(StorageConstants.QUIRE.REFRESH_TOKEN_EXPIRED);
    console.log(">> quireRefreshTokenExpiredChecker refreshTokenExpired:", refreshTokenExpired);
    if (refreshTokenExpired === StorageConstants.TRUE) {
      const loginDataService = new LoginDataService();
      loginDataService.attemptRefreshToken(responseHandler);
    }
  }, 1000 * 10);
}

chrome.contextMenus.onClicked.addListener(onContextMenuClickedHandler);
chrome.runtime.onInstalled.addListener(onInstalledHandler);


