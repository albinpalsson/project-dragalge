import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DB } from './db.ts';
import { dumpDb, dumpTable, describeDb } from './dump.ts';

describe('dump', () => {
    describe('describeDb', () => {
        it('formats schema with row counts', () => {
            const db = new DB();
            db.execute(
                'CREATE TABLE moves (id INT, name CHAR(32), effect CHAR(154))',
                [],
            );
            db.execute(
                'INSERT INTO moves (id, name, effect) VALUES (?, ?, ?)',
                [1, 'Tackle', 'Deals damage.'],
            );

            const output = describeDb(db);
            assert(output.includes('## moves'));
            assert(output.includes('Rows: 1'));
            assert(output.includes('id: int32'));
            assert(output.includes('name: char(32)'));
            assert(output.includes('effect: char(154)'));
        });

        it('handles hyphenated table names', () => {
            const db = new DB();
            db.execute(
                'CREATE TABLE south-province-area-one (id INT, name CHAR(32))',
                [],
            );
            db.execute(
                'INSERT INTO south-province-area-one (id, name) VALUES (?, ?)',
                [1, 'Test'],
            );

            const output = describeDb(db);
            assert(output.includes('south-province-area-one'));
            assert(output.includes('Rows: 1'));
        });
    });

    describe('CSV escaping (RFC 4180)', () => {
        it('does not quote simple values', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (value CHAR(16))', []);
            db.execute('INSERT INTO test (value) VALUES (?)', ['simple']);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines[1], 'simple');
        });

        it('quotes values containing commas', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (value CHAR(32))', []);
            db.execute('INSERT INTO test (value) VALUES (?)', ['has,comma']);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines[1], '"has,comma"');
        });

        it('escapes internal double quotes', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (value CHAR(32))', []);
            db.execute('INSERT INTO test (value) VALUES (?)', ['has"quote']);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines[1], '"has""quote"');
        });

        it('quotes values containing newlines', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (value CHAR(32))', []);
            db.execute('INSERT INTO test (value) VALUES (?)', ['line1\nline2']);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            assert(csv.includes('"line1\nline2"'));
        });

        it('quotes values containing carriage returns', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (value CHAR(32))', []);
            db.execute('INSERT INTO test (value) VALUES (?)', ['line1\rline2']);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines[1], '"line1\rline2"');
        });

        it('handles complex effect text with commas', () => {
            const db = new DB();
            db.execute(
                'CREATE TABLE moves (name CHAR(32), effect CHAR(154))',
                [],
            );
            db.execute('INSERT INTO moves (name, effect) VALUES (?, ?)', [
                'Tackle',
                'Deals 40 BP damage, 100% accuracy, standard priority.',
            ]);

            const csv = dumpTable(db, 'moves', { format: 'csv' });
            assert(
                csv.includes(
                    '"Deals 40 BP damage, 100% accuracy, standard priority."',
                ),
            );
        });
    });

    describe('column types', () => {
        it('renders all column types', () => {
            const db = new DB();
            db.execute(
                'CREATE TABLE types (id INT, level TINYINT, caught BOOLEAN, time TIMESTAMP, name CHAR(32))',
                [],
            );
            db.execute(
                'INSERT INTO types (id, level, caught, time, name) VALUES (?, ?, ?, ?, ?)',
                [42, 10, true, 1234567890.5, 'Pikachu'],
            );

            const csv = dumpTable(db, 'types', { format: 'csv' });
            const lines = csv.split('\n');
            assert(lines[1].includes('42'));
            assert(lines[1].includes('10'));
            assert(lines[1].includes('1')); // boolean true -> 1
            assert(lines[1].includes('1234567890.5'));
            assert(lines[1].includes('Pikachu'));
        });

        it('renders false as 0', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (flag BOOLEAN)', []);
            db.execute('INSERT INTO test (flag) VALUES (?)', [false]);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines[1], '0');
        });
    });

    describe('hyphenated table names', () => {
        it('works end-to-end', () => {
            const db = new DB();
            db.execute(
                'CREATE TABLE south-province-area-one (id INT, pokemon CHAR(32))',
                [],
            );
            db.execute(
                'INSERT INTO south-province-area-one (id, pokemon) VALUES (?, ?)',
                [1, 'Pidgeot'],
            );
            db.execute(
                'INSERT INTO south-province-area-one (id, pokemon) VALUES (?, ?)',
                [2, 'Lechonk'],
            );

            const csv = dumpTable(db, 'south-province-area-one', {
                format: 'csv',
            });
            const lines = csv.split('\n');
            assert.equal(lines.length, 3); // header + 2 rows
            assert(lines[1].includes('Pidgeot'));
            assert(lines[2].includes('Lechonk'));
        });
    });

    describe('limit', () => {
        it('respects limit option', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (id INT)', []);
            for (let i = 1; i <= 5; i++) {
                db.execute('INSERT INTO test (id) VALUES (?)', [i]);
            }

            const csv = dumpTable(db, 'test', { format: 'csv', limit: 2 });
            const lines = csv.split('\n');
            assert.equal(lines.length, 3); // header + 2 rows
        });
    });

    describe('JSONL format', () => {
        it('outputs one JSON object per line', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (id INT, name CHAR(32))', []);
            db.execute('INSERT INTO test (id, name) VALUES (?, ?)', [
                1,
                'Alice',
            ]);
            db.execute('INSERT INTO test (id, name) VALUES (?, ?)', [2, 'Bob']);

            const jsonl = dumpTable(db, 'test', { format: 'jsonl' });
            const lines = jsonl.split('\n');
            assert.equal(lines.length, 2);
            assert.deepEqual(JSON.parse(lines[0]), { id: 1, name: 'Alice' });
            assert.deepEqual(JSON.parse(lines[1]), { id: 2, name: 'Bob' });
        });

        it('respects limit with JSONL', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (id INT)', []);
            db.execute('INSERT INTO test (id) VALUES (?)', [1]);
            db.execute('INSERT INTO test (id) VALUES (?)', [2]);
            db.execute('INSERT INTO test (id) VALUES (?)', [3]);

            const jsonl = dumpTable(db, 'test', {
                format: 'jsonl',
                limit: 2,
            });
            const lines = jsonl.split('\n');
            assert.equal(lines.length, 2);
        });
    });

    describe('empty table', () => {
        it('CSV returns empty string', () => {
            const db = new DB();
            db.execute('CREATE TABLE empty (id INT)', []);

            const csv = dumpTable(db, 'empty', { format: 'csv' });
            assert.equal(csv, '');
        });

        it('JSONL returns empty string', () => {
            const db = new DB();
            db.execute('CREATE TABLE empty (id INT)', []);

            const jsonl = dumpTable(db, 'empty', { format: 'jsonl' });
            assert.equal(jsonl, '');
        });
    });

    describe('dumpDb', () => {
        it('dumps all tables by default', () => {
            const db = new DB();
            db.execute('CREATE TABLE moves (id INT, name CHAR(32))', []);
            db.execute('INSERT INTO moves (id, name) VALUES (?, ?)', [
                1,
                'Tackle',
            ]);
            db.execute('CREATE TABLE abilities (id INT, name CHAR(32))', []);
            db.execute('INSERT INTO abilities (id, name) VALUES (?, ?)', [
                1,
                'Overgrow',
            ]);

            const sections = dumpDb(db);
            assert.equal(sections.length, 2);
            assert(sections.some((s) => s.table === 'moves'));
            assert(sections.some((s) => s.table === 'abilities'));
        });

        it('filters tables by name', () => {
            const db = new DB();
            db.execute('CREATE TABLE moves (id INT)', []);
            db.execute('INSERT INTO moves (id) VALUES (?)', [1]);
            db.execute('CREATE TABLE abilities (id INT)', []);
            db.execute('INSERT INTO abilities (id) VALUES (?)', [1]);

            const sections = dumpDb(db, { tables: ['moves'] });
            assert.equal(sections.length, 1);
            assert.equal(sections[0].table, 'moves');
        });

        it('includes rowCount in sections', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (id INT)', []);
            db.execute('INSERT INTO test (id) VALUES (?)', [1]);
            db.execute('INSERT INTO test (id) VALUES (?)', [2]);

            const sections = dumpDb(db);
            assert.equal(sections[0].rowCount, 2);
        });
    });

    describe('deleted rows', () => {
        it('excludes deleted rows', () => {
            const db = new DB();
            db.execute('CREATE TABLE test (id INT)', []);
            db.execute('INSERT INTO test (id) VALUES (?)', [1]);
            db.execute('INSERT INTO test (id) VALUES (?)', [2]);
            db.execute('INSERT INTO test (id) VALUES (?)', [3]);
            db.execute('DELETE FROM test WHERE id = ?', [2]);

            const csv = dumpTable(db, 'test', { format: 'csv' });
            const lines = csv.split('\n');
            assert.equal(lines.length, 3); // header + 2 active rows
            assert(!csv.includes('2'));
        });
    });
});
