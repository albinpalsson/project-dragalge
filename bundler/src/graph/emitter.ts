import type { DependencyEntry, VisitState } from './types.ts';

export function emitDeterministicEntries(
  entryPath: string,
  visited: Map<string, VisitState>,
): DependencyEntry[] {
  const emitted = new Set<string>();
  const orderedEntries: DependencyEntry[] = [];

  function emitFrom(modulePath: string): void {
    if (emitted.has(modulePath)) {
      return;
    }

    emitted.add(modulePath);
    const state = visited.get(modulePath);
    if (!state || state.status !== 'ready') {
      return;
    }

    const entry = state.entry;
    orderedEntries.push(entry);

    if ('requires' in entry) {
      for (const requireEntry of entry.requires) {
        emitFrom(requireEntry.resolvedPath);
      }
    }
  }

  emitFrom(entryPath);
  return orderedEntries;
}
