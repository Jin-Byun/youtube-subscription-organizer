import {
	CHANNEL_TAG,
	STORAGE_KEY,
	SUB_ORDER_KEY,
	NUM_CHANNEL,
	type FolderData,
} from "./constants";

export async function storeFolderLocal(
	selected: NodeListOf<Element>,
	title: string,
) {
	const storedFolders = (await getUserStoredFolders()) ?? {};
	const newFolder = [];
	for (const ch of selected) {
		const anchor = ch.firstElementChild as HTMLAnchorElement;
		newFolder.push(anchor.title);
	}
	storedFolders[title] = newFolder;
	const id = await getCurrId();
	await chrome.storage.sync.set({
		[STORAGE_KEY]: { ...getAllStoredFolders, [id]: storedFolders },
	});
}

export async function resetStorage(folders: NodeListOf<Element> | null = null) {
	await chrome.storage.sync.set({ [STORAGE_KEY]: {} });
	if (folders === null) return;
	for (const f of folders) {
		const fLabel = f.children[1] as HTMLDivElement;
		const fTitle = fLabel.textContent;
		const fChannels = f.querySelectorAll(CHANNEL_TAG);
		(f as HTMLElement).style.setProperty(NUM_CHANNEL, `${fChannels.length}`);
		await storeFolderLocal(fChannels, fTitle);
	}
}

export async function getAllStoredFolders(): Promise<FolderData> {
	const value = await chrome.storage.sync.get(STORAGE_KEY);
	return value?.[STORAGE_KEY];
}

export async function getUserStoredFolders(): Promise<{
	[folderName: string]: string[];
}> {
	const allFolders = await getAllStoredFolders();
	const id = await getCurrId();
	return allFolders?.[id];
}

export function sortSubscriptions(
	list: Element,
	folders: NodeListOf<Element> | null = null,
) {
	const subscriptions = list.children;
	const tmp = Array.from(subscriptions).flatMap((v: Element) =>
		v.tagName.toLowerCase() === CHANNEL_TAG ? v : [],
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

export async function updateSubscriptionOrder(list: Element) {
	const order = await getSubscriptionOrder();
	if (order) return;
	const subscriptions = list.children;
	const titleArr: string[] = [];
	for (const el of subscriptions) {
		const a = el.firstElementChild as HTMLAnchorElement;
		if (!a?.title) continue;
		titleArr.push(a.title);
	}
	chrome.storage.session.set({ [SUB_ORDER_KEY]: titleArr });
}

export async function getSubscriptionOrder(): Promise<string[]> {
	const value = await chrome.storage.session.get(SUB_ORDER_KEY);
	return value?.[SUB_ORDER_KEY];
}

export async function prependNewSubscription(node: Element) {
	const order = await getSubscriptionOrder();
	const a = node.firstElementChild as HTMLAnchorElement;
	order.unshift(a.title);
	chrome.storage.session.set({ [SUB_ORDER_KEY]: order });
}

export function waitForElementLoad(
	selector: string,
	parent = document.body,
): Promise<HTMLElement> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(selector)) {
			return resolve(document.querySelector(selector) as HTMLElement);
		}

		const observer = new MutationObserver(elementLoaded);

		observer.observe(parent, {
			childList: true,
			subtree: true,
		});

		const timeoutID = setTimeout(() => {
			observer.disconnect();
			reject(`here ${selector}`);
		}, 2000);

		function elementLoaded() {
			if (document.querySelector(selector)) {
				observer.disconnect();
				clearTimeout(timeoutID);
				resolve(document.querySelector(selector) as HTMLElement);
			}
		}
	});
}

export function waitForVideoCardLoad(
	prevCount: number,
	videoCards: HTMLCollection,
	container: Element,
): Promise<void> {
	return new Promise((resolve) => {
		if (videoCards.length - prevCount > 10) {
			return resolve();
		}

		const observer = new MutationObserver(videoCardLoaded);

		observer.observe(container, {
			childList: true,
		});

		const timeoutId = setTimeout(() => {
			console.log("timeout reached");
			resolve();
		}, 5000);

		function videoCardLoaded() {
			if (videoCards.length - prevCount > 10) {
				clearTimeout(timeoutId);
				observer.disconnect();
				resolve();
			}
		}
	});
}

const SESSIONUSER = "sessionUser";

export async function storeUserId(title: string) {
	chrome.storage.session.set({ [SESSIONUSER]: title });
}

export async function getCurrId(): Promise<string> {
	const value = await chrome.storage.session.get(SESSIONUSER);
	return value?.[SESSIONUSER];
}

export const sleep = (ms: number): Promise<void> =>
	new Promise((res) => setTimeout(res, ms));
