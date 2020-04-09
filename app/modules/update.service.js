/*
 update.service.js: Handles updates

 localStorage is preserved between updates
 */


import {StorageService} from "./storage.service.js";
import {StorageConstants} from "./storage.constants.js";
import {ChromeService} from "./chrome.service.js";

export class UpdateService {
    static updateLocalStorage() {

        const lastKnownVersion = StorageService.readLocal(StorageConstants.CONFIG.LAST_KNOWN_VERSION);
        const currentVersion = ChromeService.getVersion();

        // Update 0.1.6 to 0.2.0
        if (!lastKnownVersion && currentVersion === "0.2.0") {
            console.log(`>> Quire anywhere updating to ${currentVersion}...`);

            /*
             *  Task: Remove unused storage items
             */

            // erase:
            // sync.color: "#57a73a"
            StorageService.removeLocal("sync.color");

            // erase:
            // local.quire_expires_in_date: "[object Object]",
            StorageService.removeLocal("local.quire_expires_in_date");

            // erase:
            // local.default_proj_name: "..."
            StorageService.removeLocal("local.default_proj_name");

            // erase:
            // local.default_org_name: "..."
            StorageService.removeLocal("local.default_org_name");


            console.log(`>> Updated to ${currentVersion}!`);
        }


        StorageService.saveLocal(StorageConstants.CONFIG.LAST_KNOWN_VERSION, currentVersion);
    }
}
