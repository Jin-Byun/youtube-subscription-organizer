import {
	CHANNEL_TAG,
	ITEMS_PER_ROW,
	type MessageType,
	type SingleDOMGetter,
} from "./constants";
import { getElementFromId, getElementFromTag, queryableId } from "./dom";

export const titleFromElement = (el: Element): string =>
	(el.firstElementChild as HTMLElement).title;

export function sortSubscriptions(list: HTMLElement) {
	const upperCaseChannelTag = CHANNEL_TAG.toUpperCase();
	const tmp: Element[] = Array.from(list.children).filter(
		(v: HTMLElement) => v.tagName === upperCaseChannelTag,
	);
	const coll = new Intl.Collator("ko");
	const channelFeed = tmp.pop();
	tmp.sort((a: HTMLElement, b: HTMLElement) => {
		return coll.compare(titleFromElement(a), titleFromElement(b));
	});
	for (const el of tmp) {
		channelFeed.before(el);
	}
}

export const waitForElementLoad = (
	selector: string,
	findingFunction: SingleDOMGetter = (selector: string) =>
		document.getElementById(selector) as HTMLElement,
	parent = document.body,
): Promise<HTMLElement> =>
	new Promise((resolve, reject) => {
		if (findingFunction(selector)) {
			return resolve(findingFunction<HTMLElement>(selector));
		}

		const observer = new MutationObserver(elementLoaded);

		observer.observe(parent, {
			childList: true,
			subtree: true,
		});

		const timeoutID = setTimeout(() => {
			observer.disconnect();
			reject(`waited too long for: ${selector}`);
		}, 10000);

		function elementLoaded() {
			if (findingFunction(selector)) {
				observer.disconnect();
				clearTimeout(timeoutID);
				resolve(findingFunction<HTMLElement>(selector));
			}
		}
	});

export const subscriptionObserver = (el: Element): MutationObserver => {
	let isGrid = el.firstElementChild.tagName.includes("GRID");
	const childObservers = new Array<MutationObserver>(2);
	childObservers[0] = observeContentLoading(getElementFromId("contents", el));
	if (isGrid) {
		childObservers[1] = observeItemPerRow(
			getElementFromTag("ytd-rich-item-renderer", el),
		);
	}
	const obs = new MutationObserver(async () => {
		isGrid = !isGrid;
		childObservers[0]?.disconnect();
		childObservers[1]?.disconnect();
		const contents = await waitForElementLoad(
			queryableId("contents"),
			(selector: string) => el.querySelector(selector),
		);
		childObservers[0] = observeContentLoading(contents);
		if (isGrid) {
			const card = await waitForElementLoad(
				"ytd-rich-item-renderer",
				(selector: string) => el.querySelector(selector),
			);
			childObservers[1] = observeItemPerRow(card);
		}
	});
	obs.observe(el, { childList: true });
	return obs;
};

function observeContentLoading(el: Element): MutationObserver {
	let prevCount = el.children.length;
	const obs = new MutationObserver(() => {
		const newCount = el.children.length;
		if (newCount > prevCount) {
			sendYSOMessage("filter", prevCount);
		}
		prevCount = newCount;
	});
	obs.observe(el, {
		childList: true,
	});
	return obs;
}

function observeItemPerRow(el: Element): MutationObserver {
	const obs = new MutationObserver(() => {
		sendYSOMessage("rowChange");
	});
	obs.observe(el, {
		attributeFilter: [ITEMS_PER_ROW],
	});
	return obs;
}

export const sleep = (ms: number): Promise<void> =>
	new Promise((res) => setTimeout(res, ms));

export function sendYSOMessage(
	msgType: MessageType,
	data: number | null = null,
) {
	chrome.runtime.sendMessage({ msg: msgType, data });
}
