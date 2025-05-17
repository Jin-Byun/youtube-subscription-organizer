function injectedWaitForElementLoad(selector: string): Promise<HTMLElement> {
	return new Promise((resolve) => {
		if (document.querySelector(selector)) {
			return resolve(document.querySelector(selector) as HTMLElement);
		}

		const observer = new MutationObserver((_mutations) => {
			if (document.querySelector(selector)) {
				observer.disconnect();
				resolve(document.querySelector(selector) as HTMLElement);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}

const checkNavPane = (isLoaded: boolean): Promise<void> =>
	isLoaded
		? new Promise((res) => res())
		: new Promise((res) => {
				injectedWaitForElementLoad("#guide").then((navBar) => {
					const attr = document.createAttribute("opened");
					navBar.style.display = "none"; // hide action being done
					navBar.setAttributeNode(attr);
					injectedWaitForElementLoad("#create-new-folder-button").then(() => {
						// close the side bar and re-display it
						navBar.removeAttribute("opened");
						navBar.style.removeProperty("display");
						res();
					});
				});
			});

interface UnsubscribeRequest extends Request {}
interface BrowseRequest extends Request {}

const isUnsubsriptionRequest = (
	input: RequestInfo | URL,
): input is UnsubscribeRequest =>
	input instanceof Request &&
	input.url.startsWith("https://www.youtube.com/youtubei/v1/subscription/") &&
	input.url.includes("unsubscribe");

const isSubscriptionBrowseRequest = (
	input: RequestInfo | URL,
): input is UnsubscribeRequest =>
	input instanceof Request &&
	document.location.pathname === "/feed/subscriptions" &&
	input.url.startsWith("https://www.youtube.com/youtubei/v1/browse");

const EXT_ID = "emmhlbjleflockmeeeikenjjhajkdcgh";

(() => {
	const { fetch: FETCH } = window;
	window.fetch = async (...args) => {
		if (isSubscriptionBrowseRequest(args[0])) {
			const { continuation } = await args[0].clone().json();
			if (!continuation) return FETCH(...args);
			chrome.runtime.sendMessage(EXT_ID, { msg: "browse" });
			return FETCH(...args);
		}
		if (!isUnsubsriptionRequest(args[0])) return FETCH(...args);
		return new Promise<Response>((res) => {
			// Check if the navpane has been processed and if not, toggle.
			checkNavPane(!!document.getElementById("create-new-folder-button")).then(
				() => {
					// unravel existing folder
					const folders = document.querySelectorAll(".yt-organizer-folder");
					for (const f of folders) {
						f.after(...f.querySelectorAll("ytd-guide-entry-renderer"));
						f.remove();
					}
					chrome.runtime.sendMessage(
						EXT_ID,
						{ msg: "order" },
						(order: string[] | null) => {
							// re-organize to original youtube ordering
							if (!order?.length) return res(FETCH(...args));

							const subList = document.querySelector(".yso-subscription-list");
							const orderedSubs: Array<HTMLElement> = order.map(
								(title: string): HTMLElement =>
									subList.querySelector(`a[title="${title}"]`).parentElement,
							);
							subList.append(...orderedSubs);
							res(FETCH(...args));
						},
					);
				},
			);
		});
	};
})();
