import type { Database } from '@pokedb2/query-builder';
import type { PokemonDataDb } from '@pokedb2/pokemon-data';
import { getPokemonDb } from './client';

export interface EvolutionGraphEdge {
    pokemonName: string;
    method: string;
}

export interface EvolutionGraphNode {
    pokemonName: string;
    nextEvolutions: EvolutionGraphEdge[];
    previousEvolutions: EvolutionGraphEdge[];
}

export interface EvolutionGraph {
    getNode: (pokemonName: string) => EvolutionGraphNode | undefined;
    getFirstStage: (pokemonName: string) => string | undefined;
    getEvolutionFamily: (pokemonName: string) => string[];
}

async function buildEvolutionGraph(
    db: Database<PokemonDataDb>,
): Promise<EvolutionGraph> {
    const [pokemonRows, transitionRows, methodRows] = await Promise.all([
        db.selectFrom('pokemon').selectAll().execute(),
        db.selectFrom('evolution_transitions').selectAll().execute(),
        db.selectFrom('evolution_methods').selectAll().execute(),
    ]);

    const nodesById = new Map<number, EvolutionGraphNode>();
    const nodesByName = new Map<string, EvolutionGraphNode>();
    for (const pokemon of pokemonRows) {
        const node: EvolutionGraphNode = {
            pokemonName: pokemon.name,
            nextEvolutions: [],
            previousEvolutions: [],
        };
        nodesById.set(pokemon.id, node);
        nodesByName.set(pokemon.name, node);
    }
    const methodsById = new Map(
        methodRows.map((method) => [method.id, method.description]),
    );

    for (const transition of transitionRows) {
        const from = nodesById.get(transition.from_pokemon_id);
        const to = nodesById.get(transition.to_pokemon_id);
        const method =
            methodsById.get(transition.method_id) ?? 'Unknown method';
        if (!from || !to) {
            continue;
        }
        from.nextEvolutions.push({ pokemonName: to.pokemonName, method });
        to.previousEvolutions.push({ pokemonName: from.pokemonName, method });
    }

    return {
        getNode: (pokemonName) => nodesByName.get(pokemonName),
        getFirstStage: (pokemonName) => {
            let current = nodesByName.get(pokemonName);
            const visited = new Set<string>();
            while (current && !visited.has(current.pokemonName)) {
                visited.add(current.pokemonName);
                const previous = current.previousEvolutions[0];
                if (!previous) {
                    return current.pokemonName;
                }
                current = nodesByName.get(previous.pokemonName);
            }
            return undefined;
        },
        getEvolutionFamily: (pokemonName) => {
            const start = nodesByName.get(pokemonName);
            if (!start) {
                return [];
            }

            const family = new Set<string>();
            const pending = [start];
            while (pending.length > 0) {
                const current = pending.pop();
                if (!current || family.has(current.pokemonName)) {
                    continue;
                }
                family.add(current.pokemonName);
                for (const edge of [
                    ...current.nextEvolutions,
                    ...current.previousEvolutions,
                ]) {
                    const next = nodesByName.get(edge.pokemonName);
                    if (next && !family.has(next.pokemonName)) {
                        pending.push(next);
                    }
                }
            }
            return [...family];
        },
    };
}

let evolutionGraphPromise: Promise<EvolutionGraph> | undefined;

export function getEvolutionGraph(): Promise<EvolutionGraph> {
    if (!evolutionGraphPromise) {
        evolutionGraphPromise = getPokemonDb().then(buildEvolutionGraph);
    }
    return evolutionGraphPromise;
}
