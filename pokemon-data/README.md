# @project-dragalge/pokemon-data

This package provides Pokémon reference data as an embedded SQL database. Its
current data is tailored to Pokémon Scarlet and Violet and the Paldea Nuzlocke
Guide, but the tables describe general Pokémon data such as species, types,
abilities, moves, evolutions, locations, and encounters.

```ts
import { DB } from '@project-dragalge/db';
import pokemonData from '@project-dragalge/pokemon-data';

const db = new DB({
    read: () => Uint8Array.from(atob(pokemonData), (char) => char.charCodeAt(0)),
    write: () => {},
});
await db.load();
const rows = db.execute('SELECT name FROM pokemon', []);
```

## Interfaces

The default export is an encoded database snapshot, not a running database or a
SQLite file. `PokemonDataDb` describes its tables for use with
`@project-dragalge/query-builder`; the package also provides asset and icon-slug
helpers. The snapshot can be loaded with this database or another implementation
that can read its format. Data sources and asset details are listed in the
[Bulbapedia data notice](../paldea-nuzlocke-guide/BULBAPEDIA_DATA_LICENSE.md)
and [sprite notice](POKEMONDB_SPRITES_NOTICE.md).