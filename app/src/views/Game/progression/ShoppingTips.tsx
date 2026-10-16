import { ProgressionInfoCard } from '../../../components/ProgressionInfoCard';

export function FourthBadgeShoppingTip() {
    return (
        <ProgressionInfoCard title="Power Items and Leftovers">
            <p>
                After earning 4 Gym Badges, these items are available at
                Delibird Presents:
            </p>
            <p>
                <strong>Power Items:</strong> These award a Pokemon additional
                specific EVs whenever it would normally earn EVs in battle.
                Available in Mesagoza, Levincia, and Cascarrafa.
            </p>
            <p>
                <strong>Leftovers:</strong> Available in Cascarrafa.
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
                the effect of a Pokemon&apos;s Nature.
            </p>
        </ProgressionInfoCard>
    );
}
