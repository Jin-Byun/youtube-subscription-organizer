chrome.tabs.onUpdated.addListener(
  (tabId: number, tab: chrome.tabs.TabChangeInfo) => {
    if (tab.url?.includes("https://www.youtube.com/feed/subscriptions")) {
      chrome.tabs.sendMessage(tabId, {
        type: "Check",
      });
    }
  }
);
