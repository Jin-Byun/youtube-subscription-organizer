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

export async function removeChannelFromFolder(
	removedTitle: string,
	folderTitle: string,
) {
	const allFolders = await getAllStoredFolders();
	const id = await getCurrId();
	const folder = allFolders[id][folderTitle];
	const newFolder = folder.filter((title: string) => title !== removedTitle);
	allFolders[id][folderTitle] = newFolder;
	await chrome.storage.sync.set({ [STORAGE_KEY]: allFolders });
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

export async function setSubscriptionOrder(list: Element | string[]) {
	if (Array.isArray(list)) {
		await chrome.storage.session.set({ [SUB_ORDER_KEY]: list });
		return;
	}
	const subscriptions = list.children;
	const titleArr = new Array<string>();
	for (const el of subscriptions) {
		const a = el.firstElementChild as HTMLAnchorElement;
		if (!a?.title) continue;
		titleArr.push(a.title);
	}
	chrome.storage.session.set({ [SUB_ORDER_KEY]: titleArr });
}

export async function getSubscriptionOrder(): Promise<Array<string>> {
	const value = await chrome.storage.session.get(SUB_ORDER_KEY);
	return value?.[SUB_ORDER_KEY];
}

export async function addSubscriptionOrder(node: Element): Promise<string> {
	const order = await getSubscriptionOrder();
	const { title } = node.firstElementChild as HTMLAnchorElement;
	order.unshift(title);
	await chrome.storage.session.set({ [SUB_ORDER_KEY]: order });
	return title;
}

const SESSIONUSER = "sessionUser";

export async function storeUserId(title: string) {
	chrome.storage.session.set({ [SESSIONUSER]: title });
}

export async function getCurrId(): Promise<string> {
	const value = await chrome.storage.session.get(SESSIONUSER);
	return value?.[SESSIONUSER];
}
