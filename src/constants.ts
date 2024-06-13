export type FolderData = {
  [key: string]: string[];
};
export type SubscriptionMessage = {
  type: string;
  navBarLoaded: boolean;
};

export const STORAGE_KEY = "YSO-KEY";
export const SUB_ORDER_KEY = "YSO-SUBSCRIPTION-ORDER";
export const CHANNEL_TAG = "ytd-guide-entry-renderer";
export const EXPAND_CLASS = "click-2-expand";
export const FOLDER_CLASS = "yt-organizer-folder";
export const FOLDER_ICON = "Icon_folder_2019_1.svg";
export const ATTR_NAME = "newFolderAdd";
export const NUM_CHANNEL = "--number-of-ch";
export const PLACEHOLDER_ATTR = "data-placeholder";
export const LABEL_PLACEHOLDER = "Right click adds channel";
export const LABEL_NOTITLE = "Please set title";
export const LABEL_NOCHANNEL = "No channel Selected";
export const LABEL_DUPLICATE = "Name in use";
