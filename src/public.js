import { $CompileProvider } from "./core/compile";
import { $$jqLiteProvider } from "./jqLite";
import { htmlAnchorDirective } from "./directive/a";
import {
  inputDirective,
  ngValueDirective,
  hiddenInputBrowserCacheDirective,
} from "./directive/input";
import { formDirective, ngFormDirective } from "./directive/form";
import { scriptDirective } from "./directive/script";
import { selectDirective, optionDirective } from "./directive/select";
import {
  ngBindDirective,
  ngBindHtmlDirective,
  ngBindTemplateDirective,
} from "./directive/ngBind";
import {
  ngClassDirective,
  ngClassEvenDirective,
  ngClassOddDirective,
} from "./directive/ngClass";
import { ngCloakDirective } from "./directive/cloak";
import { ngControllerDirective } from "./directive/ngController";
import { ngHideDirective, ngShowDirective } from "./directive/ngShowHide";
import { ngIfDirective } from "./directive/ngIf";
import {
  ngIncludeDirective,
  ngIncludeFillContentDirective,
} from "./directive/ngInclude";
import { ngInitDirective } from "./directive/init";
import { ngNonBindableDirective } from "./directive/non-bindable";
import { ngRefDirective } from "./directive/ngRef";
import { ngRepeatDirective } from "./directive/ngRepeat";
import { ngStyleDirective } from "./directive/style";
import {
  ngSwitchDirective,
  ngSwitchWhenDirective,
  ngSwitchDefaultDirective,
} from "./directive/ngSwitch";
import { ngOptionsDirective } from "./directive/ngOptions";
import { ngTranscludeDirective } from "./directive/ngTransclude";
import { ngModelDirective } from "./directive/ngModel";
import { ngListDirective } from "./directive/list";
import { ngChangeDirective } from "./directive/ngChange";
import {
  maxlengthDirective,
  minlengthDirective,
  patternDirective,
  requiredDirective,
} from "./directive/validators";
import { ngModelOptionsDirective } from "./directive/ngModelOptions";
import { ngAttributeAliasDirectives } from "./directive/attrs";
import { ngEventDirectives } from "./directive/ngEventDirs";
import { AnchorScrollProvider } from "./services/anchorScroll";
import {
  AnimateProvider,
  CoreAnimateJsProvider,
  CoreAnimateQueueProvider,
} from "./core/animate";
import { BrowserProvider } from "./services/browser";
import { CoreAnimateCssProvider } from "./core/animateCss";
import { CookieReaderProvider } from "./services/cookieReader";
import {
  AnimateAsyncRunFactoryProvider,
  AnimateRunnerFactoryProvider,
} from "./core/animateRunner";
import {
  CacheFactoryProvider,
  TemplateCacheProvider,
} from "./services/cacheFactory";
import { $ControllerProvider } from "./core/controller";
import {
  $DocumentProvider,
  $$IsDocumentHiddenProvider,
} from "./services/document";
import { $ExceptionHandlerProvider } from "./core/exceptionHandler";
import { $FilterProvider } from "./core/filter";
import { $IntervalProvider } from "./core/interval";
import { $InterpolateProvider } from "./core/interpolate";
import { $$IntervalFactoryProvider } from "./core/intervalFactory";
import { $$ForceReflowProvider } from "./core/forceReflow";
import {
  $HttpProvider,
  $HttpParamSerializerProvider,
  $HttpParamSerializerJQLikeProvider,
} from "./services/http";
import {
  $HttpBackendProvider,
  $xhrFactoryProvider,
} from "./services/httpBackend";
import { $LocationProvider } from "./core/location";
import { $LogProvider } from "./services/log";
import { $ParseProvider } from "./core/parser/parse";
import { $RootScopeProvider } from "./core/rootScope";
import { $QProvider, $$QProvider } from "./core/q";
import { $SceProvider, $SceDelegateProvider } from "./core/sce";
import { $$TaskTrackerFactoryProvider } from "./core/taskTrackerFactory";
import { TemplateRequestProvider } from "./services/templateRequest";
import { $TimeoutProvider } from "./core/timeout";
import { SanitizeUriProvider } from "./core/sanitizeUri";
import { setupModuleLoader } from "./loader";
import { initAnimateModule } from "./animations/module";
import { initMessageModule } from "./exts/messages";
import { initAriaModule } from "./exts/aria";

export function publishExternalAPI() {
  const module = setupModuleLoader(window);
  const ng = module(
    "ng",
    [],
    [
      "$provide",
      function ngModule($provide) {
        // $$sanitizeUriProvider needs to be before $compileProvider as it is used by it.
        $provide.provider({
          $$sanitizeUri: SanitizeUriProvider,
        });
        $provide
          .provider("$compile", $CompileProvider)
          .directive({
            a: htmlAnchorDirective,
            input: inputDirective,
            textarea: inputDirective,
            form: formDirective,
            script: scriptDirective,
            select: selectDirective,
            option: optionDirective,
            ngBind: ngBindDirective,
            ngBindHtml: ngBindHtmlDirective,
            ngBindTemplate: ngBindTemplateDirective,
            ngClass: ngClassDirective,
            ngClassEven: ngClassEvenDirective,
            ngClassOdd: ngClassOddDirective,
            ngCloak: ngCloakDirective,
            ngController: ngControllerDirective,
            ngForm: ngFormDirective,
            ngHide: ngHideDirective,
            ngIf: ngIfDirective,
            ngInclude: ngIncludeDirective,
            ngInit: ngInitDirective,
            ngNonBindable: ngNonBindableDirective,
            ngRef: ngRefDirective,
            ngRepeat: ngRepeatDirective,
            ngShow: ngShowDirective,
            ngStyle: ngStyleDirective,
            ngSwitch: ngSwitchDirective,
            ngSwitchWhen: ngSwitchWhenDirective,
            ngSwitchDefault: ngSwitchDefaultDirective,
            ngOptions: ngOptionsDirective,
            ngTransclude: ngTranscludeDirective,
            ngModel: ngModelDirective,
            ngList: ngListDirective,
            ngChange: ngChangeDirective,
            pattern: patternDirective,
            ngPattern: patternDirective,
            required: requiredDirective,
            ngRequired: requiredDirective,
            ngMinlength: minlengthDirective,
            minlength: minlengthDirective,
            ngMaxlength: maxlengthDirective,
            maxlength: maxlengthDirective,
            ngValue: ngValueDirective,
            ngModelOptions: ngModelOptionsDirective,
          })
          .directive({
            ngInclude: ngIncludeFillContentDirective,
            input: hiddenInputBrowserCacheDirective,
          })
          .directive(ngAttributeAliasDirectives)
          .directive(ngEventDirectives);
        $provide.provider({
          $anchorScroll: AnchorScrollProvider,
          $animate: AnimateProvider,
          $animateCss: CoreAnimateCssProvider,
          $$animateJs: CoreAnimateJsProvider,
          $$animateQueue: CoreAnimateQueueProvider,
          $$AnimateRunner: AnimateRunnerFactoryProvider,
          $$animateAsyncRun: AnimateAsyncRunFactoryProvider,
          $browser: BrowserProvider,
          $cacheFactory: CacheFactoryProvider,
          $controller: $ControllerProvider,
          $document: $DocumentProvider,
          $$isDocumentHidden: $$IsDocumentHiddenProvider,
          $exceptionHandler: $ExceptionHandlerProvider,
          $filter: $FilterProvider,
          $$forceReflow: $$ForceReflowProvider,
          $interpolate: $InterpolateProvider,
          $interval: $IntervalProvider,
          $$intervalFactory: $$IntervalFactoryProvider,
          $http: $HttpProvider,
          $httpParamSerializer: $HttpParamSerializerProvider,
          $httpParamSerializerJQLike: $HttpParamSerializerJQLikeProvider,
          $httpBackend: $HttpBackendProvider,
          $xhrFactory: $xhrFactoryProvider,
          $location: $LocationProvider,
          $log: $LogProvider,
          $parse: $ParseProvider,
          $$jqLite: $$jqLiteProvider,
          $rootScope: $RootScopeProvider,
          $q: $QProvider,
          $$q: $$QProvider,
          $sce: $SceProvider,
          $sceDelegate: $SceDelegateProvider,
          $$taskTrackerFactory: $$TaskTrackerFactoryProvider,
          $templateCache: TemplateCacheProvider,
          $templateRequest: TemplateRequestProvider,
          $timeout: $TimeoutProvider,
          $$cookieReader: CookieReaderProvider,
        });
      },
    ],
  ).info({ angularVersion: '"NG_VERSION_FULL"' });

  initAnimateModule();
  initMessageModule();
  initAriaModule();

  return ng;
}
