import { useMemo } from 'react';
import { useQuery } from '../../../server-query';
import {
    getPokemon,
    getPokemonEvolutionDetails,
} from '../../../db/pokemon-data/queries';
import { pokemonEvolutionQueryKey, pokemonQueryKey } from '../../../query-keys';
import { useTypeChartQuery } from '../queries';
import {
    defensiveEffectiveness,
    type DefensiveEffectivenessEntry,
} from '../../../utils/type-effectiveness';

export function usePokemonQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonQueryKey(pokemonName),
        queryFn: () => getPokemon(pokemonName),
        staleTime: Infinity,
    });
}

export function usePokemonEvolutionQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonEvolutionQueryKey(pokemonName),
        queryFn: () => getPokemonEvolutionDetails(pokemonName),
        staleTime: Infinity,
    });
}

export function useTypeDefenses(
    pokemonName: string,
): DefensiveEffectivenessEntry[] {
    const pokemonQuery = usePokemonQuery(pokemonName);
    const chartQuery = useTypeChartQuery();

    return useMemo(() => {
        // If either query hasn't resolved, return empty array
        if (!pokemonQuery.data || !chartQuery.data) {
            return [];
        }

        const entries = defensiveEffectiveness(
            chartQuery.data,
            pokemonQuery.data.primaryType,
            pokemonQuery.data.secondaryType,
        );
        // Filter out neutral (1.0x) effectiveness
        return entries.filter((e) => e.multiplier !== 1);
    }, [
        chartQuery.data,
        pokemonQuery.data,
        pokemonQuery.data?.primaryType,
        pokemonQuery.data?.secondaryType,
    ]);
}
