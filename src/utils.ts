import { CHANNEL_TAG, STORAGE_KEY, FolderData } from "./constants";

export function storeFolderLocal(selected: NodeListOf<Element>, title: string) {
  let check = localStorage.getItem(STORAGE_KEY);
  if (!check) resetStorage();
  check = localStorage.getItem(STORAGE_KEY);
  const storedFolders = JSON.parse(check);
  storedFolders[title] = [];
  for (const ch of selected) {
    const anchor = ch.firstElementChild as HTMLAnchorElement;
    storedFolders[title].push(anchor.href);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedFolders));
}

export function resetStorage() {
  localStorage.setItem(STORAGE_KEY, "{}");
}

export function currStored(): FolderData {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

export function sortSubscriptions(
  list: Element,
  folders: NodeListOf<Element> | null = null
) {
  const subscriptions = list.children;
  const tmp = Array.from(subscriptions).flatMap((v: Element) =>
    v.tagName.toLowerCase() === CHANNEL_TAG ? v : []
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

export function waitForElementLoad(selector: string): Promise<HTMLElement> {
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
