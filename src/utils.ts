import {
  CHANNEL_TAG,
  STORAGE_KEY,
  SUB_ORDER_KEY,
  NUM_CHANNEL,
  type FolderData,
} from "./constants";

export function storeFolderLocal(selected: NodeListOf<Element>, title: string) {
  const storedFolders = getUserStoredFolders() ?? {};
  const newFolder = [];
  for (const ch of selected) {
    const anchor = ch.firstElementChild as HTMLAnchorElement;
    newFolder.push(anchor.getAttribute("href"));
  }
  storedFolders[title] = newFolder;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...getAllStoredFolders, [getCurrId()]: storedFolders })
  );
}

export function resetStorage(folders: NodeListOf<Element> | null = null) {
  localStorage.setItem(STORAGE_KEY, "{}");
  if (folders === null) return;
  for (const f of folders) {
    const fLabel = f.children[1] as HTMLDivElement;
    const fTitle = fLabel.textContent;
    const fChannels = f.querySelectorAll(CHANNEL_TAG);
    (f as HTMLElement).style.setProperty(NUM_CHANNEL, `${fChannels.length}`);
    storeFolderLocal(fChannels, fTitle);
  }
}

export function getAllStoredFolders(): FolderData {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

export function getUserStoredFolders(): { [folderName: string]: string[] } {
  const allFolders = getAllStoredFolders();
  return allFolders?.[getCurrId()];
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

export function updateSubscriptionOrder(list: Element) {
  const order: { [id: string]: string[] } =
    JSON.parse(localStorage.getItem(SUB_ORDER_KEY)) ?? {};
  const subscriptions = list.children;
  const hrefArr: string[] = [];
  for (const el of subscriptions) {
    const a = el.firstElementChild as HTMLAnchorElement;
    if (!a?.getAttribute("href")) continue;
    hrefArr.push(a.getAttribute("href"));
  }
  order[getCurrId()] = hrefArr;
  localStorage.setItem(SUB_ORDER_KEY, JSON.stringify(order));
}

export function prependNewSubscription(node: Element) {
  const order: { [id: string]: string[] } = JSON.parse(
    localStorage.getItem(SUB_ORDER_KEY)
  );
  const a = node.firstElementChild as HTMLAnchorElement;
  order[getCurrId()].unshift(a.getAttribute("href"));
  localStorage.setItem(SUB_ORDER_KEY, JSON.stringify(order));
}

export function waitForElementLoad(selector: string): Promise<HTMLElement> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as HTMLElement);
    }

    const observer = new MutationObserver((_mutations) => {
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

export function getCurrId(): string {
  return document.getElementById("channel-handle").getAttribute("title");
}
