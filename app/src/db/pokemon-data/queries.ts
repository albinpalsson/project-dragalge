import { getPokemonDb } from './client';

export const STARTER_NAMES = ['Sprigatito', 'Fuecoco', 'Quaxly'] as const;

export async function listStarters() {
    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('name', 'in', STARTER_NAMES)
        .execute();
}

export async function getPokemonById(
    id: number,
) {
    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
}

export async function listPokemonByIds(ids: readonly number[]) {
    if (ids.length === 0) {
        return [];
    }

    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('id', 'in', ids)
        .execute();
}
