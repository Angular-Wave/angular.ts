import { _StateDeclaration } from "./interface";
import { StateObject } from "./stateObject";
import { StateBuilder } from "./stateBuilder";
import { StateRegistryListener } from "./stateRegistry";
import { Router } from "../router";
export declare class StateQueueManager {
  private router;
  states: {
    [key: string]: StateObject;
  };
  builder: StateBuilder;
  listeners: StateRegistryListener[];
  queue: StateObject[];
  constructor(
    router: Router,
    states: {
      [key: string]: StateObject;
    },
    builder: StateBuilder,
    listeners: StateRegistryListener[],
  );
  register(stateDecl: _StateDeclaration): StateObject;
  flush(): {
    [key: string]: StateObject;
  };
  attachRoute(state: StateObject): void;
}
