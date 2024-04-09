import { SubscriptionMessage } from "./background";
import { createNewFolderButton, initializeStoredFolders } from "./components";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

const SubscriptionExpander =
  "ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";

const initializeNavBar = (isLoaded: Boolean): Promise<HTMLElement> => {
  if (isLoaded) return waitForElementLoad(SubscriptionExpander);

  let navBarTrigger: HTMLElement;

  return new Promise((res) => {
    waitForElementLoad("#guide").then((navBar) => {
      navBar.style.display = "none"; // hide action being done
      navBarTrigger = document
        .getElementById("guide-button")
        .querySelector("yt-interaction");
      navBarTrigger.click();
    });
    waitForElementLoad("#sections").then(() => {
      // close the side bar and re-display it
      navBarTrigger.click();
      document.getElementById("guide").style.removeProperty("display");
      res(waitForElementLoad(SubscriptionExpander));
    });
  });
};
const expandSubscription = (expander: Element, list: Element) => {
  const trigger: HTMLElement = expander.querySelector("yt-interaction");
  trigger.click();
  const expandedItems = expander.querySelector("#expandable-items");
  list.append(...expandedItems.children);
  expander.remove();
};

const main = () => {
  chrome.runtime.onMessage.addListener(
    (
      obj: SubscriptionMessage,
      _sender: chrome.runtime.MessageSender,
      _response: (response?: any) => void
    ): void => {
      const { type, navBarLoaded } = obj;
      if (type !== "initialize") return;

      initializeNavBar(navBarLoaded).then((expander) => {
        // expand subscription section
        const subscriptionList = expander.closest("#items");
        expandSubscription(expander, subscriptionList);
        initializeStoredFolders(subscriptionList);
        const subscriptionTabLabel =
          subscriptionList.previousElementSibling as HTMLElement;
        subscriptionTabLabel.style.display = "flex";
        subscriptionTabLabel.style.alignItems = "center";
        subscriptionTabLabel.append(createNewFolderButton(subscriptionList));
      });
    }
  );
};

main();

function waitForElementLoad(selector: string): Promise<HTMLElement> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as HTMLElement);
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector) as HTMLElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
