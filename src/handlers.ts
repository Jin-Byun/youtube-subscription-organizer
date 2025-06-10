import {
	CHANNEL_TAG,
	EXPAND_CLASS,
	ADD_TO_FOLDER,
	NUM_CHANNEL,
	VIDEOCARD_LOADER_TAG,
	VIDEOCARD_ANCHOR_ID,
	ITEMS_PER_ROW,
	TITLE_ID,
	EDIT_CLASS,
	HIDE_CLASS,
	CONTENTEDITABLE,
	DATA_TITLE,
	FILTER_CLASS,
	FIRST_COLUMN,
	SUBSCRIPTION_HEADING,
	SAVE_ERR_DUPLICATE,
	SAVE_ERR_NO_NAME,
	TRUE,
	FALSE,
	ACTIVATE,
	ACTIVE,
	SUBSCRIPTION_CONTENT_CONTAINER,
	YOUTUBE_SUBSCRIPTION_PATH,
	EDIT_MENU_CLASS,
} from "./constants";
import { sortSubscriptions, observeContentChange } from "./utils";
import {
	updateUserFolder,
	getUserStoredFolders,
	deleteFolder,
	hasMutationObservers,
	setMutationObservers,
	setFilter,
	removeFilter,
} from "./storage";
import {
	getAllChildFolders,
	getAllYSOTabs,
	getChildChannels,
	getElementFromId,
} from "./dom";

export async function handleDelete(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	folder.removeEventListener("click", toggleCollapsible);
	const subscriptionTab = folder.parentElement;
	const channels = getChildChannels(folder);
	const channelFeed = subscriptionTab.lastElementChild;
	channelFeed.before(...channels);
	folder.remove();
	sortSubscriptions(subscriptionTab);
	await deleteFolder(folder.title);
}

export function handleEdit(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	folder.classList.add(EDIT_CLASS);
	for (const f of getAllYSOTabs(folder)) {
		f.classList.add(EDIT_CLASS);
	}
	activateToggleChannel(getChildChannels(folder), true);

	const labelDiv = folder.children[1];
	labelDiv.setAttribute(DATA_TITLE, labelDiv.textContent);
	labelDiv.setAttribute(CONTENTEDITABLE, "");

	const subscriptionTab = folder.parentElement;
	activateToggleChannel(getChildChannels(subscriptionTab));
}

export async function handleSave(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	const labelDiv = folder.children[1];
	if (!(await isSaveValid(labelDiv))) return;

	removeEditClass(folder);

	const channels = getChildChannels(folder);
	const subscriptionTab = folder.parentElement;
	subscriptionTab.lastElementChild.before(...channels);
	const selectedSubs = subscriptionTab.querySelectorAll(
		`[${ADD_TO_FOLDER}="${TRUE}"]`,
	);
	folder.append(...selectedSubs);
	sortSubscriptions(subscriptionTab);

	// before updating sync storage, remove the folder from the previous title
	const prevTitle = labelDiv.getAttribute(DATA_TITLE);
	if (prevTitle !== labelDiv.textContent) {
		await deleteFolder(prevTitle);
	}
	const allFolders = getAllChildFolders(subscriptionTab);
	for (const f of allFolders) {
		const fLabel = f.children[1];
		const fTitle = fLabel.textContent;
		const fChannels = getChildChannels(f);
		(f as HTMLElement).style.setProperty(NUM_CHANNEL, `${fChannels.length}`);
		await updateUserFolder(fChannels, fTitle);
	}

	labelDiv.removeAttribute(CONTENTEDITABLE);
	labelDiv.removeAttribute(DATA_TITLE);

	deactivateToggleChannel(getChildChannels(subscriptionTab));
}

async function isSaveValid(labelDiv: Element): Promise<boolean> {
	const currTitle = labelDiv.textContent;
	const prevTitle = labelDiv.getAttribute(DATA_TITLE);
	if (currTitle === "") {
		labelDiv.textContent = SAVE_ERR_NO_NAME;
		setTimeout(() => {
			labelDiv.textContent = currTitle;
		}, 1500);
		return false;
	}
	if (
		Object.keys(await getUserStoredFolders()).includes(currTitle) &&
		currTitle !== prevTitle
	) {
		labelDiv.textContent = SAVE_ERR_DUPLICATE;
		setTimeout(() => {
			labelDiv.textContent = currTitle;
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
	labelDiv.textContent = labelDiv.getAttribute(DATA_TITLE);
	labelDiv.removeAttribute(CONTENTEDITABLE);
	labelDiv.removeAttribute(DATA_TITLE);

	const subscriptionTab = folder.parentElement;
	deactivateToggleChannel(getChildChannels(subscriptionTab));
}

function removeEditClass(folder: HTMLElement): void {
	folder.classList.remove(EDIT_CLASS);
	for (const f of getAllYSOTabs(folder)) {
		f.classList.remove(EDIT_CLASS);
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
	for (const tab of getAllYSOTabs(this)) {
		tab.toggleAttribute(ACTIVATE);
	}
}

const getFilterItems = (): {
	container: Element;
	videoCards: HTMLCollection;
	title: Element;
	itemsPerRow: number;
} => {
	const container = document.querySelector(SUBSCRIPTION_CONTENT_CONTAINER);
	const videoCards = container.children;
	const header = videoCards[0];
	const title = getElementFromId(TITLE_ID, header);
	const itemsPerRow = Number(videoCards[1].getAttribute(ITEMS_PER_ROW));
	return {
		container,
		videoCards,
		title,
		itemsPerRow,
	};
};
export const filterContent = async (
	channelTitles: string[],
	itemsFiltered: number,
	start: number,
	folderName = "",
) => {
	const { container, videoCards, title, itemsPerRow } = getFilterItems();
	if (start === 1) {
		container.classList.add(FILTER_CLASS);
		if (!(await hasMutationObservers())) {
			setMutationObservers(observeContentChange(container, videoCards[1]));
		}
		videoCards[0].classList.add(FILTER_CLASS);
		title.textContent = `${SUBSCRIPTION_HEADING} of ${folderName}`;
	}
	let itemCount = itemsFiltered;
	let idx = start;
	for (; videoCards[idx].tagName !== VIDEOCARD_LOADER_TAG; idx++) {
		const card = videoCards[idx];
		card.removeAttribute(FIRST_COLUMN);
		const anchor = getElementFromId<HTMLAnchorElement>(
			VIDEOCARD_ANCHOR_ID,
			card,
		);
		if (!anchor || !channelTitles.includes(anchor.title)) {
			card.classList.remove(FILTER_CLASS);
			continue;
		}
		card.classList.add(FILTER_CLASS);
		if (itemCount % itemsPerRow === 0) card.setAttribute(FIRST_COLUMN, "");
		itemCount++;
	}
	setFilter(channelTitles, itemCount, idx);
};

export const reorganizeFilter = () => {
	const { videoCards, itemsPerRow } = getFilterItems();
	const contentLength = videoCards.length;
	let idx = 0;
	for (let i = 1; i < contentLength - 1; i++) {
		const card = videoCards[i];
		card.removeAttribute(FIRST_COLUMN);
		if (!card.classList.contains(FILTER_CLASS)) continue;
		if (idx % itemsPerRow === 0) card.setAttribute(FIRST_COLUMN, "");
		idx++;
	}
};

export const unfilterContent = () => {
	removeFilter();
	const { container, videoCards, title, itemsPerRow } = getFilterItems();
	title.textContent = SUBSCRIPTION_HEADING;
	const contentLength = videoCards.length;
	let idx = 0;
	container.classList.remove(FILTER_CLASS);
	for (let i = 1; i < contentLength - 1; i++) {
		const card = videoCards[i] as HTMLElement;
		card.removeAttribute(FIRST_COLUMN);
		card.classList.remove(FILTER_CLASS);
		if (idx % itemsPerRow === 0) card.setAttribute(FIRST_COLUMN, "");
		idx++;
	}
};

export async function toggleCollapsible(this: HTMLDivElement, e: MouseEvent) {
	const clickedOn = e.target as HTMLElement;
	// clicking on the tabs
	if (clickedOn.classList.contains(EDIT_MENU_CLASS)) return;
	// if clicking the channel inside the folder
	if (![EXPAND_CLASS, this.className].includes(clickedOn.className)) {
		// mimic channel highlighting when redirected to specific channel
		for (const node of getChildChannels(this)) {
			node.removeAttribute(ACTIVE);
		}
		clickedOn.closest(CHANNEL_TAG).setAttribute(ACTIVE, "");
		return;
	}
	// prevent action if in edit mode
	if (this.classList.contains(EDIT_CLASS)) return;

	if (window.location.pathname === YOUTUBE_SUBSCRIPTION_PATH) {
		if (this.classList.contains(HIDE_CLASS)) {
			for (const folder of getAllChildFolders(this.parentElement)) {
				folder.classList.add(HIDE_CLASS);
			}
			const folders = await getUserStoredFolders();
			await filterContent(
				folders[this.title].map(({ title }) => title),
				0,
				1,
				this.title,
			);
		} else {
			unfilterContent();
		}
	}
	// settimeout smoothes the folder accordion animation
	setTimeout(() => {
		this.classList.toggle(HIDE_CLASS);
	}, 0);
}

export function deactivateToggleChannel(
	list: HTMLCollection | NodeListOf<Element>,
) {
	for (const ch of list) {
		ch.removeAttribute(ADD_TO_FOLDER);
		ch.removeEventListener("contextmenu", toggleChannel);
	}
}
export function activateToggleChannel(
	list: HTMLCollection | NodeListOf<Element>,
	isActive = false,
) {
	for (const ch of list) {
		if (ch.hasAttribute(ADD_TO_FOLDER)) continue;
		ch.setAttribute(ADD_TO_FOLDER, isActive ? TRUE : FALSE);
		ch.addEventListener("contextmenu", toggleChannel);
	}
}

function toggleChannel(this: Element, e: MouseEvent) {
	e.preventDefault();
	this.setAttribute(
		ADD_TO_FOLDER,
		this.getAttribute(ADD_TO_FOLDER) === TRUE ? FALSE : TRUE,
	);
}
