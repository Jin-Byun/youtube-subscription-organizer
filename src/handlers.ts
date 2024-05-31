import {
  CHANNEL_TAG,
  FOLDER_CLASS,
  STORAGE_KEY,
  EXPAND_CLASS,
  ATTR_NAME,
} from "./constants";
import { sortSubscriptions } from "./utils";

const active = document.createAttribute("active");

export function handleDelete(this: HTMLDivElement, e: MouseEvent) {
  e.preventDefault();
  const folder = this.parentElement;
  const subscriptionTab = folder.parentElement;
  const channels = folder.querySelectorAll(CHANNEL_TAG);
  subscriptionTab.lastElementChild.before(...channels);
  const folders = subscriptionTab.querySelectorAll(`.${FOLDER_CLASS}`);
  sortSubscriptions(subscriptionTab, folders);
  folder.remove();
  const currStored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  delete currStored[folder.title];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currStored));
}

export function handleEdit(this: HTMLDivElement, e: MouseEvent) {
  e.preventDefault();
  const folder = this.parentElement;
  folder.classList.add("edit");
  folder
    .querySelectorAll(".YSO-edit-menu")
    .forEach((v) => v.classList.add("edit"));
  activateToggleChannel(folder.querySelectorAll(CHANNEL_TAG), true);
  const subscriptionTab = folder.parentElement;
  activateToggleChannel(subscriptionTab.querySelectorAll(CHANNEL_TAG));

  const labelDiv = folder.children[1] as HTMLDivElement;
  labelDiv.contentEditable = "true";
  labelDiv.setAttribute("data-title", labelDiv.textContent);
}

// create and append a floating context menu with option for delete and edit
export function toggleOption(this: HTMLDivElement, e: MouseEvent) {
  const clickedOn = e.target as HTMLElement;
  if (![EXPAND_CLASS, this.className].includes(clickedOn.className)) {
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
export function toggleCollapsible(this: HTMLDivElement, e: MouseEvent) {
  const clickedOn = e.target as HTMLElement;
  if (![EXPAND_CLASS, this.className].includes(clickedOn.className)) {
    // mimic channel highlighting when redirected to specific channel
    for (const node of this.querySelectorAll(CHANNEL_TAG)) {
      node.removeAttribute("active");
    }
    clickedOn.closest(CHANNEL_TAG).setAttributeNode(active);
    return;
  }
  if (this.classList.contains("edit")) return;

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

export function deactivateToggleChannel(
  list: HTMLCollection | NodeListOf<Element>
) {
  for (const ch of list) {
    ch.removeAttribute(ATTR_NAME);
    ch.removeEventListener("contextmenu", toggleChannel);
  }
}
export function activateToggleChannel(
  list: HTMLCollection | NodeListOf<Element>,
  isActive: boolean = false
) {
  for (const ch of list) {
    if (ch.hasAttribute(ATTR_NAME)) continue;
    ch.setAttribute(ATTR_NAME, isActive ? "true" : "false");
    ch.addEventListener("contextmenu", toggleChannel);
  }
}

function toggleChannel(this: Element, e: MouseEvent) {
  e.preventDefault();
  if (this.getAttribute(ATTR_NAME) === "true") {
    this.setAttribute(ATTR_NAME, "false");
  } else {
    this.setAttribute(ATTR_NAME, "true");
  }
}
