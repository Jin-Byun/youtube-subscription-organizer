import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
import type { SubscriptionMessage } from "./constants";

const MinWindowWidth = 1312;
let isInitialized = false;

const getCurrentTab = async (): Promise<number> => {
  const query = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(query);
  return tab.id;
};
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
const SUB_URL = "https://www.youtube.com/youtubei/v1/subscription/*";

chrome.webRequest.onCompleted.addListener(
  (details) => {
    getCurrentTab().then((id) => {
      const flag = details.url.includes("unsubscribe");
      chrome.tabs
        .sendMessage<SubscriptionMessage>(id, {
          type: "update",
          navBarLoaded: flag,
        })
        .catch((e) => console.error(e));
    });
  },
  { urls: [SUB_URL] }
);
