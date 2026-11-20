import type {
    EvolutionGraph,
    EvolutionGraphNode,
} from '../../db/pokemon-data/evolution-graph';
import type { PokemonTypeCatalog } from '../../db/pokemon-data/queries';

// Alolan and Hisuian forms stay in the Pokémon DB because saved games may
// reference them, but they cannot be obtained in Scarlet/Violet. The planner
// hides them, and the "outside of ..." wording on the Paldea evolution.
const OTHER_REGION_FORM = /\((Alolan|Hisuian) Form\)$/;
const OTHER_REGION_METHOD = /\bin (Alola|Hisui)\b/i;
const OUTSIDE_OTHER_REGION = /\s+outside of (Alola|Hisui)\b/gi;

/**
 * Other evolutions the base game does not offer: their items (Peat Block,
 * Black Augurite) or moves (Psyshield Bash) are DLC-only.
 */
const NOT_IN_BASE_GAME = new Set(['Ursaluna', 'Kleavor', 'Wyrdeer']);

function isUnavailable(pokemonName: string): boolean {
    return (
        OTHER_REGION_FORM.test(pokemonName) || NOT_IN_BASE_GAME.has(pokemonName)
    );
}

export function withoutOtherRegionForms(
    catalog: PokemonTypeCatalog,
): PokemonTypeCatalog {
    return {
        pokemon: catalog.pokemon.filter((entry) => !isUnavailable(entry.name)),
    };
}

export function withoutOtherRegionEvolutions(
    graph: EvolutionGraph,
): EvolutionGraph {
    const nodes = new Map<string, EvolutionGraphNode | undefined>();
    const getNode = (pokemonName: string) => {
        if (!nodes.has(pokemonName)) {
            const node = graph.getNode(pokemonName);
            nodes.set(
                pokemonName,
                node && {
                    ...node,
                    nextEvolutions: node.nextEvolutions
                        .filter(
                            (edge) =>
                                !isUnavailable(edge.pokemonName) &&
                                !OTHER_REGION_METHOD.test(edge.method),
                        )
                        .map((edge) => ({
                            ...edge,
                            method: edge.method.replace(
                                OUTSIDE_OTHER_REGION,
                                '',
                            ),
                        })),
                },
            );
        }
        return nodes.get(pokemonName);
    };
    return { ...graph, getNode };
}
