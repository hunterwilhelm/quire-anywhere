import {TranslationService} from "./translation.service.js";
import {TranslationConfig} from "./translation.config.js";
import {ChromeConstants} from "./chrome.constants.js";
import {StorageService} from "./storage.service.js";
import {StorageConstants} from "./storage.constants.js";

export class ChromeService {

    static registerContextMenuItems() {
        console.log("---REGISTERING CONTEXT MENUS---");
        this.buildContextMenuItems().then(()=>{
            console.log("-------------------------------");
        });
    }

    static async buildContextMenuItems() {
        let contextMenuIds = JSON.parse(StorageService.readLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS));
        if (!contextMenuIds) {
            contextMenuIds = {};
        }

        const availableContextMenuTypes = Object.values(ChromeConstants.CONTEXT_MENU_TYPES);
        for (const contextMenuType of availableContextMenuTypes) {
            const contextMenuId = contextMenuIds[contextMenuType];
            const contextTranslation = TranslationService.translateFromKey(TranslationConfig.CONTEXT_MENU, contextMenuType);
            const title = "Add " + contextTranslation + " to Quire";

            const contextMenuProperties = {
                "title": title,
                "contexts": [contextMenuType]
            };

            if (contextMenuId != null && await this.isContextMenuItemPresent(contextMenuId, contextMenuProperties)) {
                console.log("Context menu item already exits", contextMenuId, contextMenuProperties);
            } else {
                contextMenuIds[contextMenuType] = this.createContextMenuItem(contextMenuProperties);
                console.log("Context menu item created!", contextMenuIds[contextMenuType], contextMenuProperties);
            }
        }
        StorageService.saveLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS, JSON.stringify(contextMenuIds));
    }

    static async isContextMenuItemPresent(id, item) {
        return new Promise((resolve) => {
            chrome.contextMenus.update(id, item, function () {
                if (chrome.runtime.lastError) {
                    void chrome.runtime.lastError;
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    static createContextMenuItem(createProperties) {
        // returns id
        return chrome.contextMenus.create(createProperties);
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
