import type { FlaggedMessage } from "./constants";

const WIDTH_LG = 1312;
const YOUTUBE_ORIGIN = "https://www.youtube.com";
const accessLevel = chrome.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS;
const SUB_ORDER_KEY = "YSO-SUBSCRIPTION-ORDER";

const getCurrentTab = async (): Promise<number> => {
  const query = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(query);
  return tab.id;
};

// adding redirection to youtube onclick of the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.update(tab.id, { url: YOUTUBE_ORIGIN });
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
    if (!tab.url?.includes(YOUTUBE_ORIGIN) || tabInfo.status !== "complete") {
      return;
    }
    const check = await chrome.tabs.sendMessage<FlaggedMessage, boolean>(
      tabId,
      {
        type: "check",
        flag: true,
      }
    );
    if (check) return;
    chrome.storage.session.setAccessLevel({ accessLevel });
    chrome.tabs
      .sendMessage<FlaggedMessage>(tabId, {
        type: "initialize",
        flag: tab.width > WIDTH_LG,
      })
      .catch((e) => console.log(e));
  }
);

chrome.runtime.onMessageExternal.addListener(
  async ({ msg }, sender, res) => {
    if (sender.origin !== YOUTUBE_ORIGIN) return;
    if (msg === "order") {
      const value = await chrome.storage.session.get(SUB_ORDER_KEY);
      res(value?.[SUB_ORDER_KEY]);
    }
  }
)

const SUB_URL = "https://www.youtube.com/youtubei/v1/subscription/*";

chrome.webRequest.onCompleted.addListener(
  (details) => {
    getCurrentTab().then((id) => {
      const flag = details.url.includes("unsubscribe");
      chrome.tabs
        .sendMessage<FlaggedMessage>(id, {
          type: "update",
          flag,
        })
        .catch((e) => console.error(e));
    });
  },
  { urls: [SUB_URL] }
);
