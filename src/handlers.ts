import {
	ADD_TO_FOLDER,
	NUM_CHANNEL,
	CONTENTEDITABLE,
	DATA_TITLE,
	SAVE_ERR_DUPLICATE,
	SAVE_ERR_NO_NAME,
} from "./constants";
import { sortSubscriptions } from "./utils";
import {
	updateUserFolder,
	getUserStoredFolders,
	deleteFolder,
} from "./storage";
import { getAllChildFolders, getChildChannels } from "./dom";
import {
	toggleCollapsible,
	toggleEditClass,
	toggleChannelContextMenu,
} from "./toggler";

export function handleDelete(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	folder.removeEventListener("click", toggleCollapsible); // prevent calling the listener
	const { parentElement: subscriptionTab, title } = folder;
	deleteFolder(title).then(() => {
		const channelFeed = subscriptionTab.lastElementChild;
		channelFeed.before(...getChildChannels(folder));
		folder.remove();
		sortSubscriptions(subscriptionTab);
	});
}

const toggleLabelDiv = (el: Element, isSet = false) => {
	if (isSet) {
		el.setAttribute(DATA_TITLE, el.textContent);
		el.setAttribute(CONTENTEDITABLE, "");
	} else {
		el.removeAttribute(DATA_TITLE);
		el.removeAttribute(CONTENTEDITABLE);
	}
};

export function handleEdit(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	toggleEditClass(folder);
	toggleLabelDiv(folder.children[1], true);
	toggleChannelContextMenu(folder.parentElement);
	toggleChannelContextMenu(folder, true);
}

export async function handleSave(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	const labelDiv = folder.children[1];
	if (!(await isSaveValid(labelDiv))) return;

	toggleEditClass(folder);

	const channels = getChildChannels(folder);
	const subscriptionTab = folder.parentElement;
	subscriptionTab.lastElementChild.before(...channels);
	const selectedSubs = subscriptionTab.querySelectorAll(
		`[${ADD_TO_FOLDER}="true"]`,
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
	toggleLabelDiv(labelDiv);
	toggleChannelContextMenu(subscriptionTab);
}

async function isSaveValid(labelDiv: Element): Promise<boolean> {
	const showTempMessage = (
		el: Element,
		original: string,
		msg: string,
	): boolean => {
		el.textContent = msg;
		setTimeout(() => {
			el.textContent = original;
		}, 1500);
		return false;
	};
	const currTitle = labelDiv.textContent;
	const prevTitle = labelDiv.getAttribute(DATA_TITLE);
	if (currTitle === "")
		return showTempMessage(labelDiv, currTitle, SAVE_ERR_NO_NAME);
	if (
		Object.keys(await getUserStoredFolders()).includes(currTitle) &&
		currTitle !== prevTitle
	)
		return showTempMessage(labelDiv, currTitle, SAVE_ERR_DUPLICATE);
	return true;
}

export function handleCancel(this: HTMLDivElement, e: MouseEvent) {
	e.preventDefault();
	const folder = this.parentElement;
	toggleEditClass(folder);

	const labelDiv = folder.children[1] as HTMLDivElement;
	labelDiv.textContent = labelDiv.getAttribute(DATA_TITLE);
	toggleLabelDiv(labelDiv);

	const subscriptionTab = folder.parentElement;
	toggleChannelContextMenu(subscriptionTab);
}
