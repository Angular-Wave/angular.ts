export class StateMatcher {
    constructor(_states: any);
    _states: any;
    isRelative(stateName: any): boolean;
    find(stateOrName: any, base: any, matchGlob?: boolean): any;
    resolvePath(name: any, base: any): string;
}
