export { angular } from "./index.js";
import {
  AnchorScrollProvider,
  AnchorScrollService as TAnchorScrollService,
} from "./services/anchor-scroll/anchor-scroll.js";
import { ControllerService as TControllerService } from "./core/controller/interface.ts";
import { ErrorHandler } from "./services/exception/interface.ts";
import { Angular } from "./angular.js";
import { Attributes } from "./core/compile/attributes.js";
import { Scope } from "./core/scope/scope.js";
import { NgModule } from "./core/di/ng-module.js";
import { PubSubProvider, PubSub } from "./services/pubsub/pubsub.js";
import type { ErrorHandlingConfig as TErrorHandlingConfig } from "./shared/interface.ts";
import { InjectorService } from "./core/di/internal-injector.js";
import { CompileFn } from "./core/compile/compile.js";
import { ParseService as TParseService } from "./core/parse/interface.ts";
import { TemplateRequestService as TTemplateRequestService } from "./services/template-request/interface.ts";
import { HttpParamSerializer } from "./services/http/interface.ts";
import { HttpParamSerializerProvider } from "./services/http/http.js";
import { FilterFactory, FilterFn as TFilterFn } from "./filters/interface.ts";
import { InterpolateService as TInterpolateService } from "./core/interpolate/interface.ts";
import { InterpolateProvider } from "./core/interpolate/interpolate.js";
import { SceDelegateProvider, SceProvider } from "./services/sce/sce.js";
import {
  Directive as TDirective,
  DirectiveFactory as TDirectiveFactory,
  Component as TComponent,
  Controller as TController,
} from "./interface.ts";
import { StateProvider } from "./router/state/state-service.js";
import { HttpService as THttpService } from "./services/http/interface.ts";
import { LogService as TLogService } from "./services/log/interface.ts";
declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }
  namespace ng {
    type Angular = InstanceType<typeof Angular>;
    type Attributes = InstanceType<typeof Attributes>;
    type Directive = TDirective;
    type DirectiveFactory = TDirectiveFactory;
    type Component = TComponent;
    type Controller = TController;
    type Scope = InstanceType<typeof Scope>;
    type NgModule = InstanceType<typeof NgModule>;
    type PubSubProvider = InstanceType<typeof PubSubProvider>;
    type FilterFn = TFilterFn;
    type AnchorScrollProvider = InstanceType<typeof AnchorScrollProvider>;
    type InterpolateProvider = InstanceType<typeof InterpolateProvider>;
    type HttpParamSerializerProvider = InstanceType<
      typeof HttpParamSerializerProvider
    >;
    type SceProvider = InstanceType<typeof SceProvider>;
    type SceDelegateProvider = InstanceType<typeof SceDelegateProvider>;
    type AnchorScrollService = TAnchorScrollService;
    type CompileService = CompileFn;
    type ControllerService = TControllerService;
    type ExceptionHandlerService = ErrorHandler;
    type FilterService = FilterFactory;
    type HttpParamSerializerSerService = HttpParamSerializer;
    type HttpService = THttpService;
    type InterpolateService = TInterpolateService;
    type InjectorService = InstanceType<typeof InjectorService>;
    type LogService = TLogService;
    type ParseService = TParseService;
    type PubSubService = InstanceType<typeof PubSub>;
    type RootElementService = Element;
    type RootScopeService = InstanceType<typeof Scope>;
    type StateService = InstanceType<typeof StateProvider>;
    type TemplateCacheService = InstanceType<typeof Map<string, string>>;
    type TemplateRequestService = TTemplateRequestService;
    type ErrorHandlingConfig = TErrorHandlingConfig;
    type WindowService = Window;
    type DocumentService = Document;
  }
}
