<<<<<<< HEAD
import test from "node:test";
import assert from "node:assert";
import sum from "./index.js";

test("Menjumlahkan 2 angka positif", () => {
  assert.strictEqual(sum(2, 3), 5);
  assert.strictEqual(sum(10, 20), 30);
});

test("Menjumlahkan 2 angka negatif", () => {
  assert.strictEqual(sum(-2, -3), 0);
  assert.strictEqual(sum(-10, -20), 0);
});

test("Menjumlahkan angka positif dan negatif", () => {
  assert.strictEqual(sum(5, -3), 0);
  assert.strictEqual(sum(-10, 20), 0);
});

test("Menjumlakan dengan nol", () => {
  assert.strictEqual(sum(0, 0), 0);
  assert.strictEqual(sum(0, 5), 5);
  assert.strictEqual(sum(5, 0), 5);
});
=======
import test from "node:test";
import assert from "node:assert";
import sum from "./index.js";

test("Menjumlahkan 2 angka positif", () => {
  assert.strictEqual(sum(2, 3), 5);
  assert.strictEqual(sum(10, 20), 30);
});

test("Menjumlahkan 2 angka negatif", () => {
  assert.strictEqual(sum(-2, -3), 0);
  assert.strictEqual(sum(-10, -20), 0);
});

test("Menjumlahkan angka positif dan negatif", () => {
  assert.strictEqual(sum(5, -3), 0);
  assert.strictEqual(sum(-10, 20), 0);
});

test("Menjumlakan dengan nol", () => {
  assert.strictEqual(sum(0, 0), 0);
  assert.strictEqual(sum(0, 5), 5);
  assert.strictEqual(sum(5, 0), 5);
});
>>>>>>> 841db8d (membuat web personal notes)
