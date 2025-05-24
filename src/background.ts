import type { FlaggedMessage, FilterData } from "./constants";

const WIDTH_LG = 1312;
const YOUTUBE_ORIGIN = "https://www.youtube.com";
const accessLevel = chrome.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS;

const getCurrentTab = async (): Promise<chrome.tabs.Tab> => {
	const query = { active: true, lastFocusedWindow: true };
	const [tab] = await chrome.tabs.query(query);
	return tab;
};

// adding redirection to youtube onclick of the extension icon
chrome.action.onClicked.addListener((tab) => {
	chrome.tabs.update(tab.id, { url: YOUTUBE_ORIGIN });
});

chrome.tabs.onUpdated.addListener(
	async (
		tabId: number,
		tabInfo: chrome.tabs.TabChangeInfo,
		tab: chrome.tabs.Tab,
	) => {
		if (!tab.url?.includes(YOUTUBE_ORIGIN) || tabInfo.status !== "complete") {
			return;
		}
		const check = await chrome.tabs.sendMessage<FlaggedMessage, boolean>(
			tabId,
			{
				type: "check",
				flag: true,
				data: null,
			},
		);
		if (check) return;
		chrome.storage.session.clear();

		chrome.storage.session.setAccessLevel({ accessLevel });
		chrome.tabs
			.sendMessage<FlaggedMessage>(tabId, {
				type: "initialize",
				flag: tab.width > WIDTH_LG,
				data: null,
			})
			.catch((e) => console.log(e));
	},
);

chrome.runtime.onMessage.addListener(async ({ msg }) => {
	const tab = await getCurrentTab();
	const { filter }: { filter: FilterData | null } =
		await chrome.storage.session.get("filter");
	if (!filter) return;
	switch (msg) {
		case "rowChange":
			chrome.tabs
				.sendMessage<FlaggedMessage>(tab.id, {
					type: "rowChange",
					flag: true,
					data: null,
				})
				.catch((e) => console.log(e));
			break;
		case "itemLoaded":
			chrome.tabs
				.sendMessage<FlaggedMessage>(tab.id, {
					type: "filter",
					flag: true,
					data: filter,
				})
				.catch((e) => console.log(e));
	}
});

const SUB_URL = "https://www.youtube.com/youtubei/v1/subscription/*";

chrome.webRequest.onCompleted.addListener(
	async (details) => {
		const tab = await getCurrentTab();
		if (details.url.includes("subscription")) {
			const flag = details.url.includes("unsubscribe");
			chrome.tabs
				.sendMessage<FlaggedMessage>(tab.id, {
					type: "update",
					flag,
					data: null,
				})
				.catch((e) => console.error(e));
			return;
		}
	},
	{ urls: [SUB_URL] },
);
