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

(() => {
  const { fetch: FETCH } = window;
  window.fetch = async (...args) => {
    if (!isUnsubsriptionRequest(args[0])) return await FETCH(...args);
    chrome.runtime.sendMessage(EXT_ID, {key: "sessionUser"}, (res) => {
      console.log(res);
    })
    const sessionId = await chrome.storage.session.get("sessionUser");
    console.log(sessionId);
    return new Promise<Response>((res) => {
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
        if (orderJSON) {
          const subList = document.querySelector(".yso-subscription-list");
          const query = (url: string) => `a[href="${url}"]`;
          const orderData = JSON.parse(orderJSON);
          console.log(1, orderData);
          const orderedSubs = orderData.map(
            (url: string) => {
              console.log(2, url);
              const q = query(url);
              const target = subList.querySelector(q);
              console.log(3, q, target);
              console.log(4, target.parentElement);
              return target.parentElement;
            }
          );
          console.log(4, orderedSubs)
          subList.append(...orderedSubs);
          console.log(subList);
        }
        res(FETCH(...args));
      });
    });
  };
})();
