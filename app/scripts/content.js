(async () => {
  const src = chrome.runtime.getURL("modules/content.utils.js");
  const contentUtils = (await import(src)).ContentUtils;
  const strings = {
    customContextMenuItemId: "quire-anywhere-context-menu-item",
    menuItemClassName: "goog-menuitem apps-menuitem",
    menuItemSelector: ".goog-menuitem.apps-menuitem",
    separatorSelector: ".apps-hoverable-menu-separator-container",
    menuItemHighlightClassName: "goog-menuitem-highlight",
    menuItemDisabledClassName: "goog-menuitem-disabled",
    customContextMenuName: "Add Selection To Quire",
    customContextMenuHint: "",
    icon_url: chrome.runtime.getURL("images/quire-anywhere-16-clear.png")
  };

  function contextMenuEventHandler() {

    const contextMenuElement = contentUtils.getContextMenuElement();
    if (contextMenuElement) {
      const preExisting = document.querySelector("#" + strings.customContextMenuItemId);
      if (preExisting) {
        // we need to remove the preExisting element because google docs removes all elements and recreates them.
        // it will remain at the top then next time if we don't do this
        preExisting.parentElement.removeChild(preExisting);
      }
      const menuItems = contentUtils.filterHiddenElements(contextMenuElement.querySelectorAll(strings.menuItemSelector));
      const disabled = menuItems.length > 0 ? menuItems[0].className.includes(strings.menuItemDisabledClassName) : false;
      const separators = contentUtils.filterHiddenElements(contextMenuElement.querySelectorAll(strings.separatorSelector));
      if (separators.length) {
        // you can also put a custom icon in place of .docs-icon-img-container
        const innerHTML = `
                  <div class="goog-menuitem-content">
                      <div class="docs-icon goog-inline-block goog-menuitem-icon" aria-hidden="true">
                          <div class="docs-icon-img-container" style="background: url('${strings.icon_url}') no-repeat;">
                          </div>
                      </div>
                      <span class="goog-menuitem-label">
                        ${strings.customContextMenuName}
                      </span>
                      <span class="goog-menuitem-accel" aria-label="⌘X">
                        ${strings.customContextMenuHint}
                      </span>
                  </div>`;
        // this can't be HTML text because it will handle the events like hover and click
        const div = document.createElement("div");
        div.innerHTML = innerHTML;
        div.className = strings.menuItemClassName;
        div.id = strings.customContextMenuItemId;
        div.setAttribute("role", "menuitem");
        if (disabled) {
          div.classList.add(strings.menuItemDisabledClassName);
        } else {
          // hover events
          div.addEventListener("mouseenter", e => {
              e.target.classList.add(strings.menuItemHighlightClassName);
            }
          );
          div.addEventListener("mouseleave", e => {
              e.target.classList.remove(strings.menuItemHighlightClassName);
            }
          );

          // click event
          div.addEventListener("click", onClickEventHandler);
        }
        // put it above the first separator
        separators[0].parentElement.insertBefore(div, separators[0]);
      }
    } else {
      console.log("Could not find context menu");
    }
  }

  function onClickEventHandler() {
    const selection = contentUtils.getSelectionText()
    contentUtils.addSelectionTask(selection);
  }

  document.body.addEventListener('contextmenu', contextMenuEventHandler);
})();





