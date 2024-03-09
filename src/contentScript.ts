import { SubscriptionMessage } from "./background";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

const initializeNavBar = (isLoaded: Boolean): Promise<HTMLElement> => {
  if (isLoaded) return waitForElementLoad("#sections");

  return new Promise<HTMLElement>((res) => {
    let navBarTrigger: HTMLElement;

    waitForElementLoad("#guide").then((navBar) => {
      navBar.style.display = "none"; // hide action being done
      navBarTrigger = document
        .getElementById("guide-button")
        .querySelector("yt-interaction");
      navBarTrigger.click();
    });
    waitForElementLoad("#sections").then((section) => {
      // close the side bar and re-display it
      navBarTrigger.click();
      document.getElementById("guide").style.removeProperty("display");
      res(section);
    });
  });
};

const expandSubscription = (nested: Element, list: Element) => {
  if (nested.parentElement.id !== "expanded") return;
  const trigger: HTMLElement =
    nested.parentElement.parentElement.querySelector("yt-interaction");
  trigger.click();
  list.append(...nested.children);
  nested.parentElement.parentElement.remove();
};

const createNewFolderButton = (list: Element): HTMLButtonElement => {
  const button = document.createElement("button");
  button.id = "create-new-folder-button";
  button.innerText = "+";
  button.addEventListener("click", () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
    // may skip and just make it so that clicking the item adds to folder.
    // Consider adding contextmenu event to the sub items to add to new folder.
    activateChannelContextMenuEvent(list);
    const subFolder = document.createElement("div");
    subFolder.className = "yt-organizer-new-folder";
    subFolder.innerHTML = "<div contenteditable></div><button>Save</button>";
    list.prepend(subFolder);
  });
  return button;
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

      initializeNavBar(navBarLoaded).then((section) => {
        // expand subscription section
        const nestedItems = section.querySelectorAll("#expandable-items")[1];
        const subscriptionList = nestedItems.closest("#items");
        expandSubscription(nestedItems, subscriptionList);

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

function activateChannelContextMenuEvent(list: Element) {
  const attrName = "newFolderAdd";
  const subscriptions = list.children;
  for (const channel of subscriptions) {
    channel.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault();
      if (!channel.getAttribute(attrName)) {
        channel.setAttribute(attrName, "true");
      } else {
        channel.removeAttribute(attrName);
      }
    });
  }
}

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
