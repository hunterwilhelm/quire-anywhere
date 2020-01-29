import {TranslationConfig} from "./modules/translation.config.js";
import {TranslationService} from "./modules/translation.service.js";

function onClickHandler(info, tab) {
  console.log("Adding item " + info.menuItemId + " to Quire...");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
};

function onInstalledHandler() {
  chrome.storage.sync.set({color: '#57a73a'}, function() {
    console.log("Quire anywhere extension installed correctly!");
  });
  // Create one test item for each context type.
  var contexts = ["page","selection","link","editable","image","video",
                  "audio"];
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Add " + TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, context) + " to Quire";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                         "id": "context" + context});
    console.log("Adding " + TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, context) + "-" + id + " to Quire...");
  }
}

chrome.contextMenus.onClicked.addListener(onClickHandler);
chrome.runtime.onInstalled.addListener(onInstalledHandler);


