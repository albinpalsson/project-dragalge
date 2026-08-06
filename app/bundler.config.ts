import { configure } from '@pokedb2/bundler/configure';
import { cssInJsTransform } from '@pokedb2/css-in-js/transform';

export default configure({
    entry: 'src/index.ts',
    outputDir: 'dist',
    target: 'es6',
    cacheDir: '.cache',
    transforms: [cssInJsTransform()],
});
