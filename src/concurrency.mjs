export const OP = Object.freeze({
  BEGIN: 'beginExecute',
  CLOSE: 'requestClose',
  FINISH: 'finishExecute',
});

const allOperations = new Set(Object.values(OP));

function assertOperation(operation) {
  if (!allOperations.has(operation)) throw new TypeError('Unknown operation');
}

export function unsafeStep(phase, operation) {
  assertOperation(operation);
  switch (`${phase}:${operation}`) {
    case 'idle:beginExecute': return 'executing';
    case 'idle:requestClose': return 'closed';
    case 'executing:requestClose': return 'releasedWhileExecuting';
    case 'executing:finishExecute': return 'idle';
    case 'releasedWhileExecuting:finishExecute': return 'closed';
    default:
      if (!['idle', 'executing', 'releasedWhileExecuting', 'closed'].includes(phase)) {
        throw new TypeError('Unknown phase');
      }
      return phase;
  }
}

export function safeStep(phase, operation) {
  assertOperation(operation);
  switch (`${phase}:${operation}`) {
    case 'idle:beginExecute': return 'executing';
    case 'idle:requestClose': return 'closed';
    case 'executing:requestClose': return 'closingExecuting';
    case 'executing:finishExecute': return 'idle';
    case 'closingExecuting:finishExecute': return 'closed';
    default:
      if (!['idle', 'executing', 'closingExecuting', 'closed'].includes(phase)) {
        throw new TypeError('Unknown phase');
      }
      return phase;
  }
}

export function runSteps(step, commands, initial = 'idle') {
  let phase = initial;
  const trace = [{ phase }];
  for (const command of commands) {
    phase = step(phase, command);
    trace.push({ operation: command, phase });
  }
  return { phase, trace };
}

export const isExecuting = (phase) => phase === 'executing' || phase === 'closingExecuting';
export const isReleased = (phase) => phase === 'closed';
export const isClosing = (phase) => phase === 'closingExecuting' || phase === 'closed';
