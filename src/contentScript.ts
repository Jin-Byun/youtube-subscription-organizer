import { FOLDER_CLASS, type FlaggedMessage } from "./constants";
import { createNewFolderButton, initializeStoredFolders } from "./components";
import {
	prependNewSubscription,
	resetStorage,
	sleep,
	sortSubscriptions,
	storeUserId,
	updateSubscriptionOrder,
	waitForElementLoad,
} from "./utils";
import { filterContent } from "./handlers";

const SubscriptionExpander =
	"ytd-guide-collapsible-entry-renderer.ytd-guide-section-renderer";

const initializeNavBar = async (
	isLoaded: boolean,
	userInfo: HTMLElement,
): Promise<HTMLElement> => {
	return new Promise((res, rej) => {
		if (isLoaded) {
			waitForElementLoad(SubscriptionExpander)
				.then((expander) => {
					res(expander);
				})
				.catch((reason) => rej(reason))
				.finally(() => {
					userInfo.style.removeProperty("display");
				});
		} else {
			waitForElementLoad("#guide").then((navBar) => {
				const attr = document.createAttribute("opened");
				navBar.style.display = "none"; // hide action being done
				navBar.setAttributeNode(attr);
				waitForElementLoad(SubscriptionExpander)
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
		}
	});
};
const expandSubscription = async (expander: Element, list: Element) => {
	const trigger: HTMLElement = expander.querySelector("yt-interaction");
	if (trigger === null) return;
	trigger.click();
	const expandedItems = expander.querySelector("#expandable-items");
	list.append(...expandedItems.children);
	expander.remove();
	await updateSubscriptionOrder(list);
	sortSubscriptions(list);
};
const injectScript = () => {
	const s = document.createElement("script");
	(document.head || document.documentElement).appendChild(s);
	s.onload = function () {
		const t = this as HTMLScriptElement;
		t.remove();
	};
	s.src = chrome.runtime.getURL("src/injected/index.js");
};

// the click registry to close userinfo takes too long, so restore userinfo display in navbar section
const initUserInfo = async (): Promise<HTMLElement> => {
	const userInfo: HTMLElement = document.querySelector("ytd-popup-container");
	userInfo.style.display = "none";
	const avatarButton = await waitForElementLoad("#avatar-btn");
	avatarButton.click();
	const handle = await waitForElementLoad("#channel-handle");
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
					injectScript();
					initUserInfo()
						.then((userInfo) => initializeNavBar(flag, userInfo))
						.then(async (expander: HTMLElement) => {
							// expand subscription section
							const subscriptionList = expander.closest("#items");
							subscriptionList.classList.add("yso-subscription-list");
							await expandSubscription(expander, subscriptionList);
							await initializeStoredFolders(subscriptionList);
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
					const entry = Object.entries(data);
					const [title, start] = entry[0];
					await filterContent(title, false, start);
				}
			}
		},
	);
};

async function handleUpdate(flag: boolean) {
	const subList = document.querySelector(".yso-subscription-list");
	if (flag) {
		// update the original order array
		updateSubscriptionOrder(subList);
		// re-sort alphabetically
		sortSubscriptions(subList);
		// setup folders
		await initializeStoredFolders(subList);
		// update storedData in case of folder content change
		await resetStorage(subList.querySelectorAll(`.${FOLDER_CLASS}`));
		return;
	}
	// new subscription found on top of folders
	let newSub = subList.firstElementChild;
	while (newSub.tagName === "DIV") {
		await sleep(200);
		newSub = subList.firstElementChild;
	}
	// update order array
	await prependNewSubscription(newSub);
	// place new subscription below all folders
	const allFolders = subList.querySelectorAll(`.${FOLDER_CLASS}`);
	if (allFolders.length > 0) {
		allFolders[allFolders.length - 1].after(newSub);
	}
}

main();
