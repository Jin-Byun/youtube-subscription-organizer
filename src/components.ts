import {
	EXPAND_CLASS,
	FOLDER_CLASS,
	FOLDER_ICON,
	ATTR_NAME,
	NUM_CHANNEL,
	LABEL_PLACEHOLDER,
	LABEL_NOTITLE,
	PLACEHOLDER_ATTR,
	LABEL_NOCHANNEL,
	LABEL_DUPLICATE,
} from "./constants";
import {
	handleDelete,
	handleEdit,
	handleSave,
	handleCancel,
	deactivateToggleChannel,
	activateToggleChannel,
	toggleCollapsible,
	toggleOption,
} from "./handlers";
import {
	storeFolderLocal,
	resetStorage,
	getUserStoredFolders,
	getSubscriptionOrder,
} from "./utils";

const subscriptionFolder = (title: string): HTMLDivElement => {
	const label = `<div class="${EXPAND_CLASS}">${title}</div>`;
	const caret = `<p class="${EXPAND_CLASS}"></p>`;

	const subFolder = document.createElement("div");
	subFolder.addEventListener("click", toggleCollapsible);
	subFolder.addEventListener("contextmenu", toggleOption);
	subFolder.className = `${FOLDER_CLASS} hide`;
	subFolder.setAttribute("title", title);
	subFolder.innerHTML = `${label}${caret}`;

	const folderImg = document.createElement("img");
	folderImg.src = chrome.runtime.getURL(FOLDER_ICON);
	folderImg.className = EXPAND_CLASS;
	subFolder.prepend(folderImg);
	subFolder.append(deleteTab(), editTab(), cancelTab(), saveTab());

	return subFolder;
};
const SaveButton = (subList: Element): HTMLButtonElement => {
	const button = document.createElement("button");
	button.innerText = "Save";
	button.addEventListener("click", async (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const labelDiv = target.previousElementSibling as HTMLElement;
		const title = labelDiv.textContent;
		if (title === "") {
			labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_NOTITLE);
			setTimeout(() => {
				labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_PLACEHOLDER);
			}, 1500);
			return;
		}
		const folders = await getUserStoredFolders();
		if (folders && Object.keys(folders).includes(title)) {
			labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_DUPLICATE);
			setTimeout(() => {
				labelDiv.setAttribute(PLACEHOLDER_ATTR, "");
			}, 1500);
			return;
		}
		const selectedSubs = subList.querySelectorAll(`[${ATTR_NAME}="true"]`);
		if (selectedSubs.length === 0) {
			labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_NOCHANNEL);
			setTimeout(() => {
				labelDiv.setAttribute(PLACEHOLDER_ATTR, "");
			}, 1500);
			return;
		}

		const subFolder = subscriptionFolder(title);

		deactivateToggleChannel(subList.children);
		subFolder.style.setProperty(NUM_CHANNEL, `${selectedSubs.length}`);
		subFolder.append(...selectedSubs);

		subList.prepend(subFolder);
		await storeFolderLocal(selectedSubs, title);
		target.parentElement.remove();
	});
	return button;
};
const deleteTab = (): HTMLDivElement => {
	const deleteTab = document.createElement("div");
	deleteTab.addEventListener("click", handleDelete);
	deleteTab.innerText = "❌ Delete";
	deleteTab.className = "YSO-edit-menu delete-YSO-folder";
	return deleteTab;
};
const editTab = (): HTMLDivElement => {
	const editTab = document.createElement("div");
	editTab.addEventListener("click", handleEdit);
	editTab.innerText = "✂ Edit";
	editTab.className = "YSO-edit-menu edit-YSO-folder";
	return editTab;
};
const saveTab = (): HTMLDivElement => {
	const saveTab = document.createElement("div");
	saveTab.addEventListener("click", handleSave);
	saveTab.innerText = "💾 Save";
	saveTab.className = "YSO-edit-menu save-YSO-folder";
	return saveTab;
};
const cancelTab = (): HTMLDivElement => {
	const cancelTab = document.createElement("div");
	cancelTab.addEventListener("click", handleCancel);
	cancelTab.innerText = "↻ Cancel";
	cancelTab.className = "YSO-edit-menu cancel-YSO-folder";
	return cancelTab;
};

export function createNewFolderButton(list: Element): HTMLButtonElement {
	const button = document.createElement("button");
	button.id = "create-new-folder-button";
	button.innerText = "+";
	button.addEventListener("click", () => {
		activateToggleChannel(list.children);
		const subFolder = document.createElement("div");
		subFolder.className = `${FOLDER_CLASS} new`;
		const labelDiv = document.createElement("div");
		labelDiv.contentEditable = "true";
		labelDiv.setAttribute(PLACEHOLDER_ATTR, LABEL_PLACEHOLDER);
		function removePlaceholder() {
			this.removeAttribute(PLACEHOLDER_ATTR);
			this.removeEventListener(removePlaceholder);
		}
		labelDiv.addEventListener("focus", removePlaceholder);
		subFolder.append(labelDiv);
		subFolder.append(SaveButton(list));
		list.prepend(subFolder);
	});
	return button;
}

export const channelOrderLabels = (label: string): HTMLElement => {
	const div = document.createElement("yso-order");
	div.style.display = "none";
	div.title = label;
	return div;
};

export async function prependExtensionItems(list: Element) {
	const folders = await getUserStoredFolders();
	if (folders) {
		for (const [title, channels] of Object.entries(folders)) {
			const folder = subscriptionFolder(title);
			folder.style.setProperty(NUM_CHANNEL, `${channels.length}`);
			const nodeList: Element[] = [];
			for (const node of list.children) {
				const a = node.firstElementChild as HTMLAnchorElement;
				if (channels.includes(a.title)) {
					nodeList.push(node);
				}
			}
			folder.append(...nodeList);
			list.prepend(folder);
		}
	} else {
		await resetStorage();
	}
	const channelOrder = await getSubscriptionOrder();
	const divLabels = channelOrder.map((title: string) =>
		channelOrderLabels(title),
	);
	list.prepend(...divLabels);
}
