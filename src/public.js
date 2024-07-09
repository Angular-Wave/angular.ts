import { $CompileProvider } from "./core/compile";
import {
  inputDirective,
  ngValueDirective,
  hiddenInputBrowserCacheDirective,
} from "./directive/input/input";
import { formDirective, ngFormDirective } from "./directive/form/form";
import { scriptDirective } from "./directive/script/script";
import { selectDirective, optionDirective } from "./directive/select/select";
import {
  ngBindDirective,
  ngBindHtmlDirective,
  ngBindTemplateDirective,
} from "./directive/bind/bind";
import {
  ngClassDirective,
  ngClassEvenDirective,
  ngClassOddDirective,
} from "./directive/class/class";
import { ngCloakDirective } from "./directive/cloak/cloak";
import { ngControllerDirective } from "./directive/controller/controller";
import {
  ngHideDirective,
  ngShowDirective,
} from "./directive/show-hide/show-hide";
import { ngIfDirective } from "./directive/if/if";
import {
  ngIncludeDirective,
  ngIncludeFillContentDirective,
} from "./directive/include/include";
import { ngInitDirective } from "./directive/init/init";
import { ngNonBindableDirective } from "./directive/non-bindable/non-bindable";
import { ngRefDirective } from "./directive/ref/ref";
import { ngRepeatDirective } from "./directive/repeat/repeat";
import { ngStyleDirective } from "./directive/style/style";
import {
  ngSwitchDirective,
  ngSwitchWhenDirective,
  ngSwitchDefaultDirective,
} from "./directive/switch/switch";
import { ngOptionsDirective } from "./directive/options/options";
import { ngTranscludeDirective } from "./directive/transclude/transclude";
import { ngModelDirective } from "./directive/model/model";
import { ngListDirective } from "./directive/list/list";
import { ngChangeDirective } from "./directive/change/change";
import {
  maxlengthDirective,
  minlengthDirective,
  patternDirective,
  requiredDirective,
} from "./directive/validators/validators";
import { ngModelOptionsDirective } from "./directive/model-options/model-options";
import { ngAttributeAliasDirectives } from "./directive/attrs/attrs";
import { ngEventDirectives } from "./directive/events/events";
import { AnchorScrollProvider } from "./services/anchor-scroll";
import {
  AnimateProvider,
  CoreAnimateJsProvider,
  CoreAnimateQueueProvider,
} from "./core/animate";
import { BrowserProvider } from "./services/browser";
import { CoreAnimateCssProvider } from "./core/animate-css";
import { CookieReaderProvider } from "./services/cookie-reader";
import {
  AnimateAsyncRunFactoryProvider,
  AnimateRunnerFactoryProvider,
} from "./core/animate-runner";
import {
  CacheFactoryProvider,
  TemplateCacheProvider,
} from "./services/cache-factory";
import { $ControllerProvider } from "./core/controller";
import {
  $DocumentProvider,
  $$IsDocumentHiddenProvider,
} from "./services/document";
import { $ExceptionHandlerProvider } from "./core/exception-handler";
import { $FilterProvider } from "./core/filter";
import { $IntervalProvider } from "./core/interval";
import { $InterpolateProvider } from "./core/interpolate";
import { $$IntervalFactoryProvider } from "./core/interval-factory";
import {
  $HttpProvider,
  $HttpParamSerializerProvider,
  $HttpParamSerializerJQLikeProvider,
} from "./services/http";
import {
  $HttpBackendProvider,
  $xhrFactoryProvider,
} from "./services/http-backend";
import { $LocationProvider } from "./core/location";
import { $LogProvider } from "./services/log";
import { $ParseProvider } from "./core/parser/parse";
import { $RootScopeProvider } from "./core/root-scope";
import { $QProvider, $$QProvider } from "./core/q";
import { $SceProvider, $SceDelegateProvider } from "./core/sce";
import { $$TaskTrackerFactoryProvider } from "./core/task-tracker-factory";
import { TemplateRequestProvider } from "./services/template-request";
import { $TimeoutProvider } from "./core/timeout";
import { SanitizeUriProvider } from "./core/sanitize-uri";
import { setupModuleLoader } from "./loader";
import { initAnimateModule } from "./animations/module";
import { initMessageModule } from "./exts/messages";
import { initAriaModule } from "./exts/aria";
import { initRouter } from "./router/index";

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
  initRouter();

  return ng;
}
