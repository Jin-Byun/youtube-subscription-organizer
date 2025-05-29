import {
	CHANNEL_TAG,
	EXPANDABLE_ID,
	EXPANSION_TRIGGER_TAG,
	FOLDER_CLASS,
	NAVBAR_ID,
	OPENED,
	ORDER_TAG,
	POPUP_CONTAINER_TAG,
	SUBSCRIPTION_EXPANDER,
	SUBSCRIPTION_LIST_CLASS,
	SUBSCRIPTION_LIST_ID,
	SUBSCRIPTION_TAB_LABEL,
	USER_INFO_BUTTON_ID,
	USER_INFO_HANDLE_ID,
	type YSOMessage,
} from "./constants";
import {
	channelOrderLabels,
	createNewFolderButton,
	prependExtensionItems,
} from "./components";
import { sleep, sortSubscriptions, waitForElementLoad } from "./utils";
import {
	updateSubscriptionOrder,
	getSubscriptionOrder,
	setSubscriptionOrder,
	setCurrId,
	deleteChannelFromFolder,
} from "./storage";
import { filterContent, reorganizeFilter } from "./handlers";
import {
	getAllChildFolders,
	getElementFromTag,
	getSubList,
	queryableId,
} from "./dom";

const initializeNavBar = async (
	isLoaded: boolean,
	userInfo: HTMLElement,
): Promise<HTMLElement> => {
	return new Promise((res, rej) => {
		waitForElementLoad(NAVBAR_ID).then((navBar) => {
			if (!isLoaded || !navBar.getAttribute(OPENED) !== null) {
				navBar.style.display = "none"; // hide action being done
				navBar.setAttribute(OPENED, "");
			}
			waitForElementLoad(
				SUBSCRIPTION_EXPANDER,
				(query: string) => navBar.querySelector(query),
				navBar,
			)
				.then((expander) => {
					res(expander);
				})
				.catch((reason) => rej(reason))
				.finally(() => {
					// close the side bar and re-display it
					navBar.removeAttribute(OPENED);
					navBar.style.removeProperty("display");
					userInfo.style.removeProperty("display");
				});
		});
	});
};
const expandSubscription = async (expander: Element, list: HTMLElement) => {
	const trigger: HTMLElement = getElementFromTag(
		EXPANSION_TRIGGER_TAG,
		expander,
	);
	if (trigger === null) return;
	trigger.click();
	const expandedItems = document.getElementById(EXPANDABLE_ID);
	list.append(...expandedItems.children);
	expander.remove();
	await setSubscriptionOrder(list);
	sortSubscriptions(list);
};

// the click registry to close userinfo takes too long, so restore userinfo display in navbar section
const initUserInfo = async (): Promise<HTMLElement> => {
	const userInfo: HTMLElement = getElementFromTag(POPUP_CONTAINER_TAG);
	userInfo.style.display = "none";
	const avatarButton = await waitForElementLoad(USER_INFO_BUTTON_ID);
	avatarButton.click();
	const handle = await waitForElementLoad(USER_INFO_HANDLE_ID);
	const { title } = handle;
	await setCurrId(title);
	avatarButton.click();
	return userInfo;
};

const main = () => {
	chrome.runtime.onMessage.addListener(
		async (
			{ type, flag, data }: YSOMessage,
			_sender: chrome.runtime.MessageSender,
			response: (response?: boolean) => void,
		): Promise<void> => {
			switch (type) {
				case "initialize":
					initUserInfo()
						.then((userInfo) => initializeNavBar(flag, userInfo))
						.then(async (expander: HTMLElement) => {
							// expand subscription section
							const subscriptionList = expander.closest<HTMLElement>(
								queryableId(SUBSCRIPTION_LIST_ID),
							);
							subscriptionList.classList.add(SUBSCRIPTION_LIST_CLASS);
							await expandSubscription(expander, subscriptionList);
							await prependExtensionItems(subscriptionList);
							const subscriptionTabLabel =
								subscriptionList.previousElementSibling as HTMLElement;
							const header =
								subscriptionTabLabel.firstElementChild as HTMLElement;
							header.style.cursor = "pointer";
							const subscriptionInteractionTab =
								document.querySelector<HTMLElement>(SUBSCRIPTION_TAB_LABEL);
							header.addEventListener("click", () => {
								subscriptionInteractionTab.click();
							});
							subscriptionTabLabel.style.display = "flex";
							subscriptionTabLabel.style.alignItems = "center";
							subscriptionTabLabel.append(
								createNewFolderButton(subscriptionList),
							);
						});
					break;
				case "update":
					await handleUpdate(flag);
					break;
				case "check":
					response(!!getSubList());
					break;
				case "filter": {
					await filterContent(data.titles, data.itemCount, data.nextStart);
					break;
				}
				case "rowChange":
					reorganizeFilter();
			}
		},
	);
};

async function handleUpdate(isUnsubscription: boolean) {
	const subList = getSubList();
	if (isUnsubscription) {
		const orderLabels = Array.from(
			subList.getElementsByTagName(ORDER_TAG),
			(v: HTMLElement) => v.title,
		);
		const prevSet = new Set(await getSubscriptionOrder());
		const removedItem = prevSet
			.difference(new Set(orderLabels))
			[Symbol.iterator]()
			.next().value;
		const targetAnchor = subList.querySelector(
			`${CHANNEL_TAG} > a[title="${removedItem}"]`,
		);
		const target = targetAnchor.parentElement;
		const parent = target.parentElement;
		if (parent.classList.contains(FOLDER_CLASS)) {
			deleteChannelFromFolder(removedItem, parent.title);
		}
		target.remove();
		await setSubscriptionOrder(orderLabels);
		return;
	}
	// new subscription found on top of folders
	let newSub = subList.firstElementChild;
	while (newSub.tagName !== CHANNEL_TAG.toUpperCase()) {
		await sleep(200);
		newSub = subList.firstElementChild;
	}
	// update order array
	const { title } = newSub.firstElementChild as HTMLAnchorElement;
	await updateSubscriptionOrder(title);
	// place new subscription below all folders
	const allFolders = getAllChildFolders(subList);
	if (allFolders.length > 0) {
		allFolders[allFolders.length - 1].after(newSub);
	}
	subList.prepend(channelOrderLabels(title));
}

main();
