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

  static clearLocal() {
    chrome.storage.local.clear();
  }

  static clearSync() {
    chrome.storage.sync.clear();
  }

  static clearLocalStorage() {
    localStorage.clear();
  }

  static clearAllStorage() {
    this.clearLocalStorage();
    this.clearLocal();
    this.clearLocalStorage();
  }
}
