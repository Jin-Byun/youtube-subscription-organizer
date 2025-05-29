import {
	EXPAND_CLASS,
	FOLDER_CLASS,
	FOLDER_IMG_URL,
	ADD_TO_FOLDER,
	NUM_CHANNEL,
	LABEL_PLACEHOLDER,
	LABEL_NOTITLE,
	DATA_PLACEHOLDER,
	LABEL_NOCHANNEL,
	LABEL_DUPLICATE,
	HIDE_CLASS,
	ORDER_TAG,
	TRUE,
	EDIT_MENU_CLASS,
	NEW_BUTTION_ID,
	CHANNEL_TAG,
} from "./constants";
import { getElementFromTag } from "./dom";
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
	updateUserFolder,
	getUserStoredFolders,
	getSubscriptionOrder,
} from "./storage";

class Component<T extends HTMLElement> {
	element: T;
	constructor(tag = "div") {
		this.element = document.createElement(tag) as T;
	}

	setId(id: string): Component<T> {
		this.element.id = id;
		return this;
	}

	addClass(...list: string[]): Component<T> {
		this.element.classList.add(...list);
		return this;
	}

	addAttributes(attrs: { [key: string]: string }): Component<T> {
		for (const [key, value] of Object.entries(attrs)) {
			this.element.setAttribute(key, value);
		}
		return this;
	}

	addInnerText(text: string): Component<T> {
		this.element.innerText = text;
		return this;
	}

	addInnerHTML(html: string): Component<T> {
		this.element.innerHTML = html;
		return this;
	}

	addEventListener(
		type: string,
		handler: (this: T, e: Event) => void,
	): Component<T> {
		this.element.addEventListener(type, handler);
		return this;
	}

	append(...children: Array<HTMLElement>): Component<T> {
		for (const child of children) {
			this.element.appendChild(child);
		}
		return this;
	}
}

const subscriptionFolder = (title: string): HTMLDivElement => {
	const label = `<div class="${EXPAND_CLASS}">${title}</div>`;
	const caret = `<p class="${EXPAND_CLASS}"></p>`;
	const img = `<img src="${FOLDER_IMG_URL}" class="${EXPAND_CLASS}">`;

	return new Component<HTMLDivElement>()
		.addClass(FOLDER_CLASS, HIDE_CLASS)
		.addAttributes({
			title,
		})
		.addInnerHTML(`${img}${label}${caret}`)
		.addEventListener("click", toggleCollapsible)
		.addEventListener("contextmenu", toggleOption)
		.append(...FolderTabs()).element;
};

const displayPlaceholderMessage = (
	target: Element,
	message: string,
	fallback = "",
) => {
	target.setAttribute(DATA_PLACEHOLDER, message);
	setTimeout(() => {
		target.setAttribute(DATA_PLACEHOLDER, fallback);
	}, 1500);
};

const SaveButton = (subList: Element): HTMLButtonElement =>
	new Component<HTMLButtonElement>("button")
		.addInnerText("Save")
		.addEventListener(
			"click",
			async function (this: HTMLButtonElement, _e: MouseEvent) {
				const labelDiv = this.previousElementSibling;
				const title = labelDiv.textContent;
				if (title === "") {
					return displayPlaceholderMessage(
						labelDiv,
						LABEL_NOTITLE,
						LABEL_PLACEHOLDER,
					);
				}
				const folders = await getUserStoredFolders();
				if (folders && Object.keys(folders).includes(title)) {
					return displayPlaceholderMessage(labelDiv, LABEL_DUPLICATE);
				}
				const selectedSubs = subList.querySelectorAll(
					`[${ADD_TO_FOLDER}="${TRUE}"]`,
				);
				if (selectedSubs.length === 0) {
					return displayPlaceholderMessage(labelDiv, LABEL_NOCHANNEL);
				}

				const subFolder = subscriptionFolder(title);

				deactivateToggleChannel(subList.children);
				subFolder.style.setProperty(NUM_CHANNEL, `${selectedSubs.length}`);
				subFolder.append(...selectedSubs);

				const firstChannel = getElementFromTag(CHANNEL_TAG, subList);
				if (firstChannel.closest(`.${FOLDER_CLASS}`)) {
					firstChannel.closest(`.${FOLDER_CLASS}`).before(subFolder);
				} else {
					firstChannel.before(subFolder);
				}
				await updateUserFolder(selectedSubs, title);
				this.parentElement.remove();
			},
		).element;

const tabTypeList: string[] = ["Delete", "Edit", "Cancel", "Save"] as const;
const tabSymbolList: string[] = ["❌", "✂", "↻", "💾"] as const;
const tabListenerList: EventListener[] = [
	handleDelete,
	handleEdit,
	handleCancel,
	handleSave,
] as const;
const FolderTabs = (): HTMLDivElement[] =>
	tabTypeList.map(
		(tab, i) =>
			new Component<HTMLDivElement>()
				.addClass(`${tab.toLowerCase()}-YSO-folder`, EDIT_MENU_CLASS)
				.addInnerText(`${tabSymbolList[i]} ${tab}`)
				.addEventListener("click", tabListenerList[i]).element,
	);

function removePlaceholder(this: HTMLDivElement) {
	this.removeAttribute(DATA_PLACEHOLDER);
}

export const createNewFolderButton = (list: Element): HTMLButtonElement =>
	new Component<HTMLButtonElement>("button")
		.setId(NEW_BUTTION_ID)
		.addInnerText("+")
		.addEventListener("click", () => {
			activateToggleChannel(list.children);
			list.prepend(
				new Component<HTMLDivElement>().addClass(FOLDER_CLASS, "new").append(
					new Component<HTMLDivElement>()
						.addAttributes({
							[DATA_PLACEHOLDER]: LABEL_PLACEHOLDER,
							contenteditable: "",
						})
						.addEventListener("focus", removePlaceholder).element,
					SaveButton(list),
				).element,
			);
		}).element;

export const channelOrderLabels = (title: string): HTMLElement =>
	new Component<HTMLElement>(ORDER_TAG).addAttributes({ title }).element;

export async function prependExtensionItems(list: Element) {
	const folders = await getUserStoredFolders();
	if (folders) {
		const nodes: Array<Element> = Array.from(list.children);
		for (const [title, channels] of Object.entries(folders)) {
			const folder = subscriptionFolder(title);
			folder.style.setProperty(NUM_CHANNEL, `${channels.length}`);
			folder.append(
				...nodes.filter((node: Element) => {
					const a = node.firstElementChild as HTMLAnchorElement;
					return channels.includes(a.title);
				}),
			);
			list.prepend(folder);
		}
	}
	const channelOrder = await getSubscriptionOrder();
	const divLabels: HTMLElement[] = channelOrder.map(channelOrderLabels);
	list.prepend(...divLabels);
}
