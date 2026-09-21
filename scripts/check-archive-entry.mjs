import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArchiveEntry, ARRAY_ENTRY_END } from '../src/archive-entry.ts';

test('early skip plays the array sequence and stops before detail extraction', () => {
  const entry = new ArchiveEntry(1.76, 100);
  assert.equal(entry.time, 21.9);
  for (let i = 1; i <= 150; i++) entry.advance(100 + i / 60);
  assert.equal(entry.time, ARRAY_ENTRY_END);
  assert.equal(entry.finished, true);
  assert.ok(entry.time < 27.55);
});
test('skip during array reveal continues from the currently shown frame', () => {
  const entry = new ArchiveEntry(24.2, 100);
  assert.equal(entry.time, 24.2);
  assert.ok(entry.advance(100 + 1 / 60) > 24.2);
});
test('background pause cannot fast-forward across the unfolding motion', () => {
  const entry = new ArchiveEntry(21.9, 100);
  assert.ok(entry.advance(130) < 22.01);
  assert.equal(entry.finished, false);
});
test('entry never restarts an already completed array sequence', () => {
  const entry = new ArchiveEntry(34, 100);
  assert.equal(entry.finished, true);
  assert.equal(entry.time, ARRAY_ENTRY_END);
});

test('direct archive entry waits until the loading fade ends', () => {
  const entry = new ArchiveEntry(1.76, 100.6);
  entry.advance(100.1);
  assert.equal(entry.advance(100.5), 21.9);
  assert.ok(entry.advance(100.62) > 21.9);
});
