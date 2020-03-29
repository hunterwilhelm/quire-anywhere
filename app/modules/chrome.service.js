import {TranslationService} from "./translation.service.js";
import {TranslationConfig} from "./translation.config.js";

export class ChromeService {

    static registerContextMenuItems() {
        console.log(">> Registering context menu items...");

        // clear all context menu items so that there are no id conflicts
        chrome.contextMenus.removeAll(this._createContextMenuItemsCallback)
    }
    static _createContextMenuItemsCallback() {
        // const contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
        const contexts = ["page", "selection", "link"];
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
            "contexts": [context]
        });
    }
}
