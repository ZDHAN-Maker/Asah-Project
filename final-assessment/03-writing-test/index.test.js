<<<<<<< HEAD
import { test } from "node:test";
import assert from "assert";
import { sum } from "./index.js";

test("Test Function Sum", () => {
  assert.strictEqual(sum(1, 2), 3);
  assert.strictEqual(sum(-1, 1), 0);
  assert.strictEqual(sum(0, 0), 0);
});

test("Funtion sum dengan angka positif dan negatid", () => {
  assert.strictEqual(sum(10, -2), 8);
});

test("Function sum dengan angka nol", () => {
  assert.strictEqual(sum(0, 5), 5);
});

test("Function sum dengan angka negatif", () => {
  assert.strictEqual(sum(-3, -2), -5);
});
=======
import { test } from "node:test";
import assert from "assert";
import { sum } from "./index.js";

test("Test Function Sum", () => {
  assert.strictEqual(sum(1, 2), 3);
  assert.strictEqual(sum(-1, 1), 0);
  assert.strictEqual(sum(0, 0), 0);
});

test("Funtion sum dengan angka positif dan negatid", () => {
  assert.strictEqual(sum(10, -2), 8);
});

test("Function sum dengan angka nol", () => {
  assert.strictEqual(sum(0, 5), 5);
});

test("Function sum dengan angka negatif", () => {
  assert.strictEqual(sum(-3, -2), -5);
});
>>>>>>> 841db8d (membuat web personal notes)
