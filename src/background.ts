import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

export type SubscriptionMessage = {
  type: string;
  loaded: boolean;
};

reloadOnUpdate("src/background");

chrome.tabs.onUpdated.addListener(
  async (tabId: number, tab: chrome.tabs.TabChangeInfo) => {
    if (tab.url?.includes("https://www.youtube.com/feed/subscriptions")) {
      const leftNavBar = document.getElementById("sections") as HTMLDivElement;
      const isLoaded = !!leftNavBar;
      console.log(leftNavBar);
      chrome.tabs.sendMessage(tabId, {
        type: "subscription",
        loaded: isLoaded,
      });
    }
  }
);
