import type { SubscriptionMessage } from "./constants";
import { createNewFolderButton, initializeStoredFolders } from "./components";
import { sortSubscriptions, waitForElementLoad } from "./utils";
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
  sortSubscriptions(list);
};

// const subscriptionFlagDiv = document.createElement("div");
// subscriptionFlagDiv.id = "subscriptionFlagDiv";
// document.body.appendChild(subscriptionFlagDiv);

// const observer = new MutationObserver((mutations) => {
//   for (const m of mutations) {
//     console.log(m);
//     if (m.type === "attributes") {
//       const flagDiv = m.target as Element;
//       console.log(flagDiv.getAttribute("data-subscription"));
//     }
//   }
// });

// observer.observe(subscriptionFlagDiv, { attributes: true });

const main = () => {
  const s = document.createElement("script");
  (document.head || document.documentElement).appendChild(s);
  // s.onload = function () {
  //   const t = this as HTMLScriptElement;
  //   t.remove();
  // };
  s.src = chrome.runtime.getURL("src/injected/index.js");
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
        const header = subscriptionTabLabel.firstElementChild as HTMLElement;
        header.style.cursor = "pointer";
        header.addEventListener("click", () => {
          document
            .querySelector(`a[href="/feed/subscriptions"]`)
            .parentElement.click();
        });
        subscriptionTabLabel.style.display = "flex";
        subscriptionTabLabel.style.alignItems = "center";
        subscriptionTabLabel.append(createNewFolderButton(subscriptionList));
      });
      // .then(() => injector(injectedScript));
    }
  );
};

main();
