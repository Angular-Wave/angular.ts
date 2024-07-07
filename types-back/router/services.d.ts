import { IRootScopeService } from "../";
import { ResolveContext, TypedMap } from "./core";
import { StateProvider } from "./stateProvider";
declare module "./core/lib/router" {
  interface Router {
    /** @hidden */
    stateProvider: StateProvider;
  }
}
export declare function watchDigests($rootScope: IRootScopeService): void;
export declare namespace watchDigests {
  var $inject: string[];
}
/** @hidden TODO: find a place to move this */
export declare const getLocals: (ctx: ResolveContext) => TypedMap<any>;
