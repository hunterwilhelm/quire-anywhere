import {StorageConstants} from "./storage.constants.js";

// Reads return strings (or null), like the old localStorage mirror did, so callers can keep comparing against StorageConstants.TRUE.
function normalize(value) {
  return (value === undefined || value === null || value === "null") ? null : String(value);
}

function storageCall(area, method, arg) {
  return new Promise(resolve => chrome.storage[area][method](arg, resolve));
}

export class StorageService {
  static async saveSync(key, value) {
    if (value === undefined) {
      console.error("Cannot save undefined value");
      return;
    }
    await storageCall("sync", "set", {[key]: value});
  }

  static async saveLocal(key, value) {
    if (value === undefined) {
      console.error("Cannot save undefined value");
      return;
    }
    await storageCall("local", "set", {[key]: value});
  }

  static async readSync(key) {
    const result = await storageCall("sync", "get", [key]);
    return normalize(result[key]);
  }

  static async readLocal(key) {
    const result = await storageCall("local", "get", [key]);
    return normalize(result[key]);
  }

  static async removeLocal(key) {
    await storageCall("local", "remove", key);
  }

  static async removeSync(key) {
    await storageCall("sync", "remove", key);
  }

  static async clearAllStorage() {
    // to avoid duplicate context menu items ...
    const contextMenuIds = await this.readLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS);

    // fire off event before clearing data
    await this.saveLocal(StorageConstants.QUIRE.LOGGED_IN, StorageConstants.FALSE);
    await new Promise(resolve => chrome.storage.local.clear(resolve));

    // ... preserve context menu ids
    if (contextMenuIds !== null) {
      await this.saveLocal(StorageConstants.CONFIG.CONTEXT_MENU_IDS, contextMenuIds);
    }
  }

  static async addTaskToHistory(task) {
    if (task && task.oid) {
      const stored = await StorageService.readLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP);
      const addedTasksHistory = stored ? JSON.parse(stored) : {};
      addedTasksHistory[task.oid] = task.url;
      await StorageService.saveLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP, JSON.stringify(addedTasksHistory));
    }
  }

  static async getAddedTaskUrlFromHistoryByOid(oid) {
    const stored = await StorageService.readLocal(StorageConstants.HISTORY.ADDED_TASK_URL_MAP);
    if (stored && oid) {
      return JSON.parse(stored)[oid] ?? null;
    }
    return null;
  }
}
