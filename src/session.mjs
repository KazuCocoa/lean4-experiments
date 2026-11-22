export const ACTIVE = 'active';
export const CLOSED = 'closed';

export function transition(state, command) {
  if (state === ACTIVE && command === 'execute') return ACTIVE;
  if (command === 'close' && (state === ACTIVE || state === CLOSED)) return CLOSED;
  if (state === CLOSED && command === 'execute') return null;
  throw new TypeError('Unknown state or command');
}
