import {ApiDataService} from "../../modules/api.data.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {AppStatusKeys} from "../../modules/app.status.keys.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeConstants} from "../../modules/chrome.constants.js";
import {UpdateService} from "../../modules/update.service.js";

const REFRESH_ALARM = "refreshToken";
const LOGIN_POLL_MILLISECONDS = 1000;
const LOGIN_MAX_TRIES = 100;
const REFRESH_RETRY_MINUTES = 1;

function onContextMenuClickedHandler(info, tab) {
  const loginDataService = new LoginDataService();
  loginDataService.isLoggedIn(async function(loggedIn) {
    if (!loggedIn) {
      // ignores what the state was and attempts a new one
      loginDataService.askQuireToGrantAccess();
      return;
    }
    const org = await StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);
    const proj = await StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
    if (!(org && proj)) {
      chrome.tabs.create({url: chrome.runtime.getURL('/views/settings/settings.html')});
      return;
    }
    const contextMenuEntries = JSON.parse(await StorageService.readLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS));
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

// Runs on install and browser startup. Listeners are not registered here: a service worker must register them at load.
async function setup() {
  console.log(">> Quire anywhere extension installed correctly!");
  await UpdateService.updateLocalStorage();
  await StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, false);
  // alarms may not survive a browser restart
  scheduleTokenRefresh(await StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE));
  ChromeService.registerContextMenuItems();
}

async function onQuireStateChangeHandler() {
  const attemptingLogin = await StorageService.readLocal(StorageConstants.LOGIN.ATTEMPTING);
  if (attemptingLogin !== StorageConstants.TRUE) {
    console.log(">> Attempting login...");
    await StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, StorageConstants.TRUE);
    await StorageService.saveLocal(StorageConstants.LOGIN.TRIES, LOGIN_MAX_TRIES);
    pollLogin();
  } else {
    console.log("Could not attempt login attemptingLogin: " + attemptingLogin);
  }
}

// Asks the relay for the token once a second until it has one or runs out of tries. The pending fetch and storage calls keep the
// service worker alive meanwhile; an alarm can't fire this often.
function pollLogin() {
  new LoginDataService().attemptLogin(async function (response) {
    await responseHandler(response);
    if (await StorageService.readLocal(StorageConstants.LOGIN.ATTEMPTING) !== StorageConstants.TRUE) {
      return;
    }
    const tries = parseInt(await StorageService.readLocal(StorageConstants.LOGIN.TRIES)) - 1;
    console.log(">> Could not log in yet. tries left:", tries);
    await StorageService.saveLocal(StorageConstants.LOGIN.TRIES, tries);
    if (tries > 0) {
      setTimeout(pollLogin, LOGIN_POLL_MILLISECONDS);
    } else {
      console.log(">> ERROR: Giving up on login");
      await StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, StorageConstants.FALSE);
    }
  });
}

async function responseHandler(response) {
  const alreadyLoggedIn = await StorageService.readLocal(StorageConstants.QUIRE.LOGGED_IN) === StorageConstants.TRUE;
  if (alreadyLoggedIn || response?.status === AppStatusKeys.TOKEN_SUCCESS) {
    console.log(">> SUCCESS: Logged in successfully!");
    await StorageService.saveLocal(StorageConstants.LOGIN.ATTEMPTING, StorageConstants.FALSE);
  }
}

// Refreshes the token when it expires. Called with the new expiry date whenever it changes (undefined on logout).
function scheduleTokenRefresh(expiresInDate) {
  const when = expiresInDate ? new Date(expiresInDate).getTime() : NaN;
  if (Number.isNaN(when)) {
    chrome.alarms.clear(REFRESH_ALARM);
  } else {
    console.log(">>> Scheduling token refresh for", expiresInDate);
    chrome.alarms.create(REFRESH_ALARM, {when});
  }
}

function onAlarmHandler(alarm) {
  if (alarm.name === REFRESH_ALARM) {
    new LoginDataService().attemptRefreshToken(function (loggedIn) {
      if (!loggedIn) {
        console.log(">> ERROR: Could not refresh token, retrying...");
        chrome.alarms.create(REFRESH_ALARM, {delayInMinutes: REFRESH_RETRY_MINUTES});
      }
    });
  }
}

// All listeners are registered at load (required for MV3 service workers)
chrome.contextMenus.onClicked.addListener(onContextMenuClickedHandler);
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(onAlarmHandler);
ChromeService.registerStorageListener(onQuireStateChangeHandler, StorageConstants.QUIRE.STATE);
ChromeService.registerStorageListener(scheduleTokenRefresh, StorageConstants.QUIRE.EXPIRES_IN_DATE);
ChromeService.registerContentOnMessageListeners();
ChromeService.registerNotificationListeners();
