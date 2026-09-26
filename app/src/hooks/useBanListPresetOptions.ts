import { useMemo } from 'react';
import {
    DEFAULT_BAN_PRESET,
    PSEUDO_LEGENDARY_PRESET,
} from '../utils/ban-list';
import { useCompletedGameChampionPresets } from '../views/Home/queries';

export interface BanListPresetOption {
    label: string;
    names: readonly string[];
    disabled?: boolean;
    title?: string;
}

export function useBanListPresetOptions(): readonly BanListPresetOption[] {
    const championPresets = useCompletedGameChampionPresets();

    return useMemo(
        () => [
            { label: 'Default / recommended', names: DEFAULT_BAN_PRESET },
            {
                label: 'Pseudo legends',
                names: PSEUDO_LEGENDARY_PRESET,
            },
            ...(championPresets.data?.length
                ? championPresets.data
                : [
                      {
                          label: 'Previous champions',
                          names: [],
                          disabled: true,
                          title: 'Unavailable: no previous game has reached 100% completion.',
                      },
                  ]),
        ],
        [championPresets.data],
    );
}
