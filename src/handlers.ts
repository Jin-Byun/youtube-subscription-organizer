import {
	CHANNEL_TAG,
	FOLDER_CLASS,
	STORAGE_KEY,
	EXPAND_CLASS,
	ATTR_NAME,
} from "./constants";
import {
	sortSubscriptions,
	resetStorage,
	getAllStoredFolders,
	getUserStoredFolders,
	getCurrId,
} from "./utils";

const active = document.createAttribute("active");

export async function handleDelete(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	const subscriptionTab = folder.parentElement;
	const channels = folder.querySelectorAll(CHANNEL_TAG);
	subscriptionTab.lastElementChild.before(...channels);
	const folders = subscriptionTab.querySelectorAll(`.${FOLDER_CLASS}`);
	sortSubscriptions(subscriptionTab, folders);
	folder.remove();
	const storedData = await getAllStoredFolders();
	const id = await getCurrId();
	delete storedData[id][folder.title];
	await chrome.storage.sync.set({ [STORAGE_KEY]: storedData });
}

export function handleEdit(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	folder.classList.add("edit");
	for (const f of folder.querySelectorAll(".YSO-edit-menu")) {
		f.classList.add("edit");
	}
	activateToggleChannel(folder.querySelectorAll(CHANNEL_TAG), true);

	const labelDiv = folder.children[1] as HTMLDivElement;
	labelDiv.contentEditable = "true";
	labelDiv.setAttribute("data-title", labelDiv.textContent);

	const subscriptionTab = folder.parentElement;
	activateToggleChannel(subscriptionTab.querySelectorAll(CHANNEL_TAG));
}

export async function handleSave(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	const labelDiv = folder.children[1] as HTMLDivElement;

	const isValid = await isSaveValid(labelDiv);
	if (!isValid) return;
	removeEditClass(folder);

	const channels = folder.querySelectorAll(CHANNEL_TAG);

	const subscriptionTab = folder.parentElement;
	subscriptionTab.lastElementChild.before(...channels);
	const selectedSubs = subscriptionTab.querySelectorAll(
		`[${ATTR_NAME}="true"]`,
	);
	folder.append(...selectedSubs);

	const allFolders = subscriptionTab.querySelectorAll(`.${FOLDER_CLASS}`);
	sortSubscriptions(subscriptionTab, allFolders);

	await resetStorage(allFolders);

	labelDiv.removeAttribute("contentEditable");
	labelDiv.removeAttribute("data-title");

	deactivateToggleChannel(subscriptionTab.querySelectorAll(CHANNEL_TAG));
}

async function isSaveValid(labelDiv: HTMLDivElement): Promise<boolean> {
	const currTitle = labelDiv.textContent;
	const prevTitle = labelDiv.getAttribute("data-title");
	if (currTitle === "") {
		const tmp = this.textContent;
		this.textContent = "no name";
		setTimeout(() => {
			this.textContent = tmp;
		}, 1500);
		return false;
	}
	const storedFolders = await getUserStoredFolders();
	if (
		Object.keys(storedFolders).includes(currTitle) &&
		currTitle !== prevTitle
	) {
		const tmp = this.textContent;
		this.textContent = "duplicate";
		setTimeout(() => {
			this.textContent = tmp;
		}, 1500);
		return false;
	}
	return true;
}

export function handleCancel(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	removeEditClass(folder);

	const labelDiv = folder.children[1] as HTMLDivElement;
	labelDiv.textContent = labelDiv.getAttribute("data-title");
	labelDiv.removeAttribute("contentEditable");
	labelDiv.removeAttribute("data-title");

	const subscriptionTab = folder.parentElement;
	deactivateToggleChannel(subscriptionTab.querySelectorAll(CHANNEL_TAG));
}

function removeEditClass(folder: HTMLElement): void {
	folder.classList.remove("edit");
	for (const f of folder.querySelectorAll(".YSO-edit-menu")) {
		f.classList.remove("edit");
	}
}

// create and append a floating context menu with option for delete and edit
export function toggleOption(this: HTMLDivElement, e: MouseEvent) {
	const clickedOn = e.target as HTMLElement;
	if (![EXPAND_CLASS, this.className].includes(clickedOn.className)) {
		return;
	}
	e.preventDefault();
	if (this.classList[1]) {
		this.click();
	}
	const editTabs = this.querySelectorAll(".YSO-edit-menu");
	for (const tab of editTabs) {
		tab.toggleAttribute("activate");
	}
}

export const filterContent = async (
	title: string,
	removeFilter: boolean,
	start = 0,
) => {
	const folders = await getUserStoredFolders();
	const channelTitles = folders[title];
	const query =
		'ytd-two-column-browse-results-renderer[page-subtype="subscriptions"] #contents';
	const contentContainer = document.querySelector(query);
	const videoCards = contentContainer.children;
	const contentLength = videoCards.length;
	const firstColumnAttribute = "is-in-first-column";
	const itemsPerRow = Number(videoCards[1].getAttribute("items-per-row"));
	let idx = 0;
	if (removeFilter) {
		// removing filter
		chrome.storage.session.remove("filter");
		for (let i = 1; i < contentLength - 1; i++) {
			const card = videoCards[i] as HTMLElement;
			card.removeAttribute(firstColumnAttribute);
			card.removeAttribute("style");
			if (idx % itemsPerRow === 0) card.setAttribute(firstColumnAttribute, "");
			idx++;
		}
		return;
	}
	idx = start;
	const anchorId = "#avatar-link";
	for (let i = 1; i < contentLength - 1; i++) {
		const card = videoCards[i] as HTMLElement;
		card.removeAttribute(firstColumnAttribute);
		const anchor = card.querySelector(anchorId) as HTMLAnchorElement;
		if (!anchor || !channelTitles.includes(anchor.title)) {
			card.style.display = "none";
			continue;
		}
		if (idx % itemsPerRow === 0) card.setAttribute(firstColumnAttribute, "");
		idx++;
	}
	chrome.storage.session.set({ filter: { title, start: idx } });
};

export async function toggleCollapsible(this: HTMLDivElement, e: MouseEvent) {
	const clickedOn = e.target as HTMLElement;
	if (![EXPAND_CLASS, this.className].includes(clickedOn.className)) {
		// mimic channel highlighting when redirected to specific channel
		for (const node of this.querySelectorAll(CHANNEL_TAG)) {
			node.removeAttribute("active");
		}
		clickedOn.closest(CHANNEL_TAG).setAttributeNode(active);
		return;
	}
	if (this.classList.contains("edit")) return;

	this.classList.toggle("hide");
	if (window.location.pathname !== "/feed/subscriptions") return;

	await filterContent(this.title, this.classList.contains("hide"));
}

export function deactivateToggleChannel(
	list: HTMLCollection | NodeListOf<Element>,
) {
	for (const ch of list) {
		ch.removeAttribute(ATTR_NAME);
		ch.removeEventListener("contextmenu", toggleChannel);
	}
}
export function activateToggleChannel(
	list: HTMLCollection | NodeListOf<Element>,
	isActive = false,
) {
	for (const ch of list) {
		if (ch.hasAttribute(ATTR_NAME)) continue;
		ch.setAttribute(ATTR_NAME, isActive ? "true" : "false");
		ch.addEventListener("contextmenu", toggleChannel);
	}
}

function toggleChannel(this: Element, e: MouseEvent) {
	e.preventDefault();
	if (this.getAttribute(ATTR_NAME) === "true") {
		this.setAttribute(ATTR_NAME, "false");
	} else {
		this.setAttribute(ATTR_NAME, "true");
	}
}
