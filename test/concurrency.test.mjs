import test from 'node:test';
import assert from 'node:assert/strict';
import { OP, unsafeStep, safeStep, runSteps, isExecuting, isReleased, isClosing } from '../src/concurrency.mjs';

const ops = Object.values(OP);

function* sequences(length, prefix = []) {
  if (length === 0) { yield prefix; return; }
  for (const op of ops) yield* sequences(length - 1, [...prefix, op]);
}

test('unsafe schedule: close releases resources while execute is in flight', () => {
  const result = runSteps(unsafeStep, [OP.BEGIN, OP.CLOSE]);
  assert.equal(result.phase, 'releasedWhileExecuting');
});

test('safe schedule: close defers release until finish', () => {
  const result = runSteps(safeStep, [OP.BEGIN, OP.CLOSE, OP.BEGIN, OP.FINISH]);
  assert.deepEqual(result.trace.map((entry) => entry.phase), [
    'idle', 'executing', 'closingExecuting', 'closingExecuting', 'closed',
  ]);
});

test('all schedules up to length 7 preserve safety and do not reopen after close', () => {
  let examined = 0;
  for (const initial of ['idle', 'executing', 'closingExecuting', 'closed']) {
    for (let length = 0; length <= 7; length++) {
      for (const schedule of sequences(length)) {
        examined++;
        const { trace } = runSteps(safeStep, schedule, initial);
        let closing = isClosing(initial);
        for (const entry of trace) {
          assert.equal(isExecuting(entry.phase) && isReleased(entry.phase), false);
          if (closing) assert.equal(isClosing(entry.phase), true);
          if (entry.operation === OP.CLOSE) closing = true;
        }
      }
    }
  }
  assert.equal(examined, 13120);
});

test('invalid operation is rejected', () => {
  assert.throws(() => safeStep('idle', 'unknown'), TypeError);
});
