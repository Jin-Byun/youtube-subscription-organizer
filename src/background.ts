import type { YSOMessage, FilterData, MessageType } from "./constants";

export const connectedToBackground = "hello from background";
const WIDTH_LG = 1312;
const ORIGIN = "https://www.youtube.com";
const SUB_PATH = "youtubei/v1/subscription/*";
const accessLevel = chrome.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS;

const getTabId = async (): Promise<number> => {
	const query = { active: true, lastFocusedWindow: true };
	const [tab] = await chrome.tabs.query(query);
	return tab.id ?? -1;
};

const sendYSOMessage = async <T>(
	type: MessageType,
	flag = true,
	data: FilterData | null = null,
	tabId?: number,
): Promise<T> =>
	chrome.tabs.sendMessage<YSOMessage, T>(tabId || (await getTabId()), {
		type,
		flag,
		data,
	});

chrome.tabs.onUpdated.addListener(
	async (
		tabId: number,
		tabInfo: chrome.tabs.TabChangeInfo,
		tab: chrome.tabs.Tab,
	) => {
		if (!tab.url?.includes(ORIGIN) || tabInfo.status !== "complete") {
			return;
		}
		const check = await sendYSOMessage<boolean>("check", true, null, tabId);
		if (check) return;
		chrome.storage.session.clear();
		chrome.storage.session.setAccessLevel({ accessLevel });
		sendYSOMessage("initialize", tab.width > WIDTH_LG).catch((e) =>
			console.log(e),
		);
	},
);

chrome.runtime.onMessage.addListener(async ({ msg }, _sender, sendResponse) => {
	switch (msg) {
		case "filter": {
			const { filter }: { filter: FilterData | null } =
				await chrome.storage.session.get("filter");
			if (!filter) return;
			sendYSOMessage(msg, true, filter).catch((e) => console.log(e));
			break;
		}
		case "getUsers": {
			chrome.storage.sync.getKeys((keys) => {
				console.log(keys);
				sendResponse({ data: keys });
			});
			// await chrome.storage.sync.clear();
			return true;
		}
		case "reset": {
			const syncData = await chrome.storage.sync.get(null);
			console.log(syncData);
			// await chrome.storage.sync.clear();
			sendResponse({ success: true });
		}
	}
	return true;
});

chrome.webRequest.onCompleted.addListener(
	async (details) => {
		if (details.url.includes("subscription")) {
			const flag = details.url.includes("unsubscribe");
			sendYSOMessage("update", flag).catch((e) => console.error(e));
		}
	},
	{ urls: [`${ORIGIN}/${SUB_PATH}`] },
);
