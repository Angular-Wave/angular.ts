/**
 * *
 */
export type TransitionHookPhase = number;
export namespace TransitionHookPhase {
    let CREATE: number;
    let BEFORE: number;
    let RUN: number;
    let SUCCESS: number;
    let ERROR: number;
}
export namespace TransitionHookScope {
    let TRANSITION: number;
    let STATE: number;
}
