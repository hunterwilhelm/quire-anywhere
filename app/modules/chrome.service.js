import {TranslationService} from "./translation.service.js";
import {TranslationConfig} from "./translation.config.js";
import {ChromeConstants} from "./chrome.constants.js";
import {StorageService} from "./storage.service.js";

export class ChromeService {

    static registerContextMenuItems() {
        console.log(">> Registering context menu items...");

        // clear all context menu items so that there are no id conflicts
        chrome.contextMenus.removeAll(this._createContextMenuItemsCallback)
    }
    static _createContextMenuItemsCallback() {
        // const contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
        const contexts = [
            ChromeConstants.CONTEXT_MENU_TYPES.PAGE,
            ChromeConstants.CONTEXT_MENU_TYPES.SELECTION,
            ChromeConstants.CONTEXT_MENU_TYPES.LINK
        ];
        for (let i = 0; i < contexts.length; i++) {
            const context = contexts[i];
            const contextTranslation = TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, context);
            const title = "Add " + contextTranslation + " to Quire";

            const id = ChromeService._createContextMenuItem(title, context);

            console.log("Adding " + contextTranslation + " id:" + id + " to Quire...");
        }
    }

    static _createContextMenuItem(title, context) {
        // returns id
        return chrome.contextMenus.create({
            "title": title,
            "contexts": [context],
            "id": context
        });
    }

    static registerStorageListener(newValueCallback, storageKey) {
        if (newValueCallback instanceof Function && storageKey) {
            window.addEventListener("storage", function (e) {
                const key = StorageService.getStorageKeyFromEventKey(e.key);
                if (key === storageKey) {
                    newValueCallback(e.newValue);
                }
            });
        }
    }

    static createNotification(url, title, description) {
        const options = {
            type: "basic",
            title: `Quire Anywhere - ${title}`,
            message: description,
            iconUrl: "images/quire-anywhere-128.png"
        };
        chrome.notifications.create(url, options);
    }

    static registerNotificationOnClickListener(notificationIdCallback) {
        chrome.notifications.onClicked.addListener(notificationIdCallback);
    }
}
