import type { GameSettings } from '../db/game-db/queries';
import type { EvolutionGraph } from '../db/pokemon-data/evolution-graph';
import type { PokemonTypeCatalog } from '../db/pokemon-data/queries';

type MonoRunSettings = Pick<
    GameSettings,
    'monoRunEnabled' | 'monoRunType' | 'monoRunFutureEvolutions'
>;

export function getMonoRunEligibleNames(
    settings: MonoRunSettings,
    catalog: PokemonTypeCatalog,
    graph: Pick<EvolutionGraph, 'getNode'>,
): ReadonlySet<string> | undefined {
    if (!settings.monoRunEnabled) {
        return undefined;
    }

    const typesByName = new Map(
        catalog.pokemon.map((entry) => [
            entry.name,
            [entry.primaryType, entry.secondaryType],
        ]),
    );
    const hasType = (name: string) =>
        typesByName.get(name)?.includes(settings.monoRunType) ?? false;

    const qualifies = (name: string): boolean => {
        if (hasType(name)) {
            return true;
        }
        if (!settings.monoRunFutureEvolutions) {
            return false;
        }
        const visited = new Set([name]);
        const pending = [name];
        while (pending.length > 0) {
            const current = pending.pop() as string;
            for (const edge of graph.getNode(current)?.nextEvolutions ?? []) {
                if (visited.has(edge.pokemonName)) {
                    continue;
                }
                if (hasType(edge.pokemonName)) {
                    return true;
                }
                visited.add(edge.pokemonName);
                pending.push(edge.pokemonName);
            }
        }
        return false;
    };

    return new Set(
        catalog.pokemon.map((entry) => entry.name).filter(qualifies),
    );
}
