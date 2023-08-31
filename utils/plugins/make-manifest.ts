import * as fs from "fs";
import { resolve } from "path";
import colorLog from "../log";
import ManifestParser from "../manifest-parser";
import type { PluginOption } from "vite";

export default function makeManifest(
  manifest: chrome.runtime.ManifestV3,
  publicDir: string,
  distDir: string,
  config: { isDev: boolean; contentScriptCssKey?: string }
): PluginOption {
  function makeManifest(to: string) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to);
    }
    const manifestPath = resolve(to, "manifest.json");

    // Naming change for cache invalidation
    if (config.contentScriptCssKey) {
      manifest.content_scripts.forEach((script) => {
        script.css = script.css.map((css) =>
          css.replace("<KEY>", config.contentScriptCssKey)
        );
      });
    }

    fs.writeFileSync(
      manifestPath,
      ManifestParser.convertManifestToString(manifest)
    );

    colorLog(`Manifest file copy complete: ${manifestPath}`, "success");
  }

  return {
    name: "make-manifest",
    buildStart() {
      if (config.isDev) {
        makeManifest(distDir);
      }
    },
    buildEnd() {
      if (config.isDev) {
        return;
      }
      makeManifest(publicDir);
    },
  };
}
