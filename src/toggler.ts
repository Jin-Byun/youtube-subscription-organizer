/**
 * Contains state toggling functions (filtration, active, etc)
 */
import {
	EXPAND_CLASS,
	ACTIVATE,
	EDIT_CLASS,
	EDIT_MENU_CLASS,
	ACTIVE,
	CHANNEL_TAG,
	YOUTUBE_SUBSCRIPTION_PATH,
	HIDE_CLASS,
	ADD_TO_FOLDER,
	FILTER_CLASS,
	FIRST_COLUMN,
	TITLE_ID,
	VIDEOCARD_ANCHOR_ID,
	VIDEOCARD_LOADER_TAG,
	SUBSCRIPTION_CONTENT_CONTAINER,
	ITEMS_PER_ROW,
} from "./constants";
import {
	getAllYSOTabs,
	getChildChannels,
	getAllChildFolders,
	getElementFromId,
	getElementFromTag,
} from "./dom";
import {
	getUserStoredFolders,
	hasMutationObservers,
	removeFilter,
	setFilter,
	setMutationObservers,
} from "./storage";
import { subscriptionObserver } from "./utils";

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

export function toggleEditClass(folder: HTMLElement): void {
	folder.classList.toggle(EDIT_CLASS);
	for (const f of getAllYSOTabs(folder)) {
		f.classList.toggle(EDIT_CLASS);
	}
}

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

export function toggleChannelContextMenu(container: Element, isFolder = false) {
	const list = getChildChannels(container);
	if (!isFolder && list[0].hasAttribute(ADD_TO_FOLDER)) {
		for (const ch of list) {
			ch.removeAttribute(ADD_TO_FOLDER);
			ch.removeEventListener("contextmenu", toggleChannel);
		}
	} else {
		for (const ch of list) {
			ch.setAttribute(ADD_TO_FOLDER, String(isFolder));
			ch.addEventListener("contextmenu", toggleChannel);
		}
	}
}

export function toggleChannel(this: Element, e: MouseEvent) {
	e.preventDefault();
	this.setAttribute(
		ADD_TO_FOLDER,
		String(this.getAttribute(ADD_TO_FOLDER) !== "true"),
	);
}

export const filterContent = async (
	channelTitles: string[],
	itemsFiltered: number,
	start: number,
	folderName = "",
) => {
	const { container, videoCards, title, itemsPerRow } = getFilterItems();
	const isGrid = itemsPerRow > 0;
	if (start === 1) {
		container.classList.add(FILTER_CLASS);
		if (!(await hasMutationObservers())) {
			const primaryContainer = container.closest("#primary");
			setMutationObservers(subscriptionObserver(primaryContainer));
		}
		handleSubscriptionTitle(
			isGrid,
			videoCards[0],
			title,
			folderName,
			channelTitles,
		);
	}
	let idx = start;
	if (!isGrid) {
		for (
			;
			videoCards[idx] && videoCards[idx].tagName !== VIDEOCARD_LOADER_TAG;
			idx++
		) {
			const card = videoCards[idx];
			const cardTitle = getElementFromId<HTMLSpanElement>(TITLE_ID, card);
			if (!cardTitle || !channelTitles.includes(cardTitle.textContent)) {
				card.classList.remove(FILTER_CLASS);
				continue;
			}
			card.classList.add(FILTER_CLASS);
		}
		setFilter(channelTitles, 0, idx, folderName);
		return;
	}
	let itemCount = itemsFiltered;
	for (
		;
		videoCards[idx] && videoCards[idx].tagName !== VIDEOCARD_LOADER_TAG;
		idx++
	) {
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
	setFilter(channelTitles, itemCount, idx, folderName);
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
	// restore title to default
	title.textContent = title.getAttribute("data-default");
	title.removeAttribute("data-default");
	if (itemsPerRow === 0) {
		const titleContainer = title.closest("#title-container") as HTMLElement;
		const cloned = titleContainer.nextElementSibling as HTMLElement;
		if (cloned.id === "title-container") {
			cloned.remove();
		}
		titleContainer.removeAttribute("style");
		const channelAvatar = getElementFromTag("a", titleContainer);
		channelAvatar.removeAttribute("style");
		const content = titleContainer.parentElement
			.nextElementSibling as HTMLElement;
		content.removeAttribute("style");
	}
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

const handleSubscriptionTitle = (
	isGrid: boolean,
	firstEl: Element,
	titleEl: Element,
	folderName: string,
	channelTitles: string[],
) => {
	const prevTitle = titleEl.getAttribute("data-default") ?? titleEl.textContent;
	const haveSavedTitle = titleEl.hasAttribute("data-default");
	if (!haveSavedTitle) {
		titleEl.setAttribute("data-default", prevTitle);
	}
	firstEl.classList.add(FILTER_CLASS);
	if (isGrid) {
		titleEl.textContent = `${folderName}: ${prevTitle}`;
		return;
	}
	titleEl.textContent = `${folderName}: Latest`;
	if (haveSavedTitle) return;
	const titleContainer = titleEl.closest("#title-container") as HTMLElement;
	let cloned = titleContainer.nextElementSibling as HTMLElement;
	if (cloned.id !== "title-container") {
		cloned = titleContainer.cloneNode(true) as HTMLElement;
		titleContainer.after(cloned);
	}
	titleContainer.style.marginBottom = "3rem";
	const channelAvatar = getElementFromTag("a", titleContainer);
	if (channelTitles.includes(prevTitle)) {
		channelAvatar.style.transform = "translateY(5rem)";
	} else {
		titleContainer.style.marginBottom = "1rem";
		cloned.style.display = "none";
		channelAvatar.style.display = "none";
		const contentToHide = titleContainer.parentElement
			.nextElementSibling as HTMLElement;
		contentToHide.style.display = "none";
	}
};
