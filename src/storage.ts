import {
	STORAGE_KEY,
	SUB_ORDER_KEY,
	CURR_USER_ID,
	FILTER_KEY,
	OBSERVER_KEY,
} from "./constants";

type Channel = {
	title: string;
	channelPath: string;
};

type FolderData = {
	[folderName: string]: Channel[];
};
const UserStorageId = async () => `${STORAGE_KEY}_${await getCurrId()}`;

/** Getter Section */

/** Helper Start */
const sessionGetter = <T>(key: string): Promise<T | null> =>
	new Promise((resolve) => {
		chrome.storage.session.get(key, (result) => {
			resolve(result?.[key]);
		});
	});

const syncGetter = <T>(key: string): Promise<T | null> =>
	new Promise((resolve) => {
		chrome.storage.sync.get(key, (result) => {
			resolve(result?.[key]);
		});
	});
/** Helper End */

export const getCurrId = (): Promise<string> => sessionGetter(CURR_USER_ID);

export const getSubscriptionOrder = (): Promise<string[]> =>
	sessionGetter(SUB_ORDER_KEY);

export const getUserStoredFolders = async (): Promise<FolderData> =>
	syncGetter(await UserStorageId());

/** Setter Section */

/** Helper Start */
const sessionSetter = <T>(key: string, value: T): Promise<void> =>
	chrome.storage.session.set({ [key]: value });

const syncSetter = <T>(key: string, value: T): Promise<void> =>
	chrome.storage.sync.set({ [key]: value });

const extractChannelPath = (url: string): string => url.slice(45);

const extractChannelsFromNodeList = (
	list: NodeListOf<Element> | HTMLCollection,
): Channel[] =>
	Array.from(list).flatMap((el) => {
		const anchor = el.firstElementChild as HTMLAnchorElement;
		if (!anchor?.title) return [];
		return {
			title: anchor.title,
			channelPath: extractChannelPath(anchor.href),
		};
	});

const extractTItlesFromNodeList = (
	list: NodeListOf<Element> | HTMLCollection,
): string[] =>
	Array.from(list).flatMap(
		(el) => (el.firstElementChild as HTMLAnchorElement)?.title ?? [],
	);
/** Helper End */

export const setCurrId = (title: string): Promise<void> =>
	sessionSetter(CURR_USER_ID, title);

export const setSubscriptionOrder = (
	list: Element | string[],
): Promise<void> => {
	return sessionSetter(
		SUB_ORDER_KEY,
		Array.isArray(list) ? list : extractTItlesFromNodeList(list.children),
	);
};

export const setUserFolder = async (data: FolderData) =>
	syncSetter(await UserStorageId(), data);

export const setMutationObservers = (obs: MutationObserver[]): Promise<void> =>
	sessionSetter(OBSERVER_KEY, obs);

export const setFilter = (
	titles: string[],
	itemCount: number,
	nextStart: number,
): Promise<void> =>
	sessionSetter(FILTER_KEY, {
		titles,
		itemCount,
		nextStart,
	});

/** Others */

export const updateUserFolder = async (
	selected: NodeListOf<Element> | HTMLCollection,
	title: string,
) =>
	setUserFolder({
		...(await getUserStoredFolders()),
		[title]: extractChannelsFromNodeList(selected),
	});

export async function deleteFolder(title: string) {
	const allFolders = await getUserStoredFolders();
	delete allFolders[title];
	await setUserFolder(allFolders);
}

export async function deleteChannelFromFolder(
	removedTitle: string,
	folderTitle: string,
) {
	const allFolders = await getUserStoredFolders();
	allFolders[folderTitle] = allFolders[folderTitle].filter(
		(channel: Channel) => channel.title !== removedTitle,
	);
	await setUserFolder(allFolders);
}

export const resetUserStorage = (): Promise<void> => setUserFolder({});

export async function updateSubscriptionOrder(title: string): Promise<void> {
	const order = await getSubscriptionOrder();
	order.unshift(title);
	return setSubscriptionOrder(order);
}

export const hasMutationObservers = async (): Promise<boolean> =>
	(await sessionGetter<MutationObserver[]>(OBSERVER_KEY)) !== undefined;

export const removeFilter = (): Promise<void> =>
	chrome.storage.session.remove(FILTER_KEY);
