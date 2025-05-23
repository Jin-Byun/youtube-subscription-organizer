import { CHANNEL_TAG, FOLDER_CLASS, type FlaggedMessage } from "./constants";
import {
	channelOrderLabels,
	createNewFolderButton,
	prependExtensionItems,
} from "./components";
import {
	getSubscriptionOrder,
	addSubscriptionOrder,
	resetStorage,
	sleep,
	sortSubscriptions,
	storeUserId,
	setSubscriptionOrder,
	waitForElementLoad,
	removeChannelFromFolder,
} from "./utils";
import { filterContent, reorganizeFilter } from "./handlers";

const SubscriptionExpander =
	"ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";

const initializeNavBar = async (
	isLoaded: boolean,
	userInfo: HTMLElement,
): Promise<HTMLElement> => {
	return new Promise((res, rej) => {
		waitForElementLoad("#guide").then((navBar) => {
			if (!isLoaded || !navBar.getAttribute("opened") !== null) {
				navBar.style.display = "none"; // hide action being done
				navBar.setAttribute("opened", "");
			}
			waitForElementLoad(SubscriptionExpander, navBar)
				.then((expander) => {
					res(expander);
				})
				.catch((reason) => rej(reason))
				.finally(() => {
					// close the side bar and re-display it
					navBar.removeAttribute("opened");
					navBar.style.removeProperty("display");
					userInfo.style.removeProperty("display");
				});
		});
	});
};
const expandSubscription = async (expander: Element, list: Element) => {
	const trigger: HTMLElement = expander.querySelector("yt-interaction");
	if (trigger === null) return;
	trigger.click();
	const expandedItems = expander.querySelector("#expandable-items");
	list.append(...expandedItems.children);
	expander.remove();
	await setSubscriptionOrder(list);
	sortSubscriptions(list);
};

// the click registry to close userinfo takes too long, so restore userinfo display in navbar section
const initUserInfo = async (): Promise<HTMLElement> => {
	const userInfo: HTMLElement = document.querySelector("ytd-popup-container");
	userInfo.style.display = "none";
	const avatarButton = await waitForElementLoad("#avatar-btn");
	avatarButton.click();
	const handle = await waitForElementLoad("#channel-handle", userInfo);
	const { title } = handle;
	await storeUserId(title);
	avatarButton.click();
	return userInfo;
};

const main = () => {
	chrome.runtime.onMessage.addListener(
		async (
			{ type, flag, data }: FlaggedMessage,
			_sender: chrome.runtime.MessageSender,
			response: (response?: boolean) => void,
		): Promise<void> => {
			switch (type) {
				case "initialize":
					initUserInfo()
						.then((userInfo) => initializeNavBar(flag, userInfo))
						.then(async (expander: HTMLElement) => {
							// expand subscription section
							const subscriptionList = expander.closest("#items");
							subscriptionList.classList.add("yso-subscription-list");
							await expandSubscription(expander, subscriptionList);
							await prependExtensionItems(subscriptionList);
							const subscriptionTabLabel =
								subscriptionList.previousElementSibling as HTMLElement;
							const header =
								subscriptionTabLabel.firstElementChild as HTMLElement;
							header.style.cursor = "pointer";
							header.addEventListener("click", () => {
								document
									.querySelector(`a[href="/feed/subscriptions"]`)
									.parentElement.click();
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
					response(!!document.querySelector(".yso-subscription-list"));
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

async function handleUpdate(flag: boolean) {
	const subList = document.querySelector(".yso-subscription-list");
	if (flag) {
		const orderLabels = Array.from(
			subList.getElementsByTagName("yso-order"),
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
			removeChannelFromFolder(removedItem, parent.title);
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
	const title = await addSubscriptionOrder(newSub);
	// place new subscription below all folders
	const allFolders = subList.querySelectorAll(`.${FOLDER_CLASS}`);
	if (allFolders.length > 0) {
		allFolders[allFolders.length - 1].after(newSub);
	}
	subList.prepend(channelOrderLabels(title));
}

main();
