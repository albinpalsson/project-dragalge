// The secondary views share this one lazy entry so they load as a single
// chunk: each alone is below the bundler's minChunkBytes and would be folded
// back into the main file.
export { About } from './About';
export { Licenses } from './Licenses';
