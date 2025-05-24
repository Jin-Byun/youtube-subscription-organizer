import {
	EXPAND_CLASS,
	FOLDER_CLASS,
	FOLDER_IMG_URL,
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
} from "./storage";

class Component<T extends HTMLElement> {
	element: T;
	constructor(tag: string) {
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

	return new Component<HTMLDivElement>("div")
		.addClass(FOLDER_CLASS, "hide")
		.addAttributes({
			title,
		})
		.addInnerHTML(`${img}${label}${caret}`)
		.addEventListener("click", toggleCollapsible)
		.addEventListener("contextmenu", toggleOption)
		.append(deleteTab(), editTab(), cancelTab(), saveTab()).element;
};

const displayPlaceholderMessage = (
	target: Element,
	message: string,
	fallback = "",
) => {
	target.setAttribute(PLACEHOLDER_ATTR, message);
	setTimeout(() => {
		target.setAttribute(PLACEHOLDER_ATTR, fallback);
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
				const selectedSubs = subList.querySelectorAll(`[${ATTR_NAME}="true"]`);
				if (selectedSubs.length === 0) {
					return displayPlaceholderMessage(labelDiv, LABEL_NOCHANNEL);
				}

				const subFolder = subscriptionFolder(title);

				deactivateToggleChannel(subList.children);
				subFolder.style.setProperty(NUM_CHANNEL, `${selectedSubs.length}`);
				subFolder.append(...selectedSubs);

				subList.prepend(subFolder);
				await storeFolderLocal(selectedSubs, title);
				this.parentElement.remove();
			},
		).element;

const deleteTab = (): HTMLDivElement =>
	new Component<HTMLDivElement>("div")
		.addClass("delete-YSO-folder", "YSO-edit-menu")
		.addEventListener("click", handleDelete)
		.addInnerText("❌ Delete").element;
const editTab = (): HTMLDivElement =>
	new Component<HTMLDivElement>("div")
		.addClass("edit-YSO-folder", "YSO-edit-menu")
		.addEventListener("click", handleEdit)
		.addInnerText("✂ Edit").element;
const saveTab = (): HTMLDivElement =>
	new Component<HTMLDivElement>("div")
		.addClass("save-YSO-folder", "YSO-edit-menu")
		.addEventListener("click", handleSave)
		.addInnerText("💾 Save").element;
const cancelTab = (): HTMLDivElement =>
	new Component<HTMLDivElement>("div")
		.addClass("cancel-YSO-folder", "YSO-edit-menu")
		.addEventListener("click", handleCancel)
		.addInnerText("↻ Cancel").element;

function removePlaceholder(this: HTMLDivElement) {
	this.removeAttribute(PLACEHOLDER_ATTR);
	this.removeEventListener("focus", removePlaceholder);
}

export const createNewFolderButton = (list: Element): HTMLButtonElement =>
	new Component<HTMLButtonElement>("button")
		.setId("create-new-folder-button")
		.addInnerText("+")
		.addEventListener("click", () => {
			activateToggleChannel(list.children);
			list.prepend(
				new Component<HTMLDivElement>("div")
					.addClass(FOLDER_CLASS, "new")
					.append(
						new Component<HTMLDivElement>("div")
							.addAttributes({
								[PLACEHOLDER_ATTR]: LABEL_PLACEHOLDER,
								contenteditable: "",
							})
							.addEventListener("focus", removePlaceholder).element,
						SaveButton(list),
					).element,
			);
		}).element;

export const channelOrderLabels = (title: string): HTMLElement =>
	new Component<HTMLElement>("yso-order").addAttributes({ title }).element;

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
	} else {
		await resetStorage();
	}
	const channelOrder = await getSubscriptionOrder();
	const divLabels: HTMLElement[] = channelOrder.map(channelOrderLabels);
	list.prepend(...divLabels);
}
