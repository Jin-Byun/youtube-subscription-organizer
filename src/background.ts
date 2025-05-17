import type { FlaggedMessage } from "./constants";

const WIDTH_LG = 1312;
const YOUTUBE_ORIGIN = "https://www.youtube.com";
const accessLevel = chrome.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS;
const SUB_ORDER_KEY = "YSO-SUBSCRIPTION-ORDER";

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
		chrome.storage.session.remove("browse");
		chrome.storage.session.remove("filter");

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

chrome.runtime.onMessageExternal.addListener(async ({ msg }, sender, res) => {
	if (sender.origin !== YOUTUBE_ORIGIN) return;
	if (msg === "order") {
		const value = await chrome.storage.session.get(SUB_ORDER_KEY);
		res(value?.[SUB_ORDER_KEY]);
	}
	if (msg === "browse") {
		console.log("here in browse");
		chrome.storage.session.set({ browse: true });
	}
});

const SUB_URL = "https://www.youtube.com/youtubei/v1/subscription/*";
const BROWSE_URL = "https://www.youtube.com/youtubei/v1/browse*";

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
		const { pathname } = new URL(tab.url);
		if (pathname !== "/feed/subscriptions") return;
		const { filter }: { filter: { title: string; start: number } | null } =
			await chrome.storage.session.get("filter");
		const { browse } = await chrome.storage.session.get("browse");
		console.log(browse, filter);
		chrome.storage.session.remove("browse");
		const allsession = await chrome.storage.session.get(null);
		console.log(allsession);
		if (!filter || !browse) return;
		chrome.tabs
			.sendMessage<FlaggedMessage>(tab.id, {
				type: "filter",
				flag: false,
				data: { [filter.title]: filter.start },
			})
			.catch((e) => console.error(e));
	},
	{ urls: [SUB_URL, BROWSE_URL] },
);
