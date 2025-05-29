import {
	CHANNEL_TAG,
	ITEMS_PER_ROW,
	type MessageType,
	type SingleDOMGetter,
} from "./constants";

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
		}, 5000);

		function elementLoaded() {
			if (findingFunction(selector)) {
				observer.disconnect();
				clearTimeout(timeoutID);
				resolve(findingFunction<HTMLElement>(selector));
			}
		}
	});

export function observeContentChange(
	container: Element,
	columnIndicator: Element,
): MutationObserver[] {
	const columnNumberChange = new MutationObserver(() => {
		sendYSOMessage("rowChange");
	});
	columnNumberChange.observe(columnIndicator, {
		attributeFilter: [ITEMS_PER_ROW],
	});
	let prevCount = 0;
	const contentLoading = new MutationObserver(() => {
		const newCount = container.children.length;
		if (newCount > prevCount) {
			sendYSOMessage("filter");
		}
		prevCount = newCount;
	});
	contentLoading.observe(container, {
		childList: true,
	});
	return [columnNumberChange, contentLoading];
}

export const sleep = (ms: number): Promise<void> =>
	new Promise((res) => setTimeout(res, ms));

export function sendYSOMessage(msgType: MessageType) {
	chrome.runtime.sendMessage({ msg: msgType });
}
