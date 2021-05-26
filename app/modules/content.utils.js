// these are the utils for the content script
import {default as googleDocsUtils} from './google.docs.utils.js';

export class ContentUtils {
  static getSelectionText() {
    const googleDocument = googleDocsUtils.getGoogleDocument();
    return googleDocument.selectedText;
  }

  static filterHiddenElements(nodeList) {
    return Array.from(nodeList).filter(v => v.style.display !== "none" && !["hidden", "collapse"].includes(v.style.visibility));
  }

  static getContextMenuElement() {
    // there are many divs that match the css selector, but only one will be visible.
    const contextMenus = ContentUtils.filterHiddenElements(document.querySelectorAll(".goog-menu.goog-menu-vertical.apps-menu-hide-mnemonics"));
    // return only the visible ones
    return contextMenus.length > 0 ? contextMenus[0] : null;
  }

  static addSelectionTask(selectionText) {
    // communicate to background.js because it has access to the API and keys
    const message = {
      addSelectionTask: selectionText
    };
    console.log("Trying to send message", message);
    chrome.runtime.sendMessage(message, function (response) {
      console.log(response);
    });
  }
}
