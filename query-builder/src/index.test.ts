import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createDb } from './index.ts'
import type { DbClient } from './index.ts'

type TestDB = {
	pokemon: { id: number; name: string; caught: boolean }
	encounters: { id: number; pokemon_id: number }
}

const stubClient: DbClient = { execute: async () => [] }
const db = createDb<TestDB>(stubClient)

describe('select', () => {
	it('selectAll compiles to select *', () => {
		const { sql, parameters } = db.selectFrom('pokemon').selectAll().compile()
		assert.equal(sql, 'select * from "pokemon"')
		assert.deepEqual(parameters, [])
	})

	it('where adds a parameterised condition', () => {
		const { sql, parameters } = db
			.selectFrom('pokemon')
			.selectAll()
			.where('caught', '=', false)
			.compile()
		assert.equal(sql, 'select * from "pokemon" where "caught" = ?')
		assert.deepEqual(parameters, [false])
	})

	it('multiple where calls are joined with AND', () => {
		const { sql, parameters } = db
			.selectFrom('pokemon')
			.selectAll()
			.where('caught', '=', false)
			.where('name', '=', 'Pikachu')
			.compile()
		assert.equal(sql, 'select * from "pokemon" where "caught" = ? and "name" = ?')
		assert.deepEqual(parameters, [false, 'Pikachu'])
	})

	it('innerJoin produces correct join clause', () => {
		const { sql, parameters } = db
			.selectFrom('pokemon')
			.innerJoin('encounters', 'encounters.pokemon_id', 'pokemon.id')
			.selectAll()
			.compile()
		assert.equal(
			sql,
			'select * from "pokemon" inner join "encounters" on "encounters"."pokemon_id" = "pokemon"."id"',
		)
		assert.deepEqual(parameters, [])
	})
})

describe('insert', () => {
	it('values with a single row', () => {
		const { sql, parameters } = db
			.insertInto('pokemon')
			.values({ id: 1, name: 'Pikachu', caught: true })
			.compile()
		assert.equal(sql, 'insert into "pokemon" ("id", "name", "caught") values (?, ?, ?)')
		assert.deepEqual(parameters, [1, 'Pikachu', true])
	})

	it('values with multiple rows', () => {
		const { sql, parameters } = db
			.insertInto('pokemon')
			.values([
				{ id: 1, name: 'Pikachu', caught: true },
				{ id: 2, name: 'Bulbasaur', caught: false },
			])
			.compile()
		assert.equal(
			sql,
			'insert into "pokemon" ("id", "name", "caught") values (?, ?, ?), (?, ?, ?)',
		)
		assert.deepEqual(parameters, [1, 'Pikachu', true, 2, 'Bulbasaur', false])
	})
})

describe('update', () => {
	it('set with where', () => {
		const { sql, parameters } = db
			.updateTable('pokemon')
			.set({ caught: true })
			.where('id', '=', 1)
			.compile()
		assert.equal(sql, 'update "pokemon" set "caught" = ? where "id" = ?')
		assert.deepEqual(parameters, [true, 1])
	})
})

describe('delete', () => {
	it('where produces parameterised delete', () => {
		const { sql, parameters } = db.deleteFrom('pokemon').where('id', '=', 1).compile()
		assert.equal(sql, 'delete from "pokemon" where "id" = ?')
		assert.deepEqual(parameters, [1])
	})
})
