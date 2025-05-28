/**
 * This class defines a type of hook, such as `onBefore` or `onEnter`.
 * Plugins can define custom hook types, such as sticky states does for `onInactive`.
 */
export class TransitionEventType {
    constructor(name: any, hookPhase: any, hookOrder: any, criteriaMatchPath: any, reverseSort?: boolean, getResultHandler?: any, getErrorHandler?: any, synchronous?: boolean);
    name: any;
    hookPhase: any;
    hookOrder: any;
    criteriaMatchPath: any;
    reverseSort: boolean;
    getResultHandler: any;
    getErrorHandler: any;
    synchronous: boolean;
}
