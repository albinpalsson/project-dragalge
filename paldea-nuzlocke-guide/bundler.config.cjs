// @ts-check

const { configure } = require('@project-dragalge/bundler/configure');
const { cssInJsTransform } = require('@project-dragalge/css-in-js/transform');
const { redactPlugin } = require('@project-dragalge/redact-plugin');

module.exports = configure({
    entry: 'src/index.tsx',
    outputDir: 'dist',
    target: 'es2020',
    cacheDir: '.cache',
    inlineAssets: ['.avif'],
    env: {
        GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
        APP_VERSION: process.env.APP_VERSION,
    },
    transforms: [
        cssInJsTransform(),
        // Include a feature before using it: the stubs fail quietly.
        redactPlugin({ include: ['class', 'context', 'memo', 'portal'] }),
    ],
});
