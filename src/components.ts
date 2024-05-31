import {
  STORAGE_KEY,
  EXPAND_CLASS,
  FOLDER_CLASS,
  FOLDER_ICON,
  ATTR_NAME,
  NUM_CHANNEL,
  LABEL_PLACEHOLDER,
  LABEL_NOTITLE,
  PLACEHOLDER_ATTR,
  LABEL_NOCHANNEL,
} from "./constants";
import {
  handleDelete,
  handleEdit,
  deactivateToggleChannel,
  activateToggleChannel,
  toggleCollapsible,
  toggleOption,
} from "./handlers";
type FolderData = {
  [key: string]: string[];
};

const storeFolderLocal = (title: string, selected: NodeListOf<Element>) => {
  let check = localStorage.getItem(STORAGE_KEY);
  if (!check) {
    localStorage.setItem(STORAGE_KEY, "{}");
  }
  check = localStorage.getItem(STORAGE_KEY);
  const storedFolders = JSON.parse(check);
  storedFolders[title] = [];
  for (const ch of selected) {
    const anchor = ch.firstElementChild as HTMLAnchorElement;
    storedFolders[title].push(anchor.href);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedFolders));
};
const subscriptionFolder = (title: string): HTMLDivElement => {
  const label = `<div class="${EXPAND_CLASS}">${title}</div>`;
  const caret = `<p class="${EXPAND_CLASS}"></p>`;

  const subFolder = document.createElement("div");
  subFolder.addEventListener("click", toggleCollapsible);
  subFolder.addEventListener("contextmenu", toggleOption);
  subFolder.className = `${FOLDER_CLASS} hide`;
  subFolder.setAttribute("title", title);
  subFolder.innerHTML = `${label}${caret}`;

  const folderImg = document.createElement("img");
  folderImg.src = chrome.runtime.getURL(FOLDER_ICON);
  folderImg.className = EXPAND_CLASS;
  subFolder.prepend(folderImg);
  subFolder.append(deleteTab(), editTab(), saveTab());

  return subFolder;
};
const SaveButton = (subList: Element): HTMLButtonElement => {
  const button = document.createElement("button");
  button.innerText = "Save";
  button.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const labelDiv = target.previousElementSibling as HTMLElement;
    const title = labelDiv.textContent;
    if (title === "") {
      labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_NOTITLE);
      setTimeout(() => {
        labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_PLACEHOLDER);
      }, 1500);
      return;
    }
    const selectedSubs = subList.querySelectorAll(`[${ATTR_NAME}="true"]`);
    if (selectedSubs.length === 0) {
      labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_NOCHANNEL);
      setTimeout(() => {
        labelDiv.setAttribute(PLACEHOLDER_ATTR, "");
      }, 1500);
      return;
    }

    const subFolder = subscriptionFolder(title);

    deactivateToggleChannel(subList.children);
    subFolder.style.setProperty(NUM_CHANNEL, `${selectedSubs.length}`);
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
const editTab = (): HTMLDivElement => {
  const editTab = document.createElement("div");
  editTab.addEventListener("click", handleEdit);
  editTab.innerText = "✂ Edit";
  editTab.className = "YSO-edit-menu edit-YSO-folder";
  return editTab;
};
const saveTab = (): HTMLDivElement => {
  const saveTab = document.createElement("div");
  saveTab.addEventListener("click", () => {
    console.log("save");
  });
  saveTab.innerText = "💾 Save";
  saveTab.className = "YSO-edit-menu save-YSO-folder";
  return saveTab;
};

export function createNewFolderButton(list: Element): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = "create-new-folder-button";
  button.innerText = "+";
  button.addEventListener("click", () => {
    activateToggleChannel(list.children);
    const subFolder = document.createElement("div");
    subFolder.className = `${FOLDER_CLASS} new`;
    const labelDiv = document.createElement("div");
    labelDiv.contentEditable = "true";
    labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_PLACEHOLDER);
    function removePlaceholder() {
      this.setAttribute(PLACEHOLDER_ATTR, "");
      this.removeEventListener(removePlaceholder);
    }
    labelDiv.addEventListener("focus", removePlaceholder);
    subFolder.append(labelDiv);
    subFolder.append(SaveButton(list));
    list.prepend(subFolder);
  });
  return button;
}
export function initializeStoredFolders(list: Element) {
  const check = localStorage.getItem(STORAGE_KEY);
  if (!check) return;
  const folders: FolderData = JSON.parse(check);
  for (const [title, channels] of Object.entries(folders)) {
    const folder = subscriptionFolder(title);
    folder.style.setProperty(NUM_CHANNEL, `${channels.length}`);
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
