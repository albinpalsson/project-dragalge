// @ts-check

const { configure } = require('@pokedb2/bundler/configure');
const { cssInJsTransform } = require('@pokedb2/css-in-js/transform');

module.exports = configure({
    entry: 'src/index.tsx',
    outputDir: 'dist',
    target: 'es6',
    cacheDir: '.cache',
    env: {
        GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    },
    transforms: [cssInJsTransform()],
});
