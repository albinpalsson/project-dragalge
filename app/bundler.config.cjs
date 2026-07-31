// @ts-check

const { configure } = require("@pokedb2/bundler/configure");
const { cssInJsTransform } = require("@pokedb2/css-in-js/transform");

module.exports = configure({
	entry: "src/index.ts",
	outputDir: "dist",
	target: "es6",
	cacheDir: ".cache",
	transforms: [cssInJsTransform()],
});
