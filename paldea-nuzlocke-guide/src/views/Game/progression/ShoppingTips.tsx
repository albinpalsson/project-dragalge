import { ProgressionInfoCard } from '../../../components/ProgressionInfoCard';

export function FourthBadgeShoppingTip() {
    return (
        <ProgressionInfoCard title="Power Items">
            <p>
                After earning 4 Gym Badges, you can buy Power Items at Delibird
                Presents in Mesagoza, Levincia, and Cascarrafa. These give a
                Pokémon extra EVs in a specific stat whenever it earns EVs in
                battle.
            </p>
        </ProgressionInfoCard>
    );
}

export function MintsTip() {
    return (
        <ProgressionInfoCard title="Mints">
            <p>
                After earning 6 Gym Badges, you can buy Mints at Chansey Supply
                in Cascarrafa, Levincia, Mesagoza, and Montenevera. Mints change
                the effect of a Pokémon&apos;s Nature.
            </p>
        </ProgressionInfoCard>
    );
}
