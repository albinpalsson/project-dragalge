import assert from "node:assert/strict";
import test from "node:test";

import { createQueryClient, invalidateQueries } from "./index.ts";

// Helper: subscribe to a key and collect all snapshots until unsubscribed
function collectSnapshots<T>(
	client: ReturnType<typeof createQueryClient>,
	key: string,
) {
	const snapshots: ReturnType<typeof client.getQuerySnapshot<T>>[] = [];
	const unsubscribe = client.subscribe(key, () => {
		snapshots.push(client.getQuerySnapshot<T>(key));
	});
	return { snapshots, unsubscribe };
}

test("query: multiple fetches with same key share response — queryFn called once", async () => {
	const client = createQueryClient();
	let callCount = 0;
	const queryFn = () => {
		callCount++;
		return Promise.resolve("data");
	};

	const key = JSON.stringify(["pokemon"]);
	const [r1, r2] = await Promise.all([
		client.fetch(key, queryFn),
		client.fetch(key, queryFn),
	]);

	assert.equal(callCount, 1);
	assert.equal(r1, "data");
	assert.equal(r2, "data");
});

test("query: state transitions pending → success with data", async () => {
	const client = createQueryClient();
	const key = JSON.stringify(["species"]);
	const { snapshots, unsubscribe } = collectSnapshots(client, key);

	await client.fetch(key, () => Promise.resolve(42));
	unsubscribe();

	const last = client.getQuerySnapshot<number>(key);
	assert.equal(last.status, "success");
	assert.equal(last.data, 42);
	assert.ok(last.dataUpdatedAt > 0);
	assert.equal(last.isFetching, false);
	// at least two notifications: pending (isFetching) then success
	assert.ok(snapshots.length >= 2);
});

test("query: error sets status to error and populates error field", async () => {
	const client = createQueryClient();
	const key = JSON.stringify(["bad"]);
	const boom = new Error("network failure");

	await assert.rejects(() => client.fetch(key, () => Promise.reject(boom)));

	const state = client.getQuerySnapshot(key);
	assert.equal(state.status, "error");
	assert.equal(state.error, boom);
	assert.equal(state.data, undefined);
});

test("mutation: state transitions idle → pending → success", async () => {
	const client = createQueryClient();
	const key = JSON.stringify(["savePokemon"]);
	const { snapshots, unsubscribe } = collectSnapshots(client, key);

	// initial state is idle (no snapshot yet)
	assert.equal(client.getMutationSnapshot(key).status, "idle");

	await client.executeMutation(
		key,
		(name: string) => Promise.resolve(`saved:${name}`),
		"Pikachu",
	);
	unsubscribe();

	const last = client.getMutationSnapshot<string>(key);
	assert.equal(last.status, "success");
	assert.equal(last.data, "saved:Pikachu");
	assert.equal(last.error, null);
	assert.ok(snapshots.length >= 2);
});

test("mutation: error sets status to error and populates error field", async () => {
	const client = createQueryClient();
	const key = JSON.stringify(["failMutation"]);
	const boom = new Error("save failed");

	await assert.rejects(() =>
		client.executeMutation(key, () => Promise.reject(boom), undefined),
	);

	const state = client.getMutationSnapshot(key);
	assert.equal(state.status, "error");
	assert.equal(state.error, boom);
	assert.equal(state.data, undefined);
});

test("invalidateQueries: triggers refetch for active key ignoring staleTime", async () => {
	const client = createQueryClient();
	let callCount = 0;
	const queryFn = () => {
		callCount++;
		return Promise.resolve(callCount);
	};
	const key = JSON.stringify(["items"]);

	// first fetch — data is fresh, staleTime=60s
	await client.fetch(key, queryFn, 60_000);
	assert.equal(callCount, 1);

	// second fetch within staleTime — should be skipped
	await client.fetch(key, queryFn, 60_000);
	assert.equal(callCount, 1);

	// invalidate → dataUpdatedAt reset → next fetch must re-run queryFn
	invalidateQueries(client, { queryKey: ["items"] });
	await client.fetch(key, queryFn, 60_000);
	assert.equal(callCount, 2);

	const state = client.getQuerySnapshot<number>(key);
	assert.equal(state.data, 2);
});

test("query: background refetch keeps status 'success' and preserves old data", async () => {
	const client = createQueryClient();
	const key = JSON.stringify(["bg"]);

	await client.fetch(key, () => Promise.resolve("v1"));

	const statusDuringRefetch: string[] = [];
	const dataDuringRefetch: unknown[] = [];
	const unsubscribe = client.subscribe(key, () => {
		const s = client.getQuerySnapshot(key);
		statusDuringRefetch.push(s.status);
		dataDuringRefetch.push(s.data);
	});

	invalidateQueries(client, { queryKey: ["bg"] });
	await client.fetch(key, () => Promise.resolve("v2"));
	unsubscribe();

	// first notification is the isFetching=true pulse — status must stay 'success'
	assert.equal(statusDuringRefetch[0], "success");
	// old data is visible during the refetch
	assert.equal(dataDuringRefetch[0], "v1");
	// last notification is the completed refetch
	assert.equal(statusDuringRefetch.at(-1), "success");
	assert.equal(dataDuringRefetch.at(-1), "v2");
});
