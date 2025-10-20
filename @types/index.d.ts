import { AnchorScrollService as TAnchorScrollService } from "./services/anchor-scroll/anchor-scroll.js";
import { ControllerService as TControllerService } from "./core/controller/interface.ts";
import { ErrorHandler } from "./services/exception/interface.ts";
export * from "./services/http/interface.ts";
export * from "./services/log/interface.ts";
export * from "./services/log/log.js";
export * from "./services/location/interface.ts";
export * from "./services/location/location.js";
export * from "./services/pubsub/pubsub.js";
export * from "./services/template-cache/interface.ts";
export * from "./services/template-cache/template-cache.js";
export * from "./index.js";
import { Angular } from "./angular.js";
import { Attributes } from "./core/compile/attributes.js";
import { Scope } from "./core/scope/scope.js";
import { NgModule } from "./core/di/ng-module.js";
import { PubSubProvider, PubSub } from "./services/pubsub/pubsub.js";
import type { ErrorHandlingConfig as TErrorHandlingConfig } from "./shared/interface.ts";
import { InjectorService } from "./core/di/internal-injector.js";
import { CompileFn } from "./core/compile/compile.js";
import { FilterFactory, HttpService as THttpService } from "./interface.ts";
import { ParseService as TParseService } from "./core/parse/interface.ts";
declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }
  namespace ng {
    type Angular = InstanceType<typeof Angular>;
    type Attributes = InstanceType<typeof Attributes>;
    type Scope = InstanceType<typeof Scope>;
    type NgModule = InstanceType<typeof NgModule>;
    type PubSubProvider = InstanceType<typeof PubSubProvider>;
    type AnchorScrollService = TAnchorScrollService;
    type CompileService = CompileFn;
    type ControllerService = TControllerService;
    type ExceptionHandlerService = ErrorHandler;
    type FilterService = FilterFactory;
    type HttpService = THttpService;
    type InjectorService = InstanceType<typeof InjectorService>;
    type ParseService = TParseService;
    type PubSubService = InstanceType<typeof PubSub>;
    type RootElementService = Element;
    type RootScopeService = InstanceType<typeof Scope>;
    type ErrorHandlingConfig = TErrorHandlingConfig;
  }
}
