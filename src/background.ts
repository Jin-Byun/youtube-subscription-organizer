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
			console.error(e),
		);
	},
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	const { msg } = message;
	switch (msg) {
		case "filter": {
			chrome.storage.session.get(
				"filter",
				({ filter }: { filter: FilterData }) => {
					if (!filter) return;
					const { data: cardsStart } = message;
					if (cardsStart !== null && filter.nextStart > cardsStart) {
						filter.itemCount = 0;
						filter.nextStart = 1;
					}
					sendYSOMessage(msg, true, filter).catch((e) => console.error(e));
				},
			);
			break;
		}
		case "getAllFolders": {
			chrome.storage.sync.get(null, (data) => {
				sendResponse({ data });
			});
			break;
		}
		case "reset": {
			chrome.storage.sync
				.clear()
				.then(() => sendResponse({ success: true }))
				.catch((e) => {
					sendResponse({ success: false, msg: e });
				});
			break;
		}
		case "remove": {
			const { target, parent } = message;
			if (target === parent) {
				chrome.storage.sync.remove(target, () => {
					sendResponse({ success: true });
				});
			} else {
				chrome.storage.sync.get(parent, (data) => {
					const folder = data[parent];
					delete folder[target];
					chrome.storage.sync.set({ [parent]: folder }, () => {
						sendResponse({ success: true });
					});
				});
			}
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
