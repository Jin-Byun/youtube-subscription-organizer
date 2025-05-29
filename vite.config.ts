import { defineConfig } from "vite";
import path, { resolve } from "node:path";
import manifest from "./manifest";
import makeManifest from "./utils/plugins/make-manifest";
import watchRebuild from "./utils/plugins/watch-rebuild";

const rootDir = resolve(__dirname);
const publicDir = resolve(rootDir, "public");
const outDir = resolve(rootDir, "dist");
const srcDir = resolve(rootDir, "src");
console.log(process.env.NODE_ENV);
const isProduction = process.env.NODE_ENV !== "development";

export default defineConfig({
	plugins: [
		makeManifest(manifest, outDir, {
			contentScriptCssKey: regenerateCacheInvalidationKey(),
		}),
		watchRebuild(),
	],
	publicDir,
	build: {
		outDir,
		minify: isProduction,
		reportCompressedSize: isProduction,
		rollupOptions: {
			input: {
				background: resolve(srcDir, "background.ts"),
				content: resolve(srcDir, "contentScript.ts"),
				contentStyle: resolve(srcDir, "styles.css"),
			},
			output: {
				entryFileNames: "src/[name]/index.js",
				chunkFileNames: "assets/js/[name].[hash].js",
				assetFileNames: (assetInfo) => {
					const { dir, name: _name } = path.parse(assetInfo.name);
					const assetFolder = dir.split("/").at(-1);
					const name = assetFolder + firstUpperCase(_name);
					if (name === "Contentstyle") {
						return `assets/css/Styles${cacheInvalidationKey}.chunk.css`;
					}
					return `assets/[ext]/${name}.chunk.[ext]`;
				},
			},
		},
	},
});

function firstUpperCase(str: string) {
	const firstAlphabet = new RegExp(/( |^)[a-z]/, "g");
	return str.toLowerCase().replace(firstAlphabet, (L) => L.toUpperCase());
}

let cacheInvalidationKey: string = generateKey();
function regenerateCacheInvalidationKey() {
	cacheInvalidationKey = generateKey();
	return cacheInvalidationKey;
}

function generateKey(): string {
	return `${(Date.now() / 100).toFixed()}`;
}
