const extensionApi = globalThis.browser ?? globalThis.chrome;

extensionApi.runtime.onInstalled.addListener(() => {
  extensionApi.contextMenus.create({ title: "وبسایت حق فراموش شدن", id: "rtbfWebsite" }, () => void extensionApi.runtime.lastError);
});

extensionApi.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "rtbfWebsite") extensionApi.tabs.create({ url: "https://rtbf.ir" });
});
