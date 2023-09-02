import { SubscriptionMessage } from "./background";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

(() => {
  let youtubeLeftControls, youtubePlayer;

  chrome.runtime.onMessage.addListener(
    (
      obj: SubscriptionMessage,
      sender: chrome.runtime.MessageSender,
      response: (response?: any) => void
    ): void => {
      const { type, loaded } = obj;
      if (loaded) {
        // get window size from the background and if it is small, make sure to trigger nav bar with display none to load the sections and things inside it.
        setTimeout(() => {}, 5000);
        const leftNavBar = document.getElementById("sections");
        console.log("1", leftNavBar);
        console.log(document.getElementById("sections"));
        setTimeout(() => {}, 100);
        const subscriptionContainer = leftNavBar.querySelectorAll("#items")[1];
        console.log("2", subscriptionContainer);
        setTimeout(() => {}, 100);
        const nestedItems =
          subscriptionContainer.querySelector("#expandable-items");
        console.log("3", nestedItems);
        setTimeout(() => {}, 100);
        if (nestedItems.parentElement.id === "expanded") {
          const trigger: HTMLElement =
            nestedItems.parentElement.parentElement.querySelector(
              "yt-interaction"
            );
          trigger.click();
          setTimeout(() => {}, 100);
          console.log("nestedItems");
          console.log(nestedItems);
          subscriptionContainer.append(...nestedItems.children);
          nestedItems.parentElement.parentElement.remove();
        }
        // landedOnSubscriptionPage();
      }
    }
  );
})();
