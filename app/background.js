class TranslationTypes {
  static CONTEXT_MENU = "context-menu";
}
class TranslationService {
  static _translations = {
      "context-menu": {
        "selection": "selected text",
        "page": "this page",
        "link": "this link",
        "image": "this image",
        "video": "this video",
        "audio": "audio",
        "default": "this page"
      }
  };
  static translateFromKey(type, key) {
    const translationsType = this._translations[type];
    if (translationsType) {
      const translation = translationsType[key];
      if (translation !== undefined) {
        return translation;
      } else if (this._translations[type]["default"] !== undefined) {
        return this._translations[type]["default"];
      } else {
        console.log(`translation ${type}.${key} not found`);
        return "";
      }
    } else {
      console.log(`type ${type} from ${type}.${key} not found`);
      return "";
    }
  }
}

function onClickHandler(info, tab) {
  console.log("Adding item " + info.menuItemId + " to Quire...");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
};

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#57a73a'}, function() {
    console.log("Quire anywhere extension installed correctly!");
  });
  // Create one test item for each context type.
  var contexts = ["page","selection","link","editable","image","video",
                  "audio"];
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Add " + TranslationService.translateFromKey(TranslationTypes.CONTEXT_MENU, context) + " to Quire";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                         "id": "context" + context});
    console.log("Adding " + TranslationService.translateFromKey(TranslationTypes.CONTEXT_MENU, context) + "-" + id + " to Quire...");
  }
});

