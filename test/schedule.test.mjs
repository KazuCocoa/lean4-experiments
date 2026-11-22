import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE, CLOSED } from '../src/session.mjs';
import { runSchedule } from '../src/schedule.mjs';

function* schedules(length, prefix = []) {
  if (length === 0) {
    yield prefix;
    return;
  }
  for (const command of ['execute', 'close']) {
    yield* schedules(length - 1, [...prefix, command]);
  }
}

test('close/execute race: enumerate both linearizations', () => {
  const executeFirst = runSchedule(['execute', 'close']);
  const closeFirst = runSchedule(['close', 'execute']);
  assert.deepEqual(executeFirst.events.map((event) => event.accepted), [true, true]);
  assert.deepEqual(closeFirst.events.map((event) => event.accepted), [true, false]);
  assert.equal(executeFirst.state, CLOSED);
  assert.equal(closeFirst.state, CLOSED);
});

test('exhaustive schedules up to 8 operations preserve closure safety', () => {
  let examined = 0;
  for (const initialState of [ACTIVE, CLOSED]) {
    for (let length = 0; length <= 8; length++) {
      for (const commands of schedules(length)) {
        examined++;
        const result = runSchedule(commands, initialState);
        let closed = initialState === CLOSED;
        for (const event of result.events) {
          if (closed && event.command === 'execute') assert.equal(event.accepted, false);
          if (event.command === 'close') closed = true;
        }
        assert.equal(result.state, closed ? CLOSED : ACTIVE);
      }
    }
  }
  assert.equal(examined, 1022);
});

test('invalid commands are not silently interpreted as rejected requests', () => {
  assert.throws(() => runSchedule(['close', 'typo']), TypeError);
});
