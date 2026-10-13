import {ApiDataService} from "../../modules/api.data.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeConstants} from "../../modules/chrome.constants.js";
import {UpdateService} from "../../modules/update.service.js";

const REFRESH_ALARM = "refreshToken";
const REFRESH_RETRY_MINUTES = 1;

function onLoginRequestedHandler(request) {
  if (request?.login) {
    void new LoginDataService().askQuireToGrantAccess();
  }
}

function onContextMenuClickedHandler(info, tab) {
  const loginDataService = new LoginDataService();
  loginDataService.isLoggedIn(async function(loggedIn) {
    if (!loggedIn) {
      // ignores what the state was and attempts a new one
      void loginDataService.askQuireToGrantAccess();
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
  // alarms may not survive a browser restart
  scheduleTokenRefresh(await StorageService.readLocal(StorageConstants.QUIRE.EXPIRES_IN_DATE));
  ChromeService.registerContextMenuItems();
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
chrome.runtime.onMessage.addListener(onLoginRequestedHandler);
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(onAlarmHandler);
ChromeService.registerStorageListener(scheduleTokenRefresh, StorageConstants.QUIRE.EXPIRES_IN_DATE);
ChromeService.registerContentOnMessageListeners();
ChromeService.registerNotificationListeners();
