type FolderData = {
  [key: string]: string[];
};

const localStorageKey = "YSO-KEY";
const ChannelTag = "ytd-guide-entry-renderer";
const ExpandClass = "click-2-expand";
const FolderClass = "yt-organizer-folder";
const FolderIcon = "Icon_folder_2019_1.svg";
const attrName = "newFolderAdd";
const NumberOfChannel = "--number-of-ch";

const active = document.createAttribute("active");

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
const subscriptionFolder = (title: string): HTMLDivElement => {
  const label = `<div class="${ExpandClass}">${title}</div>`;
  const caret = `<p class="${ExpandClass}"></p>`;

  const subFolder = document.createElement("div");
  subFolder.addEventListener("click", toggleCollapsible);
  subFolder.addEventListener("contextmenu", toggleOption);
  subFolder.className = `${FolderClass} hide`;
  subFolder.setAttribute("title", title);
  subFolder.innerHTML = `${label}${caret}`;

  const folderImg = document.createElement("img");
  folderImg.src = chrome.runtime.getURL(FolderIcon);
  folderImg.className = ExpandClass;
  subFolder.prepend(folderImg);
  subFolder.append(deleteTab(), editTab());

  return subFolder;
};
const SaveButton = (subList: Element): HTMLButtonElement => {
  const button = document.createElement("button");
  button.innerText = "Save";
  button.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const labelDiv = target.previousElementSibling;
    const title = labelDiv.textContent;

    const subFolder = subscriptionFolder(title);

    const selectedSubs = subList.querySelectorAll(`[${attrName}="true"]`);
    deactivateToggleChannel(subList);
    subFolder.style.setProperty(NumberOfChannel, `${selectedSubs.length}`);
    subFolder.append(...selectedSubs);

    subList.prepend(subFolder);
    storeFolderLocal(title, selectedSubs);
    target.parentElement.remove();
  });
  return button;
};
const deleteTab = (): HTMLDivElement => {
  const deleteTab = document.createElement("div");
  deleteTab.addEventListener("click", handleDelete);
  deleteTab.innerText = "❌ Delete";
  deleteTab.className = "YSO-edit-menu delete-YSO-folder";
  return deleteTab;
};
function handleDelete(this: HTMLDivElement, e: MouseEvent) {
  e.preventDefault();
  const folder = this.parentElement;
  const subscriptionTab = folder.parentElement;
  const channels = folder.querySelectorAll(ChannelTag);
  subscriptionTab.lastElementChild.before(...channels);
  const folders = subscriptionTab.querySelectorAll(`.${FolderClass}`);
  sortSubscriptions(subscriptionTab, folders);
  folder.remove();
  const currStored = JSON.parse(localStorage.getItem(localStorageKey));
  delete currStored[folder.title];
  localStorage.setItem(localStorageKey, JSON.stringify(currStored));
}

const editTab = (): HTMLDivElement => {
  const editTab = document.createElement("div");
  editTab.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    console.log("here");
  });
  editTab.innerText = "✂ Edit";
  editTab.className = "YSO-edit-menu edit-YSO-folder";
  return editTab;
};

export function createNewFolderButton(list: Element): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = "create-new-folder-button";
  button.innerText = "+";
  button.addEventListener("click", () => {
    activateToggleChannel(list);
    const subFolder = document.createElement("div");
    subFolder.className = `${FolderClass} new`;
    const labelDiv = document.createElement("div");
    labelDiv.contentEditable = "true";
    labelDiv.setAttribute("data-placeholder", "Right click adds channel");
    function disablePlaceholder() {
      this.removeAttribute("data-placeholder");
      this.removeEventListener(disablePlaceholder);
    }
    labelDiv.addEventListener("focus", disablePlaceholder);
    subFolder.append(labelDiv);
    subFolder.append(SaveButton(list));
    list.prepend(subFolder);
  });
  return button;
}
export function initializeStoredFolders(list: Element) {
  const check = localStorage.getItem(localStorageKey);
  if (!check) return;
  const folders: FolderData = JSON.parse(check);
  for (const [title, channels] of Object.entries(folders)) {
    const folder = subscriptionFolder(title);
    folder.style.setProperty(NumberOfChannel, `${channels.length}`);
    const nodeList: Element[] = [];
    for (const node of list.children) {
      const a = node.firstElementChild as HTMLAnchorElement;
      if (channels.includes(a.href)) {
        nodeList.push(node);
      }
    }
    folder.append(...nodeList);
    list.prepend(folder);
  }
}

// create and append a floating context menu with option for delete and edit
function toggleOption(this: HTMLDivElement, e: MouseEvent) {
  const clickedOn = e.target as HTMLElement;
  if (![ExpandClass, this.className].includes(clickedOn.className)) {
    return;
  }
  e.preventDefault();
  if (this.classList[1]) {
    this.click();
  }
  const editTabs = this.querySelectorAll(".YSO-edit-menu");
  for (const tab of editTabs) {
    tab.toggleAttribute("activate");
  }
  if (editTabs[0].getAttribute("activate") !== null) {
    this.style.maxHeight = `${this.scrollHeight + 30}px`;
  } else {
    this.style.removeProperty("max-height");
  }
}
function toggleCollapsible(this: HTMLDivElement, e: MouseEvent) {
  const clickedOn = e.target as HTMLElement;
  if (![ExpandClass, this.className].includes(clickedOn.className)) {
    // handle active attribute removal
    for (const node of this.querySelectorAll(ChannelTag)) {
      node.removeAttribute("active");
    }
    clickedOn.closest(ChannelTag).setAttributeNode(active);
    return;
  }

  const deleteTab = this.querySelector(".YSO-edit-menu");
  if (deleteTab.getAttribute("activate") === null) {
    this.style.removeProperty("max-height");
  } else {
    this.style.maxHeight = `${this.scrollHeight + 30}px`;
  }

  if (this.classList.contains("hide")) {
    this.classList.remove("hide");
  } else {
    this.style.removeProperty("max-height");
    this.classList.add("hide");
  }
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

export function sortSubscriptions(
  list: Element,
  folders: NodeListOf<Element> | null = null
) {
  const subscriptions = list.children;
  const tmp = Array.from(subscriptions).flatMap((v: Element) =>
    v.tagName.toLowerCase() === ChannelTag ? v : []
  );
  const coll = new Intl.Collator("ko");
  const extra = tmp.pop();
  tmp.sort((a, b) => {
    const aTitle = a.querySelector("a").title;
    const bTitle = b.querySelector("a").title;
    return coll.compare(aTitle, bTitle);
  });
  tmp.push(extra);
  list.replaceChildren(...tmp);
  if (folders !== null) {
    list.prepend(...folders);
  }
}
