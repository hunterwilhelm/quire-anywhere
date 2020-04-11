import {StorageConstants} from "./storage.constants.js";

export class StorageService {
  static saveSync(key, value, thenFunction) {
    if (value === undefined) {
      console.error("Cannot save undefined value");
      return;
    }
    localStorage.setItem("sync." + key, value);
    chrome.storage.sync.set({[key]: value}, thenFunction);
  }

  static saveLocal(key, value, thenFunction) {
    if (value === undefined) {
      console.error("Cannot save undefined value");
      return;
    }
    localStorage.setItem("local." + key, value);
    chrome.storage.local.set({[key]: value}, thenFunction);
  }

  static readSync(key, valueFunction) {
    if (valueFunction != null) {
      chrome.storage.sync.get([key], function (result) {
        valueFunction(result[key]);
      });
    } else {
      let value = localStorage.getItem("sync." + key);
      if (value === "null") {
        return null;
      } else {
        return value;
      }
    }
  }

  static readLocal(key, valueFunction) {
    if (valueFunction != null) {
      chrome.storage.local.get([key], function (result) {
        valueFunction(result[key]);
      });
    } else {
      let value = localStorage.getItem("local." + key);
      if (value === "null") {
        return null;
      } else {
        return value;
      }
    }
  }

  static readAllSync(arrayFunction) {
    chrome.storage.sync.get(null, arrayFunction);
  }

  static readAllLocal(arrayFunction) {
    chrome.storage.local.get(null, arrayFunction);
  }

  static removeLocal(key) {
    localStorage.removeItem(key);
    chrome.storage.local.remove(key);
  }

  static removeSync(key) {
    localStorage.removeItem(key);
    chrome.storage.sync.remove(key);
  }

  static clearLocal() {
    chrome.storage.local.clear();
  }

  static clearSync() {
    chrome.storage.sync.clear();
  }

  static clearLocalStorage() {
    localStorage.clear();
  }

  static async readAllFromStorage() {
    const localPromise = new Promise(resolve => {
      this.readAllLocal(function(localArray) {
        console.log(">> Loading Chrome's Local Storage to Local Storage");
        if (localArray && Array.isArray(localArray)) { // don't loop over null
          for (const item in localArray) {
            console.log(item, localArray[item]);
            localStorage.setItem('local.' + item, localArray[item]);
          }
        }
        resolve();
      });
    });
    const syncPromise = new Promise(resolve => {
      this.readAllSync(function(syncArray) {
        console.log(">> Loading Chrome's Sync Storage to Local Storage");
        if (syncArray && Array.isArray(syncArray)) { // don't loop over null
          for (const item in syncArray) {
            console.log(item, syncArray[item]);
            localStorage.setItem('sync.' + item, syncArray[item]);
          }
        }
        resolve();
      });
    });
    return Promise.all([localPromise, syncPromise]);
  }

  static clearAllStorage() {
    // to avoid duplicate context menu items ...
    const contextMenuIds = this.readLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS);

    // fire off event before clearing data
    this.saveLocal(StorageConstants.QUIRE.LOGGED_IN, StorageConstants.FALSE);
    this.clearLocalStorage();
    this.clearLocal();
    this.clearLocalStorage();

    // ... preserve context menu ids
    this.saveLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS, contextMenuIds);
  }

  static getStorageKeyFromEventKey(key) {
    if (key) {
      return key.replace('local.', '').replace('sync.', '');
    }
  }

  static addTaskToHistory(task) {
    if (task && task.oid) {
      let addedTasksHistory = StorageService.readLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP);
      if (addedTasksHistory) {
        addedTasksHistory = JSON.parse(addedTasksHistory)
      } else {
        addedTasksHistory = {};
      }
      addedTasksHistory[task.oid] = task.url;
      StorageService.saveLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP, JSON.stringify(addedTasksHistory));
    }
  }

  static getAddedTaskUrlFromHistoryByOid(oid) {
    let addedTasksHistory = StorageService.readLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP);
    if (addedTasksHistory && oid) {
      addedTasksHistory = JSON.parse(addedTasksHistory);
      if(addedTasksHistory[oid]) {
        return addedTasksHistory[oid];
      }
    }
    return null;
  }
}
