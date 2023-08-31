import { SubscriptionMessage } from "./background";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("src/content");

() => {
  let youtubeLeftControls, youtubePlayer;

  chrome.runtime.onMessage.addListener(
    (
      obj: SubscriptionMessage,
      sender: chrome.runtime.MessageSender,
      response: (response?: any) => void
    ): void => {
      const { type, loaded } = obj;
      if (loaded) {
        // landedOnSubscriptionPage();
      }
    }
  );
};
