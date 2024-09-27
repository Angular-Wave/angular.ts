export class StateQueueManager {
    /**
     * @param {import("./state-registry.js").StateRegistryProvider} stateRegistry
     * @param {*} urlServiceRules
     * @param {*} states
     * @param {*} builder
     * @param {*} listeners
     */
    constructor(stateRegistry: import("./state-registry.js").StateRegistryProvider, urlServiceRules: any, states: any, builder: any, listeners: any);
    stateRegistry: import("./state-registry.js").StateRegistryProvider;
    urlServiceRules: any;
    states: any;
    builder: any;
    listeners: any;
    /**
     * @type {Array<StateObject>}
     */
    queue: Array<StateObject>;
    register(stateDecl: any): StateObject;
    flush(): any;
    attachRoute(state: any): void;
}
import { StateObject } from "./state-object";
