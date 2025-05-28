import * as fs from "node:fs";
import { resolve } from "node:path";
import colorLog from "../log";
import ManifestParser from "../manifest-parser";
import type { PluginOption } from "vite";

export default function makeManifest(
	manifest: chrome.runtime.ManifestV3,
	distDir: string,
	config: { contentScriptCssKey?: string },
): PluginOption {
	function makeManifest(to: string) {
		if (!fs.existsSync(to)) {
			fs.mkdirSync(to);
		}
		const manifestPath = resolve(to, "manifest.json");

		// Naming change for cache invalidation
		if (config.contentScriptCssKey) {
			for (const script of manifest.content_scripts) {
				script.css = script.css.map((css) =>
					css.replace("<KEY>", config.contentScriptCssKey),
				);
			}
		}

		fs.writeFileSync(
			manifestPath,
			ManifestParser.convertManifestToString(manifest),
		);

		colorLog(`\nManifest file copy complete: ${manifestPath}`, "success");
	}

	return {
		name: "make-manifest",
		buildStart() {},
		buildEnd() {
			makeManifest(distDir);
		},
	};
}
