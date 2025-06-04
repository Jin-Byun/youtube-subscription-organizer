import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
	manifest_version: 3,
	name: packageJson.name,
	version: packageJson.version,
	description: packageJson.description,
	permissions: ["activeTab", "tabs", "webRequest", "storage"], // storage later for storage.sync
	host_permissions: ["https://*/*"],
	externally_connectable: {
		matches: ["https://www.youtube.com/*"],
	},
	background: {
		service_worker: "src/background/index.js",
		type: "module",
	},
	action: {
		default_title: "My YT Organizer",
		default_icon: "icon-34.png",
		default_popup: "src/popup/index.html",
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
				"folder.svg",
			],
			matches: ["*://*/*"],
		},
	],
};

export default manifest;
