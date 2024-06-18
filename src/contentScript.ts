import { FOLDER_CLASS, type FlaggedMessage } from "./constants";
import { createNewFolderButton, initializeStoredFolders } from "./components";
import {
  prependNewSubscription,
  resetStorage,
  sortSubscriptions,
  updateSubscriptionOrder,
  waitForElementLoad,
} from "./utils";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

const SubscriptionExpander =
  "ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";

const initializeNavBar = (isLoaded: Boolean): Promise<HTMLElement> =>
  isLoaded
    ? waitForElementLoad(SubscriptionExpander)
    : new Promise((res) => {
        waitForElementLoad("#guide").then((navBar) => {
          const attr = document.createAttribute("opened");
          navBar.style.display = "none"; // hide action being done
          navBar.setAttributeNode(attr);
          waitForElementLoad("#sections").then(() => {
            // close the side bar and re-display it
            navBar.removeAttribute("opened");
            navBar.style.removeProperty("display");
            res(waitForElementLoad(SubscriptionExpander));
          });
        });
      });
const expandSubscription = (expander: Element, list: Element) => {
  const trigger: HTMLElement = expander.querySelector("yt-interaction");
  trigger.click();
  const expandedItems = expander.querySelector("#expandable-items");
  list.append(...expandedItems.children);
  expander.remove();
  updateSubscriptionOrder(list);
  sortSubscriptions(list);
};
const injectScript = () => {
  const s = document.createElement("script");
  (document.head || document.documentElement).appendChild(s);
  s.onload = function () {
    const t = this as HTMLScriptElement;
    t.remove();
  };
  s.src = chrome.runtime.getURL("src/injected/index.js");
};
const initUserInfo = async () => {
  const userInfo: HTMLElement = document.querySelector("ytd-popup-container");
  userInfo.style.display = "none";
  const avatarButton = document.getElementById("avatar-btn");
  avatarButton.click();
  await waitForElementLoad("#channel-handle");
  avatarButton.click();
  userInfo.style.removeProperty("display");
};

const main = () => {
  chrome.runtime.onMessage.addListener(
    async (
      { type, flag }: FlaggedMessage,
      _sender: chrome.runtime.MessageSender,
      response: (response?: any) => void
    ): Promise<void> => {
      injectScript();
      switch (type) {
        case "initialize":
          const expander = await initializeNavBar(flag);
          await initUserInfo();
          // expand subscription section
          const subscriptionList = expander.closest("#items");
          subscriptionList.classList.add("yso-subscription-list");
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
          break;
        case "update":
          const subList = document.querySelector(".yso-subscription-list");
          let allFolders: NodeListOf<Element>;
          const uid = document
            .getElementById("channel-handle")
            .getAttribute("title");
          if (flag) {
            // update the original order array
            updateSubscriptionOrder(subList);
            // re-sort alphabetically
            sortSubscriptions(subList);
            // setup folders
            initializeStoredFolders(subList);
            // update storedData in case of folder content change
            allFolders = subList.querySelectorAll(`.${FOLDER_CLASS}`);
            resetStorage(allFolders);
            return;
          }
          // new subscription found on top of folders
          const newSub = subList.firstElementChild;
          // update order array
          prependNewSubscription(newSub);
          // place new subscription below all folders
          allFolders = subList.querySelectorAll(`.${FOLDER_CLASS}`);
          if (allFolders.length > 0) {
            allFolders[allFolders.length - 1].after(newSub);
          }
          break;
        case "check":
          const initialized = document.querySelector(".yso-subscription-list");
          response(!!initialized);
      }
    }
  );
};

main();
