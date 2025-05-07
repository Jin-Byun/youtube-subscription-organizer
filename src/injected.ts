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
          injectedWaitForElementLoad("#create-new-folder-button")
          .then(() => {
          // close the side bar and re-display it
            navBar.removeAttribute("opened");
            navBar.style.removeProperty("display");
            res();
          });
        });
      });

interface UnsubscribeRequest extends Request {};

const isUnsubsriptionRequest = (
  input: RequestInfo | URL
): input is UnsubscribeRequest => 
  input instanceof Request &&
  input.url.startsWith("https://www.youtube.com/youtubei/v1/subscription/") &&
  input.url.includes("unsubscribe");

const EXT_ID = "emmhlbjleflockmeeeikenjjhajkdcgh";
const USERKEY = "sessionUser";

(() => {
  const { fetch: FETCH } = window;
  window.fetch = async (...args) => {
    if (!isUnsubsriptionRequest(args[0])) return await FETCH(...args);
    return new Promise<Response>((res) => {
      chrome.runtime.sendMessage(EXT_ID, {key: USERKEY}, (msg: {[USERKEY]: string}) => {
        const { sessionUser } = msg;
        // Check if the navpane has been processed and if not, toggle.
        checkNavPane(!!document.getElementById("create-new-folder-button"))
        .then(() => {
          // unravel existing folder
          const folders = document.querySelectorAll(".yt-organizer-folder");
          for (const f of folders) {
            f.after(...f.querySelectorAll("ytd-guide-entry-renderer"));
            f.remove();
          }
          // re-organize to original youtube ordering
          const orderJSON = localStorage.getItem("YSO-SUBSCRIPTION-ORDER");
          if (!orderJSON) return res(FETCH(...args));
          
          const orderData = JSON.parse(orderJSON)?.[sessionUser];
          if (!orderData?.length) return res(FETCH(...args));

          const subList = document.querySelector(".yso-subscription-list");
          const orderedSubs: Array<HTMLElement> = orderData
                                                    .map((url: string): HTMLElement =>
                                                      subList
                                                        .querySelector(`a[href="${url}"]`)
                                                        .parentElement);
          subList.append(...orderedSubs);
          res(FETCH(...args));
        });
      })
    });
  };
})();
