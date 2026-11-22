import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE, CLOSED, transition } from '../src/session.mjs';

test('closed session rejects execution', () => {
  assert.equal(transition(CLOSED, 'execute'), null);
});
test('close is idempotent for both states', () => {
  for (const state of [ACTIVE, CLOSED]) {
    assert.equal(transition(transition(state, 'close'), 'close'), transition(state, 'close'));
  }
});
test('close always returns closed', () => {
  for (const state of [ACTIVE, CLOSED]) assert.equal(transition(state, 'close'), CLOSED);
});
test('execution preserves an active session', () => {
  assert.equal(transition(ACTIVE, 'execute'), ACTIVE);
});
test('invalid inputs are rejected', () => {
  assert.throws(() => transition('unknown', 'execute'), TypeError);
});
