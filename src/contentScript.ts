import { SubscriptionMessage } from "./background";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

const SubscriptionExpander =
  "ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";
const ChannelTag = "ytd-guide-entry-renderer";
const ExpandClass = "click-2-expand";
const FolderIcon = "Icon_folder_2019_1.svg";
const attrName = "newFolderAdd";
const active = document.createAttribute("active");

const localStorageKey = "YSO-KEY";

const storeFolderLocal = (title: string, selected: NodeListOf<Element>) => {
  let check = localStorage.getItem(localStorageKey);
  if (!check) {
    localStorage.setItem(localStorageKey, "{}");
  }
  check = localStorage.getItem(localStorageKey);
  const storedFolders = JSON.parse(check);
  storedFolders[title] = [];
  for (const ch of selected) {
    const anchor = ch.firstElementChild as HTMLAnchorElement;
    storedFolders[title].push(anchor.href);
  }
  localStorage.setItem(localStorageKey, JSON.stringify(storedFolders));
};

const initializeNavBar = (isLoaded: Boolean): Promise<HTMLElement> => {
  if (isLoaded) return waitForElementLoad(SubscriptionExpander);

  let navBarTrigger: HTMLElement;

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
    return waitForElementLoad(SubscriptionExpander);
  });
};

const expandSubscription = (expander: Element, list: Element) => {
  const trigger: HTMLElement = expander.querySelector("yt-interaction");
  trigger.click();
  const expandedItems = expander.querySelector("#expandable-items");
  list.append(...expandedItems.children);
  expander.remove();
};

const SaveButton = (subList: Element): HTMLButtonElement => {
  const button = document.createElement("button");
  button.innerText = "Save";
  button.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const labelDiv = target.previousElementSibling;
    const title = labelDiv.textContent;

    const subFolder = document.createElement("div");
    subFolder.addEventListener("click", toggleCollapsible);
    subFolder.className = "yt-organizer-folder";
    subFolder.innerHTML = `<div class="${ExpandClass}">${title}</div><p class="${ExpandClass}"></p>`;

    const folderImg = document.createElement("img");
    folderImg.src = chrome.runtime.getURL(FolderIcon);
    folderImg.className = ExpandClass;
    subFolder.prepend(folderImg);

    const selectedSubs = subList.querySelectorAll(`[${attrName}="true"]`);
    deactivateToggleChannel(subList);
    subFolder.style.setProperty("--number-of-ch", `${selectedSubs.length}`);
    subFolder.append(...selectedSubs);

    subList.prepend(subFolder);
    storeFolderLocal(title, selectedSubs);
    target.parentElement.remove();
  });
  return button;
};

const createNewFolderButton = (list: Element): HTMLButtonElement => {
  const button = document.createElement("button");
  button.id = "create-new-folder-button";
  button.innerText = "+";
  button.addEventListener("click", () => {
    activateToggleChannel(list);
    const subFolder = document.createElement("div");
    subFolder.className = "yt-organizer-folder new";
    subFolder.innerHTML = "<div contenteditable>Test</div>";
    subFolder.append(SaveButton(list));
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

      initializeNavBar(navBarLoaded).then((expander) => {
        // expand subscription section
        const subscriptionList = expander.closest("#items");
        expandSubscription(expander, subscriptionList);

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

function toggleCollapsible(this: HTMLDivElement, e: MouseEvent) {
  const clickedOn = e.target as HTMLElement;
  if ([ExpandClass, this.className].includes(clickedOn.className)) {
    this.classList.contains("hide")
      ? this.classList.remove("hide")
      : this.classList.add("hide");
    return;
  }
  // handle active attribute removal
  for (const node of this.querySelectorAll(ChannelTag)) {
    node.removeAttribute("active");
  }
  clickedOn.closest(ChannelTag).setAttributeNode(active);
}

function toggleChannel(this: Element, e: MouseEvent) {
  e.preventDefault();
  if (this.getAttribute(attrName) === "true") {
    this.setAttribute(attrName, "false");
  } else {
    this.setAttribute(attrName, "true");
  }
}

function deactivateToggleChannel(list: Element) {
  for (const ch of list.children) {
    ch.removeAttribute(attrName);
    ch.removeEventListener("contextmenu", toggleChannel);
  }
}
function activateToggleChannel(list: Element) {
  for (const ch of list.children) {
    ch.setAttribute(attrName, "false");
    ch.addEventListener("contextmenu", toggleChannel);
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
