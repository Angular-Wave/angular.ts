/**
 * Main entry point for angular 1.x build
 */ /** */
export * from "./interface";
export * from "./services";
export * from "./statebuilders/views";
export * from "./stateProvider";
import "./injectables";
import "./directives/stateDirectives";
import "./stateFilters";
import "./directives/viewDirective";
import "./viewScroll";
declare const _default: "router";
export default _default;
import * as core from "./core/index";
export { core };
export * from "./core/index";
