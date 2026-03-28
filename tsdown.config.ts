import { babel } from "@rollup/plugin-babel";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/*"],
	outDir: "dist",
	format: "esm",
	// sourcemap: true,
	dts: true,
	unbundle: true,
	deps: {
		// neverBundle: ["solid-js", "@solidjs/web", "@solidjs/store", "@standard-schema/spec"],
		neverBundle: ["*"],
	},
	plugins: [
		babel({
			extensions: [".ts", ".tsx"],
			babelHelpers: "bundled",
			presets: [
				["@babel/preset-typescript", { isTSX: true, allExtensions: true, allowDeclareFields: true }],
				["solid", { generate: "dom" }],
			],
		}),
	],
});
