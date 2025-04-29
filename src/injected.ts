(() => {
  const { fetch: FETCH } = window;
  window.fetch = async (...args) => {
    const SUB_URL = "https://www.youtube.com/youtubei/v1/subscription/";
    const UNSUB = "unsubscribe";

    const req = args.at(-1) as Request;
    if (!req.url?.startsWith(SUB_URL)) return await FETCH(...args);
    if (req.url.includes(UNSUB)) {
      // unravel existing folder
      const folders = document.querySelectorAll(".yt-organizer-folder");
      for (const f of folders) {
        f.after(...f.querySelectorAll("ytd-guide-entry-renderer"));
        f.remove();
      }

      // re-organize to original youtube ordering
      const orderData = localStorage.getItem("YSO-SUBSCRIPTION-ORDER");
      if (orderData) {
        const subList = document.querySelector(".yso-subscription-list");
        const query = (url: string) => `a[href="${url}"]`;
        const orderedSubs = JSON.parse(orderData).map(
          (url: string) => subList.querySelector(query(url)).parentElement
        );
        subList.append(...orderedSubs);
      }
    }
    return await FETCH(...args);
  };
})();
