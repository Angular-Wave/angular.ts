/**
 * An object for Transition Hook Phases
 * @enum {number}
 * @readonly
 */
export const TransitionHookPhase = {
  CREATE: 0,
  BEFORE: 1,
  RUN: 2,
  SUCCESS: 3,
  ERROR: 4,
};

/** An object for Transition Hook Scopes */
export const TransitionHookScope = {
  TRANSITION: 0,
  STATE: 1,
};
