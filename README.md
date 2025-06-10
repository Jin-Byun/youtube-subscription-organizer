# Youtube Subscription Organizer

## What is this?

This is a chrome extension that modifies the **subscriptions** tab of Youtube's
left navigation pane. Add collapsible div to categorize your subs.

## Why?

I have few hobbies/interests. They include programming(Go, Rust, JS/TS, Elixir, HTML/CSS, Algorithms), guitar music and gears, games, streamers and podcasts. It takes about 3 flicks of the scroll wheel to get from the top of the navigation pane to the bottom. So, I wanted to make it so that I can group the subscriptions and encase them inside a collapsible so that I can only view what I want to view.

## To do

- [x] Expand **Subscriptions** tab on navigation
- [x] Create Collapsibles
- [x] Move the subscriptions inside the Collapsible
- [x] Store the data
- [x] Initialize the Collapsible on navigation
- [x] Make delete function
- [x] Make edit function
- [x] Prevent empty directory
- [x] Respond to subscription change (subscribe, unsubscribe)
- [x] Check the user Id to make sure that the directory is created per id
- [x] Set up chrome-storage api for sync
- [x] Filtering logic for each folder when on subscription page.
- [x] Make extension popup for function toggles and proper logo
- [x] Update storage logic for more feature.
- [ ] Handle list view of subscription page.

## How to use it

1. Get the extension installed in your chrome browser.
2. Press the [+] button beside **subscriptions**
3. Name your folder and use right click to select the channels to organize.
4. Hit save and you have placed your channels in the folder.
5. close the collapsible by clicking the top row.
