import fs from "fs";
import { defineConfig } from "vite";
import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(async (args) => {
	if (args.mode != "development") {
		let css = await fs.promises.readFile("src/bunhae.module.css", "utf-8");

		css = css
			.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, "")
			.replace(/\s+/g, " ")
			.replace(/(\r\n|\n|\r)/gm, "")
			.trim();
		await fs.promises.writeFile("generated/bunhae.module.css", css);
	}

	if (args.mode == "demo") {
		return {
			base: "./",
			plugins: [svelte()],
			build: {
				target: "esnext",
				outDir: "demo",
				chunkSizeWarningLimit: 1000,
				rollupOptions: {
					external: [
						"url",
						"fs",
						"fast-diff",
						"opentype.js",
						"woff2-encoder/decompress",
					],
				},
			},
		};
	}

	if (args.mode == "production") {
		return {
			build: {
				outDir: "dist",
				minify: true,
				assetsInlineLimit: 0,
				lib: {
					entry: path.resolve(__dirname, "src/index.ts"),
					name: "Bunhae",
					fileName: (format) =>
						`index.${format == "cjs" ? "cjs" : "mjs"}`,
					formats: ["es", "cjs"],
				},
				rollupOptions: {
					external: [
						"url",
						"fs",
						"fast-diff",
						"opentype.js",
						"woff2-encoder/decompress",
					],
				},
			},
		};
	}

	return {
		plugins: [svelte()],
		server: {
			port: 3000,
			fs: {
				strict: false,
			},
			resolve: {
				alias: {
					"/www": path.resolve(__dirname, "www"),
				},
			},
		},
		rollupOptions: {
			external: ["fast-diff", "opentype.js", "woff2-encoder/decompress"],
		},
	};
});
