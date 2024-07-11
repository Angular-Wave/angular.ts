export class StateQueueManager {
    constructor(stateRegistry: any, urlServiceRules: any, states: any, builder: any, listeners: any);
    stateRegistry: any;
    urlServiceRules: any;
    states: any;
    builder: any;
    listeners: any;
    queue: any[];
    register(stateDecl: any): StateObject;
    flush(): any;
    attachRoute(state: any): void;
}
import { StateObject } from "./state-object";
