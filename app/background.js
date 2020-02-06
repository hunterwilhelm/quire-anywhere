import {TranslationConfig} from "./modules/translation.config.js";
import {TranslationService} from "./modules/translation.service.js";
import {ApiDataService} from "./modules/api.data.service.js";
import {LoginDataService} from "./modules/login.data.service.js";
import {StorageService} from "./modules/storage.service.js";


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
      const state = StorageService.readLocal("quire_state");
      if (state) {
        alert("Please finish logging in by clicking on the chrome extension again");
      } else {
        alert("Please log in first");
      }
      return;
    }
    const org = StorageService.readLocal("default_org_id");
    const proj =  StorageService.readLocal("default_proj_id");
    if (!(org && proj)) {
      alert("Please go to settings to set your default project first");
      return;
    }
    console.log("-------------INFO----------------");
    console.log("info: ", info);
    console.log("tab: ", tab);
    switch (info.menuItemId) {
      case "contextpage":
        ApiDataService.addPageTask(info, tab);
        break;
      case "contextselection":
        ApiDataService.addSelectionTask(info, tab);
        break;
      case "contextlink":
        ApiDataService.addLinkTask(info, tab);
        break;
    }
    console.log("---------------------------------");
  });
}

function onInstalledHandler() {
  StorageService.saveSync("color", '#57a73a', function() {
    console.log(">> Quire anywhere extension installed correctly!");
  });
  console.log(">> Setting up context menu");
  // Create one test item for each context type.
  // const contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
  const contexts = ["page", "selection", "link"];
  for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    const title = "Add " + TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, context) + " to Quire";
    const id = chrome.contextMenus.create({
      "title": title, "contexts": [context],
      "id": "context" + context
    });
    console.log("Adding " + TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, context) + "-" + id + " to Quire...");
  }
}

chrome.contextMenus.onClicked.addListener(onClickHandler);
chrome.runtime.onInstalled.addListener(onInstalledHandler);


