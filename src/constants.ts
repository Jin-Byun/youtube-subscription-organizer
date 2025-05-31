export type FilterData = {
	titles: string[];
	itemCount: number;
	nextStart: number;
};

export const MessageTypeList: string[] = [
	"check",
	"initialize",
	"update",
	"filter",
	"rowChange",
	"reset",
] as const;

export type MessageType = (typeof MessageTypeList)[number];

export type YSOMessage = {
	type: MessageType;
	flag: boolean;
	data: FilterData | null;
};

export type SingleDOMGetter =
	| typeof document.getElementById
	| typeof document.querySelector;

export const TRUE = "true";
export const FALSE = "false";

/** KEYS */
export const STORAGE_KEY = "YSO-KEY";
export const SUB_ORDER_KEY = "YSO-SUBSCRIPTION-ORDER";
export const CURR_USER_ID = "currUserId";
export const OBSERVER_KEY = "mutationObservers";
export const FILTER_KEY = "filter";

/** TAGS */
export const CHANNEL_TAG = "ytd-guide-entry-renderer";
export const VIDEOCARD_LOADER_TAG = "YTD-CONTINUATION-ITEM-RENDERER";
export const EXPANSION_TRIGGER_TAG = "yt-interaction";
export const POPUP_CONTAINER_TAG = "ytd-popup-container";
export const ORDER_TAG = "yso-order";

/** Classes */
export const EXPAND_CLASS = "click-2-expand";
export const FOLDER_CLASS = "yt-organizer-folder";
export const SUBSCRIPTION_LIST_CLASS = "yso-subscription-list";
export const EDIT_MENU_CLASS = "YSO-edit-menu";
export const EDIT_CLASS = "edit";
export const HIDE_CLASS = "hide";
export const FILTER_CLASS = "yso-filter";

/** IDs */
export const VIDEOCARD_ANCHOR_ID = "avatar-link";
export const USER_INFO_BUTTON_ID = "avatar-btn";
export const USER_INFO_HANDLE_ID = "channel-handle";
export const NAVBAR_ID = "guide";
export const TITLE_ID = "title";
export const EXPANDABLE_ID = "expandable-items";
export const SUBSCRIPTION_LIST_ID = "items";
export const NEW_BUTTION_ID = "create-new-folder-button";

/** Attributes */
export const ADD_TO_FOLDER = "add-to-folder";
export const NUM_CHANNEL = "--number-of-ch";
export const DATA_PLACEHOLDER = "data-placeholder";
export const ITEMS_PER_ROW = "items-per-row";
export const CONTENTEDITABLE = "contenteditable";
export const DATA_TITLE = "data-title";
export const FIRST_COLUMN = "is-in-first-column";
export const ACTIVATE = "activate";
export const ACTIVE = "active";
export const OPENED = "opened";

/** CSS Queries */
export const SUBSCRIPTION_CONTENT_CONTAINER =
	'ytd-two-column-browse-results-renderer[page-subtype="subscriptions"] #contents';
export const SUBSCRIPTION_EXPANDER =
	"ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";
export const SUBSCRIPTION_TAB_LABEL =
	'ytd-mini-guide-entry-renderer[aria-label="Subscriptions"]';

/** URLs */
export const FOLDER_IMG_URL = chrome.runtime.getURL("Icon_folder_2019_1.svg");
export const YOUTUBE_SUBSCRIPTION_PATH = "/feed/subscriptions";

/** MESSAGES */
export const LABEL_PLACEHOLDER = "Right click adds channel";
export const LABEL_NOTITLE = "Please set title";
export const LABEL_NOCHANNEL = "No channel Selected";
export const LABEL_DUPLICATE = "Name in use";
export const SUBSCRIPTION_HEADING = "Latest";
export const SAVE_ERR_NO_NAME = "no name";
export const SAVE_ERR_DUPLICATE = "duplicate";
