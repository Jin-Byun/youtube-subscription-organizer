import { SubscriptionMessage } from "./background";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

function waitForElementLoad(selector: string): Promise<HTMLElement> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as HTMLElement);
    }

    const observer = new MutationObserver((mutations) => {
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

(() => {
  let youtubeLeftControls, youtubePlayer;

  chrome.runtime.onMessage.addListener(
    (
      obj: SubscriptionMessage,
      sender: chrome.runtime.MessageSender,
      response: (response?: any) => void
    ): void => {
      const { type, navBarLoaded } = obj;
      if (type === "initialize") {
        // get window size from the background and if it is small, make sure to trigger nav bar with display none to load the sections and things inside it.
        if (!navBarLoaded) {
          waitForElementLoad("#guide").then((navBar) => {
            navBar.style.display = "none"; // hide action being done
            const navBarTrigger: HTMLElement = document
              .getElementById("guide-button")
              .querySelector("yt-interaction");
            navBarTrigger.click();
          });
        }
        waitForElementLoad("#sections").then((section) => {
          if (!navBarLoaded) {
            const navBarTrigger: HTMLElement = document
              .getElementById("guide-button")
              .querySelector("yt-interaction");
            navBarTrigger.click();
            document.getElementById("guide").style.removeProperty("display");
          }
          const nestedItems = section.querySelectorAll("#expandable-items")[1];
          if (nestedItems.parentElement.id === "expanded") {
            const trigger: HTMLElement =
              nestedItems.parentElement.parentElement.querySelector(
                "yt-interaction"
              );
            trigger.click();
            nestedItems.closest("#items").append(...nestedItems.children);
            nestedItems.parentElement.parentElement.remove();
          }
        });
      }
    }
  );
})();
