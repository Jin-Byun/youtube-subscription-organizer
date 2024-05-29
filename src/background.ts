import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

export type SubscriptionMessage = {
  type: string;
  navBarLoaded: boolean;
};

const MinWindowWidth = 1312;
let isInitialized = false;

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
      isInitialized = false;
      return;
    }
    if (isInitialized || tabInfo.status !== "complete") {
      if (!tabInfo.url && tabInfo.status) {
        isInitialized = false;
      }
      return;
    }
    isInitialized = true;
    chrome.tabs
      .sendMessage<SubscriptionMessage>(tabId, {
        type: "initialize",
        navBarLoaded: tab.width > MinWindowWidth,
      })
      .catch((e) => console.log(e));
  }
);

const UNSUB_URL = "https://www.youtube.com/youtubei/v1/subscription/*";
chrome.webRequest.onCompleted.addListener(
  (r) => {
    console.log(r);
  },
  {
    urls: [UNSUB_URL],
  }
);
