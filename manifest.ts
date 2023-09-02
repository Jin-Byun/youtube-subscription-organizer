import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  permissions: ["storage", "tabs", "scripting", "activeTab"],
  host_permissions: ["https://*/*"],
  background: {
    service_worker: "src/background/index.js",
    type: "module",
  },
  action: {
    default_title: "My YT Bookmarks",
    default_icon: "icon-34.png",
  },
  icons: {
    "128": "icon-128.png",
  },
  content_scripts: [
    {
      matches: ["https://*.youtube.com/*"],
      js: ["src/content/index.js"],
      css: ["assets/css/Styles<KEY>.chunk.css"],
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
        "icon-128.png",
        "icon-34.png",
      ],
      matches: ["*://*/*"],
    },
  ],
};

export default manifest;
