import { useMemo } from 'react';
import {
    defensiveEffectiveness,
    type DefensiveEffectivenessEntry,
} from '../../utils/type-effectiveness';
import { useTypeChartQuery } from './queries';

export function useTypeDefenses(
    primaryType: string | undefined,
    secondaryType: string | undefined,
): DefensiveEffectivenessEntry[] {
    const typeChartQuery = useTypeChartQuery();

    return useMemo(() => {
        if (!primaryType || !typeChartQuery.data) {
            return [];
        }

        return defensiveEffectiveness(
            typeChartQuery.data,
            primaryType,
            secondaryType ?? '',
        ).filter((entry) => entry.multiplier !== 1);
    }, [primaryType, secondaryType, typeChartQuery.data]);
}
