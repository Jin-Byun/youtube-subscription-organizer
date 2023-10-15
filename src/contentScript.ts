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
  chrome.runtime.onMessage.addListener(
    (
      obj: SubscriptionMessage,
      sender: chrome.runtime.MessageSender,
      response: (response?: any) => void
    ): void => {
      const { type, navBarLoaded } = obj;
      if (type !== "initialize") return;
      if (!navBarLoaded) {
        // open the side bar to load subscription section
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
          // close the side bar and re-display it
          const navBarTrigger: HTMLElement = document
            .getElementById("guide-button")
            .querySelector("yt-interaction");
          navBarTrigger.click();
          document.getElementById("guide").style.removeProperty("display");
        }
        // expand subscription section
        const nestedItems = section.querySelectorAll("#expandable-items")[1];
        const subList = nestedItems.closest("#items");
        if (nestedItems.parentElement.id === "expanded") {
          const trigger: HTMLElement =
            nestedItems.parentElement.parentElement.querySelector(
              "yt-interaction"
            );
          trigger.click();
          subList.append(...nestedItems.children);
          nestedItems.parentElement.parentElement.remove();
        }
        const subListLabel = subList.previousElementSibling as HTMLElement;
        subListLabel.style.display = "flex";
        subListLabel.style.alignItems = "center";
        const createNewFolderButton = document.createElement("button");
        createNewFolderButton.id = "create-new-folder-button";
        createNewFolderButton.innerText = "+";
        createNewFolderButton.addEventListener("click", () => {
          // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
          // may skip and just make it so that clicking the item adds to folder.
          // Consider adding contextmenu event to the sub items to add to new folder.
          // const subs = subList.children;
          // console.log(subs);
          const subFolder = document.createElement("div");
          subFolder.className = "yt-organizer-new-folder";
          subFolder.innerHTML =
            "<div contenteditable></div><button>Save</button>";
          subList.prepend(subFolder);
        });
        subListLabel.append(createNewFolderButton);
      });
    }
  );
})();
