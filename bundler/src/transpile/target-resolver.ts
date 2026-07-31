import type { BundlerTarget } from '../main';

export function resolveTscTarget(target: BundlerTarget | undefined): string {
  switch (target) {
    case 'es6':
      return 'ES2015';
    case 'es2022':
    default:
      return 'ES2022';
  }
}

export function resolveTscLib(target: BundlerTarget | undefined): string {
  switch (target) {
    case 'es6':
      return 'DOM,DOM.Iterable,ES2015';
    case 'es2022':
    default:
      return 'DOM,DOM.Iterable,ES2022';
  }
}
