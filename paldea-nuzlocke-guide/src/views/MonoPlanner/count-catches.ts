import { getEncounterGroupKey } from '../../pokemon-species';
import type { PlanContext, Slot } from './plan-types';

/**
 * The most Pokémon the slots can give. Each slot catches one species. Without
 * the dupes clause that is one per slot. With it, every catch has to come from
 * a different evolution family, so slots whose pools overlap can give fewer:
 * the answer is the largest set of slots that can each be given a family of
 * their own (a maximum matching, found with augmenting paths).
 *
 * It is a best case: it assumes every optional slot rolls what suits it.
 */
export function countCatches(
    context: PlanContext,
    slots: readonly Slot[],
): number {
    if (!context.inputs.dupesClause) {
        return slots.length;
    }
    const { getEvolutionFamily } = context.data.evolutionGraph;
    // One id per family: its alphabetically first member. Members go through
    // their species group, or Deerling's four seasonal lines would count as
    // four families.
    const familyOf = (name: string): string =>
        getEvolutionFamily(name)
            .map(getEncounterGroupKey)
            .sort()[0] ?? getEncounterGroupKey(name);
    const options = slots.map((slot) => [
        ...new Set(slot.pool.map((species) => familyOf(species.memberNames[0]))),
    ]);

    const slotByFamily = new Map<string, number>();
    const assign = (slot: number, tried: Set<string>): boolean => {
        for (const family of options[slot]) {
            if (tried.has(family)) {
                continue;
            }
            tried.add(family);
            const holder = slotByFamily.get(family);
            if (holder === undefined || assign(holder, tried)) {
                slotByFamily.set(family, slot);
                return true;
            }
        }
        return false;
    };

    let catches = 0;
    for (let slot = 0; slot < slots.length; slot += 1) {
        if (assign(slot, new Set())) {
            catches += 1;
        }
    }
    return catches;
}
