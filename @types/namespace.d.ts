export { angular } from "./index.js";
import { Angular as TAngular } from "./angular.js";
import { Attributes as TAttributes } from "./core/compile/attributes.js";
import { Scope as TScope } from "./core/scope/scope.js";
import { NgModule as TNgModule } from "./core/di/ng-module.js";
import { InjectorService as TInjectorService } from "./core/di/internal-injector.js";
import {
  AnchorScrollProvider as TAnchorScrollProvider,
  AnchorScrollService as TAnchorScrollService,
} from "./services/anchor-scroll/anchor-scroll.js";
import { ControllerService as TControllerService } from "./core/controller/interface.ts";
import { ErrorHandler as TErrorHandler } from "./services/exception/interface.ts";
import { ParseService as TParseService } from "./core/parse/interface.ts";
import { TemplateRequestService as TTemplateRequestService } from "./services/template-request/interface.ts";
import { HttpParamSerializer as THttpParamSerializer } from "./services/http/interface.ts";
import { HttpParamSerializerProvider as THttpParamSerializerProvider } from "./services/http/http.js";
import {
  FilterFactory as TFilterFactory,
  FilterFn as TFilterFn,
} from "./filters/interface.ts";
import { InterpolateService as TInterpolateService } from "./core/interpolate/interface.ts";
import { InterpolateProvider as TInterpolateProvider } from "./core/interpolate/interpolate.js";
import {
  SceProvider as TSceProvider,
  SceDelegateProvider as TSceDelegateProvider,
} from "./services/sce/sce.js";
import { StateProvider as TStateProvider } from "./router/state/state-service.js";
import { HttpService as THttpService } from "./services/http/interface.ts";
import { LogService as TLogService } from "./services/log/interface.ts";
import {
  PubSubProvider as TPubSubProvider,
  PubSub as TPubSub,
} from "./services/pubsub/pubsub.js";
import {
  Directive as TDirective,
  DirectiveFactory as TDirectiveFactory,
  Component as TComponent,
  Controller as TController,
} from "./interface.ts";
import {
  SseService as TSseService,
  SseConfig as TSseConfig,
} from "./services/sse/interface.ts";
import type { ErrorHandlingConfig as TErrorHandlingConfig } from "./shared/interface.ts";
import {
  BoundTranscludeFn as TBoundTranscludeFn,
  CompileFn as TCompileFn,
  PublicLinkFn as TPublicLinkFn,
  NodeLinkFnCtx as TNodeLinkFnCtx,
  NodeLinkFn as TNodeLinkFn,
  TranscludeFn as TTranscludeFn,
  LinkFnMapping as TLinkFnMapping,
  CompositeLinkFn as TCompositeLinkFn,
} from "./core/compile/inteface.ts";
declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }
  export namespace ng {
    type Angular = TAngular;
    type Attributes = TAttributes & Record<string, any>;
    type Directive = TDirective;
    type DirectiveFactory = TDirectiveFactory;
    type Component = TComponent;
    type Controller = TController;
    type Scope = TScope;
    type NgModule = TNgModule;
    type PubSubProvider = TPubSubProvider;
    type FilterFn = TFilterFn;
    type CompositeLinkFn = TCompositeLinkFn;
    type PublicLinkFn = TPublicLinkFn;
    type NodeLinkFn = TNodeLinkFn;
    type NodeLinkFnCtx = TNodeLinkFnCtx;
    type TranscludeFn = TTranscludeFn;
    type BoundTranscludeFn = TBoundTranscludeFn;
    type LinkFnMapping = TLinkFnMapping;
    type AnchorScrollProvider = TAnchorScrollProvider;
    type InterpolateProvider = TInterpolateProvider;
    type HttpParamSerializerProvider = THttpParamSerializerProvider;
    type SceProvider = TSceProvider;
    type SceDelegateProvider = TSceDelegateProvider;
    type AnchorScrollService = TAnchorScrollService;
    type CompileService = TCompileFn;
    type ControllerService = TControllerService;
    type ExceptionHandlerService = TErrorHandler;
    type FilterService = TFilterFactory;
    type HttpParamSerializerSerService = THttpParamSerializer;
    type HttpService = THttpService;
    type InterpolateService = TInterpolateService;
    type InjectorService = TInjectorService;
    type LogService = TLogService;
    type ParseService = TParseService;
    type PubSubService = TPubSub;
    type RootElementService = Element;
    type RootScopeService = TScope;
    type StateService = TStateProvider;
    type SseService = TSseService;
    type SseConfig = TSseConfig;
    type TemplateCacheService = Map<string, string>;
    type TemplateRequestService = TTemplateRequestService;
    type ErrorHandlingConfig = TErrorHandlingConfig;
    type WindowService = Window;
    type DocumentService = Document;
  }
}
