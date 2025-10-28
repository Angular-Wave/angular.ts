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

/* ────────────────────────────────────────────────
   Runtime global initialization
──────────────────────────────────────────────── */
if (typeof globalThis.ng === "undefined") {
  (globalThis as any).ng = {};
}

declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }

  export namespace ng {
    // Core types (docs preserved)
    export type Angular = TAngular;
    export type Attributes = TAttributes;
    export type Directive = TDirective;
    export type DirectiveFactory = TDirectiveFactory;
    export type Component = TComponent;
    export type Controller = TController;
    export type Scope = TScope;
    export type NgModule = TNgModule;
    export type PubSubProvider = TPubSubProvider;
    export type FilterFn = TFilterFn;

    export type CompositeLinkFn = TCompositeLinkFn;
    export type PublicLinkFn = TPublicLinkFn;
    export type NodeLinkFn = TNodeLinkFn;
    export type NodeLinkFnCtx = TNodeLinkFnCtx;
    export type TranscludeFn = TTranscludeFn;
    export type BoundTranscludeFn = TBoundTranscludeFn;
    export type LinkFnMapping = TLinkFnMapping;

    // Providers
    export type AnchorScrollProvider = TAnchorScrollProvider;
    export type InterpolateProvider = TInterpolateProvider;
    export type HttpParamSerializerProvider = THttpParamSerializerProvider;
    export type SceProvider = TSceProvider;
    export type SceDelegateProvider = TSceDelegateProvider;

    // Services
    export type AnchorScrollService = TAnchorScrollService;
    export type CompileService = TCompileFn;
    export type ControllerService = TControllerService;
    export type ExceptionHandlerService = TErrorHandler;
    export type FilterService = TFilterFactory;
    export type HttpParamSerializerSerService = THttpParamSerializer;
    export type HttpService = THttpService;
    export type InterpolateService = TInterpolateService;
    export type InjectorService = TInjectorService;
    export type LogService = TLogService;
    export type ParseService = TParseService;
    export type PubSubService = TPubSub;
    export type RootElementService = Element;
    export type RootScopeService = TScope;
    export type StateService = TStateProvider;
    export type SseService = TSseService;
    export type SseConfig = TSseConfig;
    export type TemplateCacheService = Map<string, string>;
    export type TemplateRequestService = TTemplateRequestService;

    // Support types
    export type ErrorHandlingConfig = TErrorHandlingConfig;
    export type WindowService = Window;
    export type DocumentService = Document;
  }
}
