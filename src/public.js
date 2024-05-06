import { $CompileProvider } from "./ng/compile";
import { $$jqLiteProvider } from "./jqLite";
import { htmlAnchorDirective } from "./ng/directive/a";
import {
  inputDirective,
  ngValueDirective,
  hiddenInputBrowserCacheDirective,
} from "./ng/directive/input";
import { formDirective, ngFormDirective } from "./ng/directive/form";
import { scriptDirective } from "./ng/directive/script";
import { selectDirective, optionDirective } from "./ng/directive/select";
import {
  ngBindDirective,
  ngBindHtmlDirective,
  ngBindTemplateDirective,
} from "./ng/directive/ngBind";
import {
  ngClassDirective,
  ngClassEvenDirective,
  ngClassOddDirective,
} from "./ng/directive/ngClass";
import { ngCloakDirective } from "./ng/directive/ngCloak";
import { ngControllerDirective } from "./ng/directive/ngController";
import { ngHideDirective, ngShowDirective } from "./ng/directive/ngShowHide";
import { ngIfDirective } from "./ng/directive/ngIf";
import {
  ngIncludeDirective,
  ngIncludeFillContentDirective,
} from "./ng/directive/ngInclude";
import { ngInitDirective } from "./ng/directive/ngInit";
import { ngNonBindableDirective } from "./ng/directive/ngNonBindable";
import { ngRefDirective } from "./ng/directive/ngRef";
import { ngRepeatDirective } from "./ng/directive/ngRepeat";
import { ngStyleDirective } from "./ng/directive/ngStyle";
import {
  ngSwitchDirective,
  ngSwitchWhenDirective,
  ngSwitchDefaultDirective,
} from "./ng/directive/ngSwitch";
import { ngOptionsDirective } from "./ng/directive/ngOptions";
import { ngTranscludeDirective } from "./ng/directive/ngTransclude";
import { ngModelDirective } from "./ng/directive/ngModel";
import { ngListDirective } from "./ng/directive/ngList";
import { ngChangeDirective } from "./ng/directive/ngChange";
import {
  maxlengthDirective,
  minlengthDirective,
  patternDirective,
  requiredDirective,
} from "./ng/directive/validators";
import { ngModelOptionsDirective } from "./ng/directive/ngModelOptions";
import { ngAttributeAliasDirectives } from "./ng/directive/attrs";
import { ngEventDirectives } from "./ng/directive/ngEventDirs";
import { AnchorScrollProvider } from "./ng/anchorScroll";
import {
  AnimateProvider,
  CoreAnimateJsProvider,
  CoreAnimateQueueProvider,
} from "./ng/animate";
import { BrowserProvider } from "./ng/browser";
import { CoreAnimateCssProvider } from "./ng/animateCss";
import { CookieReaderProvider } from "./ng/cookieReader";
import {
  AnimateAsyncRunFactoryProvider,
  AnimateRunnerFactoryProvider,
} from "./ng/animateRunner";
import { CacheFactoryProvider, TemplateCacheProvider } from "./ng/cacheFactory";
import { $ControllerProvider } from "./ng/controller";
import { $DocumentProvider, $$IsDocumentHiddenProvider } from "./ng/document";
import { $ExceptionHandlerProvider } from "./ng/exceptionHandler";
import { $FilterProvider } from "./ng/filter";
import { $IntervalProvider } from "./ng/interval";
import { $InterpolateProvider } from "./ng/interpolate";
import { $$IntervalFactoryProvider } from "./ng/intervalFactory";
import { $$ForceReflowProvider } from "./ng/forceReflow";
import {
  $HttpProvider,
  $HttpParamSerializerProvider,
  $HttpParamSerializerJQLikeProvider,
} from "./ng/http";
import { $HttpBackendProvider, $xhrFactoryProvider } from "./ng/httpBackend";
import { $LocationProvider } from "./ng/location";
import { $LogProvider } from "./ng/log";
import { $ParseProvider } from "./ng/parse";
import { $RootScopeProvider } from "./ng/rootScope";
import { $QProvider, $$QProvider } from "./ng/q";
import { $SceProvider, $SceDelegateProvider } from "./ng/sce";
import { $$TaskTrackerFactoryProvider } from "./ng/taskTrackerFactory";
import { TemplateRequestProvider } from "./ng/templateRequest";
import { $TimeoutProvider } from "./ng/timeout";
import { SanitizeUriProvider } from "./ng/sanitizeUri";
import { $SanitizeProvider } from "./ngSanitize/sanitize";
import { setupModuleLoader } from "./loader";
import { initAnimateModule } from "./ngAnimate/module";
import { initMessageModule } from "./ngMessages/messages";

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

  module("ngSanitize", []).provider("$sanitize", $SanitizeProvider);

  initAnimateModule();
  initMessageModule();

  return ng;
}
