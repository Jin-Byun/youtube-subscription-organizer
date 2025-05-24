import { CHANNEL_TAG } from "./constants";

let subListCache: Element | null = null;
export function getSubList(): Element {
	if (!subListCache) {
		subListCache = document.querySelector(".yso-subscription-list");
	}
	return subListCache;
}

export function sortSubscriptions(
	list: Element,
	folders: NodeListOf<Element> | null = null,
) {
	const tmp = Array.from(list.children).flatMap((v: Element) =>
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

export function waitForElementLoad(
	selector: string,
	parent = document.body,
): Promise<HTMLElement> {
	return new Promise((resolve, reject) => {
		if (parent.querySelector(selector)) {
			return resolve(parent.querySelector(selector) as HTMLElement);
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
			if (parent.querySelector(selector)) {
				observer.disconnect();
				clearTimeout(timeoutID);
				resolve(parent.querySelector(selector) as HTMLElement);
			}
		}
	});
}

export function observeContentChange(
	container: Element,
	columnIndicator: Element,
): MutationObserver[] {
	const columnNumberChange = new MutationObserver(() => {
		chrome.runtime.sendMessage({ msg: "rowChange" });
	});
	columnNumberChange.observe(columnIndicator, {
		attributeFilter: ["items-per-row"],
	});
	let prevCount = 0;
	const contentLoading = new MutationObserver(() => {
		const newCount = container.children.length;
		if (newCount > prevCount) {
			chrome.runtime.sendMessage({ msg: "itemLoaded" });
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
