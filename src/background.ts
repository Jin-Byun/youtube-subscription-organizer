import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

export type SubscriptionMessage = {
  type: string;
  loaded: boolean;
};

let isYoutube = false;

reloadOnUpdate("src/background");

// adding redirection to youtube onclick of the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.update(tab.id, { url: "https://www.youtube.com" });
});

chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});

chrome.tabs.onUpdated.addListener(
  async (
    tabId: number,
    tabInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
    if (!tab.url?.includes("https://www.youtube.com/")) {
      isYoutube = false;
      return;
    }
    if (isYoutube || tabInfo.status !== "complete") return;
    isYoutube = true;
    chrome.tabs
      .sendMessage(tabId, {
        type: "subscription",
        loaded: true,
      })
      .catch((e) => console.log(e));
  }
);
