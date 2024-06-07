import { IRootScopeService } from '../';
import { ResolveContext, TypedMap } from './core';
import { StateProvider } from './stateProvider';
import { UrlRouterProvider } from './urlRouterProvider';
declare module './core/lib/router' {
    interface UIRouter {
        /** @hidden */
        stateProvider: StateProvider;
        /** @hidden */
        urlRouterProvider: UrlRouterProvider;
    }
}
export declare function watchDigests($rootScope: IRootScopeService): void;
export declare namespace watchDigests {
    var $inject: string[];
}
/** @hidden TODO: find a place to move this */
export declare const getLocals: (ctx: ResolveContext) => TypedMap<any>;
