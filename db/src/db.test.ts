import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DB } from './db.ts';
import type { StoragePlugin } from './types.ts';

class MemoryStoragePlugin implements StoragePlugin {
    private blob: Uint8Array | null = null;
    read() {
        return this.blob;
    }
    write(b: Uint8Array) {
        this.blob = b;
    }
}

function makePokemonDb(plugin?: StoragePlugin) {
    const engine = new DB(plugin);
    engine.execute(
        'CREATE TABLE pokemon (id INT, name CHAR(32), caught BOOLEAN, level INT)',
        [],
    );
    engine.execute(
        'CREATE TABLE encounters (pokemon_id INT, location CHAR(48))',
        [],
    );
    return engine;
}

describe('high-level: pokémon game scenarios', () => {
    it('catch a pokémon: insert, mark caught, query by caught status', () => {
        const engine = makePokemonDb();
        engine.execute(
            'INSERT INTO pokemon (id, name, caught, level) VALUES (?, ?, ?, ?)',
            [1, 'Pikachu', false, 5],
        );
        engine.execute('UPDATE pokemon SET caught = ? WHERE id = ?', [true, 1]);
        const caught = engine.execute(
            'SELECT * FROM pokemon WHERE caught = ?',
            [true],
        );
        assert.equal(caught.length, 1);
        assert.equal(caught[0].name, 'Pikachu');
        assert.equal(caught[0].caught, true);
    });

    it('release a pokémon: delete then confirm gone', () => {
        const engine = makePokemonDb();
        engine.execute(
            'INSERT INTO pokemon (id, name, caught, level) VALUES (?, ?, ?, ?)',
            [1, 'Pikachu', true, 5],
        );
        engine.execute('DELETE FROM pokemon WHERE id = ?', [1]);
        const rows = engine.execute('SELECT * FROM pokemon', []);
        assert.deepEqual(rows, []);
    });

    it('find pokémon by location via inner join', () => {
        const engine = makePokemonDb();
        engine.execute(
            'INSERT INTO pokemon (id, name, caught, level) VALUES (?, ?, ?, ?)',
            [1, 'Pikachu', false, 5],
        );
        engine.execute(
            'INSERT INTO encounters (pokemon_id, location) VALUES (?, ?)',
            [1, 'Viridian Forest'],
        );
        const rows = engine.execute(
            'SELECT * FROM encounters INNER JOIN pokemon ON encounters.pokemon_id = pokemon.id',
            [],
        );
        assert.equal(rows.length, 1);
        assert.equal(rows[0].location, 'Viridian Forest');
        assert.equal(rows[0].name, 'Pikachu');
    });

    it('auto-persist: data survives across engine instances', async () => {
        const plugin = new MemoryStoragePlugin();
        const engine1 = makePokemonDb(plugin);
        engine1.execute(
            'INSERT INTO pokemon (id, name, caught, level) VALUES (?, ?, ?, ?)',
            [1, 'Pikachu', true, 5],
        );
        // wait for debounced write to fire
        await new Promise((r) => setTimeout(r, 100));

        const engine2 = new DB(plugin);
        await engine2.load();
        const rows = engine2.execute('SELECT * FROM pokemon', []);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].name, 'Pikachu');
    });
});

describe('unit: SQL operations', () => {
    it('inserts and reads back int32 rows', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE numbers (id INT)', []);

        engine.execute('INSERT INTO numbers (id) VALUES (?)', [42]);
        engine.execute('INSERT INTO numbers (id) VALUES (?)', [7]);

        const rows = engine.execute('SELECT * FROM numbers', []);
        assert.deepEqual(rows, [{ id: 42 }, { id: 7 }]);
    });

    it('handles multiple columns', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE pokemon (id INT, level INT)', []);

        engine.execute('INSERT INTO pokemon (id, level) VALUES (?, ?)', [1, 5]);
        engine.execute(
            'INSERT INTO pokemon (id, level) VALUES (?, ?)',
            [2, 12],
        );

        const rows = engine.execute('SELECT * FROM pokemon', []);
        assert.deepEqual(rows, [
            { id: 1, level: 5 },
            { id: 2, level: 12 },
        ]);
    });

    it('supports multi-row INSERT tuples in one statement', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE pokemon (id INT, level INT)', []);

        engine.execute(
            'INSERT INTO pokemon (id, level) VALUES (?, ?), (?, ?)',
            [1, 5, 2, 12],
        );

        const rows = engine.execute('SELECT * FROM pokemon', []);
        assert.deepEqual(rows, [
            { id: 1, level: 5 },
            { id: 2, level: 12 },
        ]);
    });

    it('rejects INSERT tuples that do not match column count', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE pokemon (id INT, level INT)', []);

        assert.throws(() =>
            engine.execute('INSERT INTO pokemon (id, level) VALUES (?)', [1]),
        );
    });

    it('rejects INSERT with wrong parameter count for multiple tuples', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE pokemon (id INT, level INT)', []);

        assert.throws(() =>
            engine.execute(
                'INSERT INTO pokemon (id, level) VALUES (?, ?), (?, ?)',
                [1, 5, 2],
            ),
        );
    });

    it('CREATE TABLE throws on duplicate table name', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE t (id INT)', []);
        assert.throws(() => engine.execute('CREATE TABLE t (id INT)', []));
    });

    it('throws on unknown table', () => {
        const engine = new DB();
        assert.throws(() => engine.execute('SELECT * FROM missing', []));
    });

    it('throws on unsupported SQL', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE t (id INT)', []);
        assert.throws(() => engine.execute('DROP TABLE t', []));
    });

    it('buffer grows beyond initial capacity', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE ids (n INT)', []);
        for (let i = 0; i < 20; i++) {
            engine.execute('INSERT INTO ids (n) VALUES (?)', [i]);
        }
        const rows = engine.execute('SELECT * FROM ids', []);
        assert.equal(rows.length, 20);
        assert.deepEqual(rows[19], { n: 19 });
    });

    it('delete keeps row count correct for later inserts', () => {
        const engine = new DB();
        engine.execute('CREATE TABLE ids (n INT)', []);
        engine.execute('INSERT INTO ids (n) VALUES (?)', [1]);
        engine.execute('INSERT INTO ids (n) VALUES (?)', [2]);
        engine.execute('DELETE FROM ids WHERE n = ?', [1]);
        engine.execute('INSERT INTO ids (n) VALUES (?)', [3]);
        const rows = engine.execute('SELECT * FROM ids', []);
        assert.equal(rows.length, 2);
        assert.deepEqual(rows.map((r) => r.n).sort(), [2, 3]);
    });
});

describe('persistence', () => {
    it('save and load round-trip preserves multi-column rows', async () => {
        const plugin = new MemoryStoragePlugin();
        const engine1 = new DB(plugin);
        engine1.execute('CREATE TABLE pokemon (id INT, level INT)', []);
        engine1.execute(
            'INSERT INTO pokemon (id, level) VALUES (?, ?)',
            [1, 5],
        );
        engine1.execute(
            'INSERT INTO pokemon (id, level) VALUES (?, ?)',
            [2, 12],
        );
        await engine1.save();

        const engine2 = new DB(plugin);
        await engine2.load();
        assert.deepEqual(engine2.execute('SELECT * FROM pokemon', []), [
            { id: 1, level: 5 },
            { id: 2, level: 12 },
        ]);
    });
});
