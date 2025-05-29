import {
	CHANNEL_TAG,
	EDIT_MENU_CLASS,
	FOLDER_CLASS,
	SUBSCRIPTION_LIST_CLASS,
} from "./constants";

let subListCache: Element | null = null;

/** Getters */
export function getSubList(): Element {
	if (!subListCache) {
		subListCache = document.getElementsByClassName(
			SUBSCRIPTION_LIST_CLASS,
		)?.[0];
	}
	return subListCache;
}

export const getAllChildFolders = (parent: Element): HTMLCollection =>
	parent.getElementsByClassName(FOLDER_CLASS);

export const getChildChannels = (parent: Element): HTMLCollection =>
	parent.getElementsByTagName(CHANNEL_TAG);

export const getAllYSOTabs = (parent: Element): HTMLCollection =>
	parent.getElementsByClassName(EDIT_MENU_CLASS);

export const getElementFromId = <T extends HTMLElement>(
	id: string,
	parent: Element,
): T => parent.querySelector<T>(queryableId(id));

export const getElementFromTag = (
	tag: string,
	parent: Element = document.body,
): HTMLElement => parent.getElementsByTagName(tag)[0] as HTMLElement;

export const queryableId = (id: string): string => `#${id}`;
