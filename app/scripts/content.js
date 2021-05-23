(async () => {
  const src = chrome.extension.getURL('modules/app.utils.js');
  const contentScript = await import(src);
  console.log(contentScript.AppUtils.isProjectOidMyTasks)
})();



document.body.addEventListener('contextmenu', e => {
  const menuItems = document.querySelectorAll(`[role='menu']`);
  const contextMenu = menuItems[menuItems.length - 1];
  console.log(contextMenu)
});
