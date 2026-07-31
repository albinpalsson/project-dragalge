import assert from "node:assert/strict";
import test from "node:test";

import { cx } from "./index.ts";

test("cx concatenates only non-empty strings", () => {
	const value = cx("cat", undefined, "yarn", false, null, "", 1, "fun");
	assert.equal(value, "cat yarn fun");
});
