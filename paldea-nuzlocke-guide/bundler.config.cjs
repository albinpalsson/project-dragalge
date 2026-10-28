// @ts-check

const { configure } = require('@project-dragalge/bundler/configure');
const { cssInJsTransform } = require('@project-dragalge/css-in-js/transform');

module.exports = configure({
    entry: 'src/index.tsx',
    outputDir: 'dist',
    target: 'es6',
    cacheDir: '.cache',
    env: {
        GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
        APP_VERSION: process.env.APP_VERSION,
    },
    transforms: [cssInJsTransform()],
});
