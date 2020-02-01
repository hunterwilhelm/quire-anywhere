export class StorageService {
  static saveSync(key, value, thenFunction) {
    chrome.storage.sync.set({[key]: value}, thenFunction);
  }
  static saveLocal(key, value, thenFunction) {
    chrome.storage.local.set({[key]: value}, thenFunction);
  }
  static readSync(key, resultFunction) {
    chrome.storage.sync.get([key], resultFunction);
  }
  static readLocal(key, resultFunction) {
    chrome.storage.local.get([key], resultFunction);
  }
}