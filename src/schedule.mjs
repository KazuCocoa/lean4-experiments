import { ACTIVE, CLOSED, transition } from './session.mjs';

/**
 * Evaluate an explicit linearization of atomic requests.
 * A rejected execute is recorded but does not change the session state.
 * This is a sequential model, NOT a real locking/atomicity implementation.
 */
export function runSchedule(commands, initialState = ACTIVE) {
  if (initialState !== ACTIVE && initialState !== CLOSED) {
    throw new TypeError('Unknown initial state');
  }
  let state = initialState;
  const events = [];
  for (const command of commands) {
    const nextState = transition(state, command);
    events.push({ command, accepted: nextState !== null, stateBefore: state });
    if (nextState !== null) state = nextState;
  }
  return { state, events };
}
