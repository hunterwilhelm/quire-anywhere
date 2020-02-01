import {StorageService} from "../../modules/storage.service.js";

document.querySelector("#url").innerHTML = "Click to log in";
document.querySelector("#url").href = chrome.extension.getURL('/views/login/login.html#window');

console.log("getting...");
StorageService.readLocal('quire_access_token', function(result) {
  document.querySelector('#access-token').innerHTML = result.quire_access_token;
});