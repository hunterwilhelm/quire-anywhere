import {ApiDataService} from "../../modules/api.data.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {AppStatusKeys} from "../../modules/app.status.keys.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeConstants} from "../../modules/chrome.constants.js";
import {UpdateService} from "../../modules/update.service.js";


StorageService.readAllFromStorage().then(UpdateService.updateLocalStorage);

function onContextMenuClickedHandler(info, tab) {
  const loginDataService = new LoginDataService();
  loginDataService.isLoggedIn(function(loggedIn) {
    if (!loggedIn) {
      // ignores what the state was and attempts a new one
      loginDataService.askQuireToGrantAccess();
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
        ApiDataService.addPageTask(tab);
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
function setupListenersAndCheckers() {
  console.log(">> Quire anywhere extension installed correctly!");
  console.log(">> Registering onQuireStateChangeHandler...");
  ChromeService.registerStorageListener(onQuireStateChangeHandler, StorageConstants.QUIRE.STATE);
  console.log(">> Registering onQuireExpiresInHandler...");
  resetQuireStateChangeHandler();
  ChromeService.registerStorageListener(onQuireExpiresInHandler, StorageConstants.QUIRE.EXPIRES_IN);
  console.log(">> Starting quireRefreshTokenExpiredChecker...");
  quireRefreshTokenExpiredChecker();
  console.log(">> registerContentOnMessageListeners...");
  ChromeService.registerContentOnMessageListeners();

  ChromeService.registerContextMenuItems();
  setInterval(function() {
    ChromeService.registerContextMenuItems();
  }, oneMinuteInMilliseconds);
}

function resetQuireStateChangeHandler() {
  StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, false);
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
  } else {
    console.log("Could not attempt login attemptingLogin: " + attemptingLogin);
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
chrome.runtime.onInstalled.addListener(setupListenersAndCheckers);
chrome.runtime.onStartup.addListener(setupListenersAndCheckers);

