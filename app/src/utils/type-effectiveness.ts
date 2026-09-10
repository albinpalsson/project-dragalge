import type { TypeChartEntry } from '../db/pokemon-data/queries';

export interface DefensiveEffectivenessEntry {
    attackingType: string;
    multiplier: number;
}

interface PairIndex {
    byPair: Map<string, number>;
    attackingTypes: string[];
}

// Memoize the pair map and attacking types list using WeakMap keyed by chart reference.
// Since chartQuery.data is stable (query cache, staleTime: Infinity), this builds once.
const pairIndexCache = new WeakMap<readonly TypeChartEntry[], PairIndex>();

function getPairIndex(chart: readonly TypeChartEntry[]): PairIndex {
    let cached = pairIndexCache.get(chart);
    if (cached) {
        return cached;
    }

    const byPair = new Map<string, number>();
    const attackingTypesSet = new Set<string>();

    for (const entry of chart) {
        const key = `${entry.attackingType}|${entry.defendingType}`;
        byPair.set(key, entry.multiplier);
        attackingTypesSet.add(entry.attackingType);
    }

    cached = {
        byPair,
        attackingTypes: Array.from(attackingTypesSet),
    };
    pairIndexCache.set(chart, cached);
    return cached;
}

export function defensiveEffectiveness(
    chart: readonly TypeChartEntry[],
    primaryType: string,
    secondaryType: string,
): DefensiveEffectivenessEntry[] {
    const { byPair, attackingTypes } = getPairIndex(chart);

    // Calculate combined multiplier for each attacking type
    const results: DefensiveEffectivenessEntry[] = [];
    for (const attackingType of attackingTypes) {
        const primaryKey = `${attackingType}|${primaryType}`;
        const primaryMultiplier = byPair.get(primaryKey) ?? 1;

        const secondaryKey = `${attackingType}|${secondaryType}`;
        const secondaryMultiplier = secondaryType
            ? (byPair.get(secondaryKey) ?? 1)
            : 1;

        const combined = primaryMultiplier * secondaryMultiplier;

        results.push({
            attackingType,
            multiplier: combined,
        });
    }

    // Sort by multiplier descending, then by type name
    results.sort((a, b) => {
        if (a.multiplier !== b.multiplier) {
            return b.multiplier - a.multiplier;
        }
        return a.attackingType.localeCompare(b.attackingType);
    });

    return results;
}
