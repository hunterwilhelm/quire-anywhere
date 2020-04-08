import {TranslationService} from "./translation.service.js";
import {TranslationConfig} from "./translation.config.js";
import {ChromeConstants} from "./chrome.constants.js";
import {StorageService} from "./storage.service.js";
import {StorageConstants} from "./storage.constants.js";

export class ChromeService {

    static registerContextMenuItems() {
        console.log(">> Registering context menu items...");

        // clear all context menu items so that there are no id conflicts
        chrome.contextMenus.removeAll(this._createContextMenuItemsCallback);
    }
    static _createContextMenuItemsCallback() {
        // const contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
        const contextMenuIds = {};
        for (const contextMenuType of Object.values(ChromeConstants.CONTEXT_MENU_TYPES)) {
            const contextTranslation = TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, contextMenuType);
            const title = "Add " + contextTranslation + " to Quire";

            contextMenuIds[contextMenuType] = ChromeService._createContextMenuItem(title, contextMenuType);

            console.log("Adding " + contextTranslation + " id:" + contextMenuIds[contextMenuType] + " to Quire...");
        }
        StorageService.saveLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS, JSON.stringify(contextMenuIds));
    }

    static _createContextMenuItem(title, context) {
        // returns id
        return chrome.contextMenus.create({
            "title": title,
            "contexts": [context]
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
        this.registerNotificationOnClickListener();
        console.log('-----CREATE NOTIFICATION------');
        const options = {
            type: "basic",
            title: `Quire Anywhere - ${title}`,
            message: description,
            iconUrl: "/images/quire-anywhere-128-opaque.png",
            silent: true,
        };
        console.log(options);
        console.log('------------------------------');
        chrome.notifications.create(url, options);
    }

    static registerNotificationOnClickListener() {
        // TODO: .hasListeners() only returns true if the listener has been registered from that page
        // my hack is to just register the notification listener right before the notification is created
        if (!chrome.notifications.onClicked.hasListeners()) {
            chrome.notifications.onClicked.addListener(this.onNotificationClickedHandler);
        }
    }

    static onNotificationClickedHandler(notificationId) {
        if (notificationId && notificationId !== "") {
            chrome.tabs.create({url: notificationId});
            chrome.notifications.clear(notificationId);
        }
    }
}
