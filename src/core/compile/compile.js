import {
  createElementFromHTML,
  createNodelistFromHTML,
  emptyElement,
  getBooleanAttrName,
  getCacheData,
  getInheritedData,
  isTextNode,
  setCacheData,
  setIsolateScope,
  setScope,
  startingTag,
} from "../../shared/dom.js";
import { NodeRef } from "../../shared/noderef.js";
import { identifierForController } from "../controller/controller.js";
import {
  minErr,
  assertArg,
  assertNotHasOwnProperty,
  isDefined,
  isFunction,
  isObject,
  isString,
  lowercase,
  extend,
  isScope,
  inherit,
  isUndefined,
  getNodeName,
  bind,
  trim,
  isBoolean,
  equals,
  simpleCompare,
  isError,
  directiveNormalize,
  isProxy,
  hasOwn,
} from "../../shared/utils.js";
import { SCE_CONTEXTS } from "../sce/sce.js";
import { PREFIX_REGEXP } from "../../shared/constants.js";
import { createEventDirective } from "../../directive/events/events.js";
import { Attributes } from "./attributes.js";
import { ngObserveDirective } from "../../directive/observe/observe.js";

/**
 * A function passed as the fifth argument to a {@type PublicLinkFn} link function.
 * It behaves like a linking function, with the `scope` argument automatically created
 * as a new child of the transcluded parent scope.
 *
 * The function returns the DOM content to be injected (transcluded) into the directive.
 *
 * @callback TranscludeFn
 * @param {Element | Node | ChildNode | NodeList | Node[]} [clone] - The DOM node to be inserted into the transcluded directive.
 * @param {import("../scope/scope.js").Scope} [scope] - The new child scope created from the transcluded parent.
 * @returns void

/**
 * A specialized version of {@link TranscludeFn} with the scope argument already bound.
 * This function requires no parameters and returns the same result as {@link TranscludeFn}.
 *
 * @typedef {() => Element|Node} BoundTranscludeFn
 */

/**
 * @typedef {Object} SimpleChange
 * @property {any} currentValue
 * @property {boolean} firstChange
 */

/**
 * @description A function returned by the '$compile' service that links a compiled template to a scope.
 *
 * @callback PublicLinkFn
 * @param {import('../scope/scope.js').Scope} scope - Scope to link with element
 * @param {TranscludeFn} [cloneConnectFn]
 * @param {*} [options]
 * @return {Element|Node|ChildNode|Node[]} The nodes to be linked.
 */

/**
 * @description Entry point for the '$compile' service.
 *
 * @callback CompileFn
 * @param {string|Element|Node|ChildNode|NodeList} compileNode - The node to be compiled.
 * @param {TranscludeFn} [transcludeFn] - An optional transclusion function to be used during compilation.
 * @param {number} [maxPriority] - An optional maximum priority for directives.
 * @param {string} [ignoreDirective] - An optional directive to ignore during compilation.
 * @param {*} [previousCompileContext] - An optional context from a previous compilation. TODO
 * @returns {PublicLinkFn} A public link function.
 */

/**
 * @typedef {Object} LinkFnMapping
 * @property {number} index
 * @property {NodeLinkFnCtx} [nodeLinkFnCtx]
 * @property {CompositeLinkFn} [childLinkFn]
 */

/**
 * @typedef {function(): CompositeLinkFn} CompileNodesFn
 */

/**
 * @callback NodeLinkFn
 * @returns {Node|Element|NodeList}
 */

/**
 * @typedef {Object} NodeLinkFnCtx
 * @property {NodeLinkFn} nodeLinkFn
 * @property {boolean} terminal
 * @property {TranscludeFn} transclude
 * @property {boolean} transcludeOnThisElement
 * @property {boolean} templateOnThisElement
 * @property {boolean} newScope
 */

/**
 * @typedef {function(): NodeLinkFn} ApplyDirectivesToNodeFn
 */

/**
 * @description Function that aggregates all linking fns for a compilation root (nodeList)
 * @callback CompositeLinkFn
 * @param {import('../scope/scope.js').Scope} scope - The scope to be linked to the template
 * @param {NodeRef} $linkNode - wrapper around a nodeList
 * @param {Function} [parentBoundTranscludeFn]
 */

const $compileMinErr = minErr("$compile");
const EXCLUDED_DIRECTIVES = ["ngIf", "ngRepeat"];
const ALL_OR_NOTHING_ATTRS = ["ngSrc", "ngSrcset", "src", "srcset"];
const REQUIRE_PREFIX_REGEXP = /^(?:(\^\^?)?(\?)?(\^\^?)?)?/;
// Ref: http://developers.whatwg.org/webappapis.html#event-handler-idl-attributes
// The assumption is that future DOM event attribute names will begin with
// 'on' and be composed of only English letters.
const EVENT_HANDLER_ATTR_REGEXP = /^(on[a-z]+|formaction)$/;
export const DirectiveSuffix = "Directive";

export class CompileProvider {
  static $inject = ["$provide", "$$sanitizeUriProvider"];

  /**
   * @param {import('../../interface.js').Provider} $provide
   * @param {import('../sanitize/sanitize-uri.js').SanitizeUriProvider} $$sanitizeUriProvider
   */
  constructor($provide, $$sanitizeUriProvider) {
    const hasDirectives = {};

    const bindingCache = Object.create(null);

    /**
     *
     * @param {import("../scope/scope.js").Scope} scope
     * @param {string} directiveName
     * @param {boolean} isController
     * @returns {Object} a configuration object for attribute bindings
     */
    function parseIsolateBindings(scope, directiveName, isController) {
      const LOCAL_REGEXP = /^([@&]|[=<]())(\??)\s*([\w$]*)$/;

      const bindings = Object.create(null);

      Object.entries(scope).forEach(([scopeName, definition]) => {
        definition = definition.trim();

        if (definition in bindingCache) {
          bindings[scopeName] = bindingCache[definition];
          return;
        }
        const match = definition.match(LOCAL_REGEXP);

        if (!match) {
          throw $compileMinErr(
            "iscp",
            "Invalid {3} for directive '{0}'." +
              " Definition: {... {1}: '{2}' ...}",
            directiveName,
            scopeName,
            definition,
            isController
              ? "controller bindings definition"
              : "isolate scope definition",
          );
        }

        bindings[scopeName] = {
          mode: match[1][0],
          collection: match[2] === "*",
          optional: match[3] === "?",
          attrName: match[4] || scopeName,
        };
        if (match[4]) {
          bindingCache[definition] = bindings[scopeName];
        }
      });

      return bindings;
    }

    function parseDirectiveBindings(directive, directiveName) {
      const bindings = {
        isolateScope: null,
        bindToController: null,
      };
      if (isObject(directive.scope)) {
        if (directive.bindToController === true) {
          bindings.bindToController = parseIsolateBindings(
            directive.scope,
            directiveName,
            true,
          );
          bindings.isolateScope = {};
        } else {
          bindings.isolateScope = parseIsolateBindings(
            directive.scope,
            directiveName,
            false,
          );
        }
      }
      if (isObject(directive.bindToController)) {
        bindings.bindToController = parseIsolateBindings(
          directive.bindToController,
          directiveName,
          true,
        );
      }
      if (bindings.bindToController && !directive.controller) {
        // There is no controller
        throw $compileMinErr(
          "noctrl",
          "Cannot bind to controller without directive '{0}'s controller.",
          directiveName,
        );
      }
      return bindings;
    }

    function getDirectiveRequire(directive) {
      const require =
        directive.require || (directive.controller && directive.name);

      if (!Array.isArray(require) && isObject(require)) {
        Object.entries(require).forEach(([key, value]) => {
          const match = value.match(REQUIRE_PREFIX_REGEXP);
          const name = value.substring(match[0].length);
          if (!name) {
            require[key] = match[0] + key;
          }
        });
      }

      return require;
    }

    function getDirectiveRestrict(restrict, name) {
      if (restrict && !(isString(restrict) && /[EA]/.test(restrict))) {
        throw $compileMinErr(
          "badrestrict",
          "Restrict property '{0}' of directive '{1}' is invalid",
          restrict,
          name,
        );
      }
      // Default is element or attribute
      return restrict || "EA";
    }

    /**
     * Register a new directive with the compiler.
     *
     * @param {string|Object} name Name of the directive in camel-case (i.e. `ngBind` which will match
     *    as `ng-bind`), or an object map of directives where the keys are the names and the values
     *    are the factories.
     * @param {Function|Array} directiveFactory An injectable directive factory function. See the
     *    {@link guide/directive directive guide} and the {@link $compile compile API} for more info.
     * @returns {CompileProvider} Self for chaining.
     */
    this.directive = function registerDirective(name, directiveFactory) {
      assertArg(name, "name");
      assertNotHasOwnProperty(name, "directive");
      if (isString(name)) {
        assertValidDirectiveName(name);
        assertArg(directiveFactory, "directiveFactory");
        if (!hasOwn(hasDirectives, name)) {
          hasDirectives[name] = [];
          $provide.factory(name + DirectiveSuffix, [
            "$injector",
            "$exceptionHandler",
            /**
             * @param {import("../../core/di/internal-injector.js").InjectorService} $injector
             * @param {import('../exception-handler.js').ErrorHandler} $exceptionHandler
             */
            function ($injector, $exceptionHandler) {
              const directives = [];
              hasDirectives[name].forEach((directiveFactory, index) => {
                try {
                  let directive = $injector.invoke(directiveFactory);
                  const valueFn = (value) => () => value;
                  if (isFunction(directive)) {
                    directive = { compile: valueFn(directive) };
                  } else if (!directive.compile && directive.link) {
                    directive.compile = valueFn(directive.link);
                  }

                  directive.priority = directive.priority || 0;
                  directive.index = index;
                  directive.name = directive.name || name;
                  directive.require = getDirectiveRequire(directive);
                  directive.restrict = getDirectiveRestrict(
                    directive.restrict,
                    name,
                  );
                  directive.$$moduleName = directiveFactory.$$moduleName;
                  directives.push(directive);
                } catch (e) {
                  $exceptionHandler(e);
                }
              });
              return directives;
            },
          ]);
        }
        hasDirectives[name].push(directiveFactory);
      } else {
        Object.entries(name).forEach(([k, v]) => registerDirective(k, v));
      }
      return this;
    };

    /**
     * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
     *    or an object map of components where the keys are the names and the values are the component definition objects.
     * @param {Object} options Component definition object (a simplified
     *    {directive definition object}),
     *    with the following properties (all optional):
     *
     *    - `controller` – `{(string|function()=}` – controller constructor function that should be
     *      associated with newly created scope or the name of a {controller} if passed as a string. An empty `noop` function by default.
     *    - `controllerAs` – `{string=}` – identifier name for to reference the controller in the component's scope.
     *      If present, the controller will be published to scope under the `controllerAs` name.
     *      If not present, this will default to be `$ctrl`.
     *    - `template` – `{string=|function()=}` – html template as a string or a function that
     *      returns an html template as a string which should be used as the contents of this component.
     *      Empty string by default.
     *
     *      If `template` is a function, then it is {injected} with
     *      the following locals:
     *
     *      - `$element` - Current element
     *      - `$attrs` - Current attributes object for the element
     *
     *    - `templateUrl` – `{string=|function()=}` – path or function that returns a path to an html
     *      template that should be used  as the contents of this component.
     *
     *      If `templateUrl` is a function, then it is {injected} with
     *      the following locals:
     *
     *      - `$element` - Current element
     *      - `$attrs` - Current attributes object for the element
     *
     *    - `bindings` – `{object=}` – defines bindings between DOM attributes and component properties.
     *      Component properties are always bound to the component controller and not to the scope.
     *      See {`bindToController`}.
     *    - `transclude` – `{boolean=}` – whether {content transclusion} is enabled.
     *      Disabled by default.
     *    - `require` - `{Object<string, string>=}` - requires the controllers of other directives and binds them to
     *      this component's controller. The object keys specify the property names under which the required
     *      controllers (object values) will be bound. See {`require`}.
     *    - `$...` – additional properties to attach to the directive factory function and the controller
     *      constructor function. (This is used by the component router to annotate)
     *
     * @returns {CompileProvider} the compile provider itself, for chaining of function calls.
     */
    this.component = function (name, options) {
      if (!isString(name)) {
        Object.entries(name).forEach(([key, val]) => this.component(key, val));
        return this;
      }

      const controller = options.controller || function () {};

      function factory($injector) {
        function makeInjectable(fn) {
          if (isFunction(fn) || Array.isArray(fn)) {
            return function (tElement, tAttrs) {
              return $injector.invoke(fn, this, {
                $element: tElement,
                $attrs: tAttrs,
              });
            };
          }
          return fn;
        }

        const template =
          !options.template && !options.templateUrl ? "" : options.template;
        const ddo = {
          controller,
          controllerAs:
            identifierForController(options.controller) ||
            options.controllerAs ||
            "$ctrl",
          template: makeInjectable(template),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: {},
          bindToController: options.bindings || {},
          restrict: "E",
          require: options.require,
        };

        // Copy annotations (starting with $) over to the DDO
        Object.entries(options).forEach(([key, val]) => {
          if (key.charAt(0) === "$") {
            ddo[key] = val;
          }
        });

        return ddo;
      }

      // Copy any annotation properties (starting with $) over to the factory and controller constructor functions
      // These could be used by libraries such as the new component router
      Object.entries(options).forEach(([key, val]) => {
        if (key.charAt(0) === "$") {
          factory[key] = val;
          // Don't try to copy over annotations to named controller
          if (isFunction(controller)) {
            controller[key] = val;
          }
        }
      });

      factory.$inject = ["$injector"];

      return this.directive(name, factory);
    };

    /**
     * Retrieves or overrides the default regular expression that is used for determining trusted safe
     * urls during a[href] sanitization.
     *
     * The sanitization is a security measure aimed at preventing XSS attacks via html links.
     *
     * Any url about to be assigned to a[href] via data-binding is first normalized and turned into
     * an absolute url. Afterwards, the url is matched against the `aHrefSanitizationTrustedUrlList`
     * regular expression. If a match is found, the original url is written into the dom. Otherwise,
     * the absolute url is prefixed with `'unsafe:'` string and only then is it written into the DOM.
     *
     * @param {RegExp=} regexp New regexp to trust urls with.
     * @returns {RegExp|import('../sanitize/sanitize-uri.js').SanitizeUriProvider} Current RegExp if called without value or self for
     *    chaining otherwise.
     */
    this.aHrefSanitizationTrustedUrlList = function (regexp) {
      if (isDefined(regexp)) {
        $$sanitizeUriProvider.aHrefSanitizationTrustedUrlList(regexp);
        return;
      }
      return $$sanitizeUriProvider.aHrefSanitizationTrustedUrlList();
    };

    /**
     * Retrieves or overrides the default regular expression that is used for determining trusted safe
     * urls during img[src] sanitization.
     *
     * The sanitization is a security measure aimed at prevent XSS attacks via html links.
     *
     * Any url about to be assigned to img[src] via data-binding is first normalized and turned into
     * an absolute url. Afterwards, the url is matched against the `imgSrcSanitizationTrustedUrlList`
     * regular expression. If a match is found, the original url is written into the dom. Otherwise,
     * the absolute url is prefixed with `'unsafe:'` string and only then is it written into the DOM.
     *
     * @param {RegExp=} regexp New regexp to trust urls with.
     * @returns {RegExp|import('../sanitize/sanitize-uri.js').SanitizeUriProvider} Current RegExp if called without value or self for
     *    chaining otherwise.
     */
    this.imgSrcSanitizationTrustedUrlList = function (regexp) {
      if (isDefined(regexp)) {
        $$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList(regexp);
        return;
      }
      return $$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList();
    };

    /**
     * @param {boolean=} enabled update the strictComponentBindingsEnabled state if provided,
     * otherwise return the current strictComponentBindingsEnabled state.
     * @returns {*} current value if used as getter or itself (chaining) if used as setter
     *
     * Call this method to enable / disable the strict component bindings check. If enabled, the
     * compiler will enforce that all scope / controller bindings of a
     * {@link $compileProvider#directive directive} / {@link $compileProvider#component component}
     * that are not set as optional with `?`, must be provided when the directive is instantiated.
     * If not provided, the compiler will throw the
     * {@link error/$compile/missingattr $compile:missingattr error}.
     *
     * The default value is false.
     */
    let strictComponentBindingsEnabled = false;
    this.strictComponentBindingsEnabled = function (enabled) {
      if (isDefined(enabled)) {
        strictComponentBindingsEnabled = enabled;
        return this;
      }
      return strictComponentBindingsEnabled;
    };

    /**
     * The security context of DOM Properties.
     */
    const PROP_CONTEXTS = Object.create(null);

    /**
     * Defines the security context for DOM properties bound by ng-prop-*.
     *
     * @param {string} elementName The element name or '*' to match any element.
     * @param {string} propertyName The DOM property name.
     * @param {string} ctx The {@link $sce} security context in which this value is safe for use, e.g. `$sce.URL`
     * @returns {object} `this` for chaining
     */
    this.addPropertySecurityContext = function (
      elementName,
      propertyName,
      ctx,
    ) {
      const key = `${elementName.toLowerCase()}|${propertyName.toLowerCase()}`;

      if (key in PROP_CONTEXTS && PROP_CONTEXTS[key] !== ctx) {
        throw $compileMinErr(
          "ctxoverride",
          "Property context '{0}.{1}' already set to '{2}', cannot override to '{3}'.",
          elementName,
          propertyName,
          PROP_CONTEXTS[key],
          ctx,
        );
      }

      PROP_CONTEXTS[key] = ctx;
      return this;
    };

    /* Default property contexts.
     *
     * Copy of https://github.com/angular/angular/blob/6.0.6/packages/compiler/src/schema/dom_security_schema.ts#L31-L58
     * Changing:
     * - SecurityContext.* => SCE_CONTEXTS/$sce.*
     * - STYLE => CSS
     * - various URL => MEDIA_URL
     * - *|formAction, form|action URL => RESOURCE_URL (like the attribute)
     */
    (function registerNativePropertyContexts() {
      function registerContext(ctx, values) {
        values.forEach((v) => {
          PROP_CONTEXTS[v.toLowerCase()] = ctx;
        });
      }

      registerContext(SCE_CONTEXTS.HTML, [
        "iframe|srcdoc",
        "*|innerHTML",
        "*|outerHTML",
      ]);
      registerContext(SCE_CONTEXTS.CSS, ["*|style"]);
      registerContext(SCE_CONTEXTS.URL, [
        "area|href",
        "area|ping",
        "a|href",
        "a|ping",
        "blockquote|cite",
        "body|background",
        "del|cite",
        "input|src",
        "ins|cite",
        "q|cite",
      ]);
      registerContext(SCE_CONTEXTS.MEDIA_URL, [
        "audio|src",
        "img|src",
        "img|srcset",
        "source|src",
        "source|srcset",
        "track|src",
        "video|src",
        "video|poster",
      ]);
      registerContext(SCE_CONTEXTS.RESOURCE_URL, [
        "*|formAction",
        "applet|code",
        "applet|codebase",
        "base|href",
        "embed|src",
        "frame|src",
        "form|action",
        "head|profile",
        "html|manifest",
        "iframe|src",
        "link|href",
        "media|src",
        "object|codebase",
        "object|data",
        "script|src",
      ]);
    })();

    this.$get = [
      "$injector",
      "$interpolate",
      "$exceptionHandler",
      "$templateRequest",
      "$parse",
      "$controller",
      "$rootScope",
      "$sce",
      "$animate",
      /**
       * @param {import("../../core/di/internal-injector.js").InjectorService} $injector
       * @param {*} $interpolate
       * @param {import("../exception-handler.js").ErrorHandler} $exceptionHandler
       * @param {*} $templateRequest
       * @param {import("../parse/interface.ts").ParseService} $parse
       * @param {*} $controller
       * @param {import('../scope/scope.js').Scope} $rootScope
       * @param {*} $sce
       * @param {*} $animate
       * @returns
       */
      function (
        $injector,
        $interpolate,
        $exceptionHandler,
        $templateRequest,
        $parse,
        $controller,
        $rootScope,
        $sce,
        $animate,
      ) {
        // The onChanges hooks should all be run together in a single digest
        // When changes occur, the call to trigger their hooks will be added to this queue
        let onChangesQueue;

        // This function is called in a $postUpdate to trigger all the onChanges hooks in a single digest
        function flushOnChangesQueue() {
          for (let i = 0, ii = onChangesQueue.length; i < ii; ++i) {
            try {
              onChangesQueue[i]();
            } catch (e) {
              $exceptionHandler(e);
            }
          }
          // Reset the queue to trigger a new schedule next time there is a change
          onChangesQueue = undefined;
        }

        const startSymbol = $interpolate.startSymbol();
        const endSymbol = $interpolate.endSymbol();
        /** @type {(string) => string} */
        const denormalizeTemplate =
          startSymbol === "{{" && endSymbol === "}}"
            ? (x) => x
            : (x) => x.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);

        const NG_PREFIX_BINDING = /^ng(Attr|Prop|On|Observe)([A-Z].*)$/;
        return compile;

        //= ===============================
        /**
         * @type {CompileFn}
         */
        function compile(
          element,
          transcludeFn,
          maxPriority,
          ignoreDirective,
          previousCompileContext,
        ) {
          /** @type {NodeRef | null } */
          let nodeRef = new NodeRef(element);
          /**
           * The composite link function is a composite of individual node linking functions.
           * It will be invoke by the public link function below.
           * @type {CompositeLinkFn}
           */
          let compositeLinkFn = compileNodes(
            nodeRef,
            transcludeFn,
            maxPriority,
            ignoreDirective,
            previousCompileContext,
          );

          let namespace = null;
          return publicLinkFn;

          /** @type {PublicLinkFn} */
          function publicLinkFn(scope, cloneConnectFn, options) {
            if (!nodeRef) {
              throw $compileMinErr(
                "multilink",
                "This element has already been linked.",
              );
            }

            assertArg(scope, "scope");
            // could be empty nodelist
            if (nodeRef.getAny()) {
              setScope(nodeRef.getAny(), scope);
            }

            if (
              previousCompileContext &&
              previousCompileContext.needsNewScope
            ) {
              // A parent directive did a replace and a directive on this element asked
              // for transclusion, which caused us to lose a layer of element on which
              // we could hold the new transclusion scope, so we will create it manually
              // here.
              scope = scope.$parent.$new();
            }

            options = options || {};
            let {
              transcludeControllers,
              parentBoundTranscludeFn,
              futureParentElement,
            } = options;

            // When `parentBoundTranscludeFn` is passed, it is a
            // `controllersBoundTransclude` function (it was previously passed
            // as `transclude` to directive.link) so we must unwrap it to get
            // its `boundTranscludeFn`
            if (
              parentBoundTranscludeFn &&
              parentBoundTranscludeFn.$$boundTransclude
            ) {
              parentBoundTranscludeFn =
                parentBoundTranscludeFn.$$boundTransclude;
            }

            if (!namespace) {
              namespace = detectNamespaceForChildElements(futureParentElement);
            }
            /** @type {NodeRef} */
            let $linkNode;

            if (namespace !== "html") {
              // When using a directive with replace:true and templateUrl the jqCompileNodes
              // (or a child element inside of them)
              // might change, so we need to recreate the namespace adapted compileNodes
              // for call to the link function.
              // Note: This will already clone the nodes...
              const fragment = createElementFromHTML("<div></div>");
              fragment.append(nodeRef.node);
              const wrappedTemplate = wrapTemplate(
                namespace,
                fragment.innerHTML,
              );
              $linkNode = new NodeRef(wrappedTemplate[0]);
            } else if (cloneConnectFn) {
              $linkNode = nodeRef.clone();
            } else {
              $linkNode = nodeRef;
            }

            if (transcludeControllers) {
              for (const controllerName in transcludeControllers) {
                assertArg($linkNode.element, "element");
                setCacheData(
                  $linkNode.element,
                  `$${controllerName}Controller`,
                  transcludeControllers[controllerName].instance,
                );
              }
            }
            if (cloneConnectFn) {
              cloneConnectFn($linkNode.dom, scope);
            }

            if (compositeLinkFn) {
              compositeLinkFn(scope, $linkNode, parentBoundTranscludeFn);
            }

            if (!cloneConnectFn) {
              nodeRef = compositeLinkFn = null;
            }

            $linkNode.linked = true;

            return $linkNode.getAll();
          }
        }

        function detectNamespaceForChildElements(parentElement) {
          // TODO: Make this detect MathML as well...
          const node = parentElement;
          if (!node) {
            return "html";
          }
          return getNodeName(node) !== "foreignobject" &&
            toString.call(node).match(/SVG/)
            ? "svg"
            : "html";
        }

        /**
         * Compile function matches each node in nodeList against the directives. Once all directives
         * for a particular node are collected their compile functions are executed. The compile
         * functions return values - the linking functions - are combined into a composite linking
         * function, which is a linking function for the node.
         *
         * @param {NodeRef} nodeRefList a node or an array of nodes or NodeList to compile
         * @param {*} transcludeFn A linking function, where the
         *        scope argument is auto-generated to the new child of the transcluded parent scope.
         * @param {number=} [maxPriority] Max directive priority.
         * @param {*} [ignoreDirective]
         * @param {*} [previousCompileContext]
         * @returns {CompositeLinkFn} A composite linking function of all of the matched directives or null.
         */
        function compileNodes(
          nodeRefList,
          transcludeFn,
          maxPriority,
          ignoreDirective,
          previousCompileContext,
        ) {
          /**
           * Aggregates for the composite linking function, where a node in a node list is mapped
           * to a corresponding link function. For single elements, the node should be mapped to
           * a single node link function.
           * @type {LinkFnMapping[]}
           */
          const linkFnsList = []; // An array to hold node indices and their linkFns
          let nodeLinkFnFound;
          let linkFnFound = false;
          for (let i = 0; i < nodeRefList.size; i++) {
            const attrs = new Attributes(
              $rootScope,
              $animate,
              $exceptionHandler,
              $sce,
            );

            const directives = collectDirectives(
              /** @type Element */ (nodeRefList.getIndex(i)),
              attrs,
              i === 0 ? maxPriority : undefined,
              ignoreDirective,
            );

            /** @type {NodeLinkFnCtx} */
            let nodeLinkFnCtx;

            if (directives.length) {
              nodeLinkFnCtx = applyDirectivesToNode(
                directives,
                nodeRefList.getIndex(i),
                attrs,
                transcludeFn,
                null,
                [],
                [],
                Object.assign({}, previousCompileContext, {
                  index: i,
                  parentNodeRef: nodeRefList,
                  ctxNodeRef: nodeRefList,
                }),
              );
            }

            let childLinkFn;
            let childNodes;
            let nodeLinkFn = nodeLinkFnCtx?.nodeLinkFn;
            if (
              (nodeLinkFn && nodeLinkFnCtx.terminal) ||
              !(childNodes = nodeRefList.getIndex(i).childNodes) ||
              !childNodes.length
            ) {
              childLinkFn = null;
            } else {
              let transcluded = nodeLinkFn
                ? (nodeLinkFnCtx.transcludeOnThisElement ||
                    !nodeLinkFnCtx.templateOnThisElement) &&
                  nodeLinkFnCtx.transclude
                : transcludeFn;
              // recursive call
              const childNodeRef = new NodeRef(childNodes);
              childLinkFn = compileNodes(childNodeRef, transcluded);
            }

            if (nodeLinkFn || childLinkFn) {
              linkFnsList.push({
                index: i,
                nodeLinkFnCtx: nodeLinkFnCtx,
                childLinkFn: childLinkFn,
              });
              linkFnFound = true;
              nodeLinkFnFound = nodeLinkFnFound || nodeLinkFn;
            }

            // use the previous context only for the first element in the virtual group
            previousCompileContext = null;
          }

          // return a composite linking function if we have found anything, null otherwise
          return linkFnFound ? compositeLinkFn : null;

          /**
           * The composite link function links all the individual nodes
           *
           * @param {import("../scope/scope.js").Scope} scope
           * @param {NodeRef} nodeRef
           * @param {*} [parentBoundTranscludeFn]
           */
          function compositeLinkFn(scope, nodeRef, parentBoundTranscludeFn) {
            assertArg(nodeRef, "nodeRef");
            let stableNodeList = [];
            if (nodeLinkFnFound) {
              // create a stable copy of the nodeList, only copying elements with linkFns
              const stableLength = nodeRef.isList ? nodeRef.nodes.length : 1;
              stableNodeList = new Array(stableLength);
              // create a sparse array by only copying the elements which have a linkFn
              linkFnsList.forEach((val) => {
                let idx = val.index;
                if (idx === 0) {
                  stableNodeList[idx] = nodeRef.isList
                    ? nodeRef.nodes[idx]
                    : nodeRef.node;
                } else {
                  if (nodeRefList.getIndex(idx)) {
                    stableNodeList[idx] = nodeRef.nodes[idx];
                  }
                }
              });
            } else {
              if (nodeRef.isList) {
                nodeRef.nodes.forEach((elem) => stableNodeList.push(elem));
              } else {
                stableNodeList.push(nodeRef.node);
              }
            }

            linkFnsList.forEach(({ index, nodeLinkFnCtx, childLinkFn }) => {
              const node = stableNodeList[index];
              node.stable = true;
              let childScope;
              let childBoundTranscludeFn;

              if (nodeLinkFnCtx?.nodeLinkFn) {
                childScope = nodeLinkFnCtx.newScope ? scope.$new() : scope;

                if (nodeLinkFnCtx.transcludeOnThisElement) {
                  // bind proper scope for the translusion function
                  childBoundTranscludeFn = createBoundTranscludeFn(
                    scope,
                    nodeLinkFnCtx.transclude,
                    parentBoundTranscludeFn,
                  );
                } else if (
                  !nodeLinkFnCtx.templateOnThisElement &&
                  parentBoundTranscludeFn
                ) {
                  childBoundTranscludeFn = parentBoundTranscludeFn;
                } else if (!parentBoundTranscludeFn && transcludeFn) {
                  childBoundTranscludeFn = createBoundTranscludeFn(
                    scope,
                    transcludeFn,
                  );
                } else {
                  childBoundTranscludeFn = null;
                }

                // attach new scope to element
                if (nodeLinkFnCtx?.newScope) {
                  setScope(node, childScope);
                }
                // @ts-ignore
                nodeLinkFnCtx.nodeLinkFn(
                  // @ts-ignore
                  childLinkFn,
                  childScope,
                  node,
                  childBoundTranscludeFn,
                );
              } else if (childLinkFn) {
                childLinkFn(
                  scope,
                  new NodeRef(node.childNodes),
                  parentBoundTranscludeFn,
                );
              }
            });
          }
        }

        /**
         * Prebinds the transclusion function to a scope
         * @param {import("../scope/scope.js").Scope} scope
         * @param {*} transcludeFn
         * @param {*} previousBoundTranscludeFn
         * @returns {BoundTranscludeFn}
         */
        function createBoundTranscludeFn(
          scope,
          transcludeFn,
          previousBoundTranscludeFn,
        ) {
          function boundTranscludeFn(
            transcludedScope,
            cloneFn,
            controllers,
            futureParentElement,
            containingScope,
          ) {
            if (!transcludedScope) {
              transcludedScope = scope.$transcluded(containingScope);
              transcludedScope.$$transcluded = true;
            }

            const transcludeRes = transcludeFn(transcludedScope, cloneFn, {
              parentBoundTranscludeFn: previousBoundTranscludeFn,
              transcludeControllers: controllers,
              futureParentElement,
            });

            return transcludeRes;
          }

          // We need  to attach the transclusion slots onto the `boundTranscludeFn`
          // so that they are available inside the `controllersBoundTransclude` function
          const boundSlots = (boundTranscludeFn.$$slots = Object.create(null));
          for (const slotName in transcludeFn.$$slots) {
            if (transcludeFn.$$slots[slotName]) {
              boundSlots[slotName] = createBoundTranscludeFn(
                scope,
                transcludeFn.$$slots[slotName],
                previousBoundTranscludeFn,
              );
            } else {
              boundSlots[slotName] = null;
            }
          }

          return boundTranscludeFn;
        }

        /**
         * Looks for directives on the given node and adds them to the directive collection which is
         * sorted.
         *
         * @param {Element} node Node to search.
         * @param {Attributes|any} attrs The shared attrs object which is used to populate the normalized attributes.
         * @param {number=} maxPriority Max directive priority.
         * @param {string} [ignoreDirective]
         * @return {import('../../interface.ts').Directive[]} An array to which the directives are added to. This array is sorted before the function returns.
         */
        function collectDirectives(node, attrs, maxPriority, ignoreDirective) {
          /**
           * @type {import('../../interface.ts').Directive[]}
           */
          const directives = [];
          const { nodeType } = node;
          const attrsMap = attrs.$attr;
          let nodeName;

          switch (nodeType) {
            case Node.ELEMENT_NODE /* Element */:
              nodeName = node.nodeName.toLowerCase();
              if (ignoreDirective !== directiveNormalize(nodeName)) {
                // use the node name: <directive>
                addDirective(
                  directives,
                  directiveNormalize(nodeName),
                  "E",
                  maxPriority,
                );
              }

              // iterate over the attributes
              for (let j = 0; j < node.attributes?.length; j++) {
                let isNgAttr = false;
                let isNgProp = false;
                let isNgEvent = false;
                let isNgObserve = false;

                let attr = node.attributes[j];
                let name = attr.name;
                let value = attr.value;
                let nName = directiveNormalize(name.toLowerCase());

                // Support ng-attr-*, ng-prop-* and ng-on-*
                const ngPrefixMatch = nName.match(NG_PREFIX_BINDING);
                if (ngPrefixMatch) {
                  isNgAttr = ngPrefixMatch[1] === "Attr";
                  isNgProp = ngPrefixMatch[1] === "Prop";
                  isNgEvent = ngPrefixMatch[1] === "On";
                  isNgObserve = ngPrefixMatch[1] === "Observe";

                  // Normalize the non-prefixed name
                  name = name
                    .replace(PREFIX_REGEXP, "")
                    .toLowerCase()
                    .substring(4 + ngPrefixMatch[1].length)
                    .replace(/_(.)/g, (match, letter) => letter.toUpperCase());
                }

                if (isNgProp || isNgEvent) {
                  attrs[nName] = value;
                  attrsMap[nName] = attr.name;

                  if (isNgProp) {
                    addPropertyDirective(node, directives, nName, name);
                  } else {
                    directives.push(
                      createEventDirective(
                        $parse,
                        $exceptionHandler,
                        nName,
                        name,
                      ),
                    );
                  }
                } else if (isNgObserve) {
                  directives.push(ngObserveDirective(name, value));
                } else {
                  // Update nName for cases where a prefix was removed
                  // NOTE: the .toLowerCase() is unnecessary and causes https://github.com/angular/angular.js/issues/16624 for ng-attr-*
                  nName = directiveNormalize(name.toLowerCase());
                  attrsMap[nName] = name;

                  if (isNgAttr || !hasOwn(attrs, nName)) {
                    attrs[nName] = value;
                    if (getBooleanAttrName(node, nName)) {
                      attrs[nName] = true; // presence means true
                    }
                  }

                  addAttrInterpolateDirective(
                    node,
                    directives,
                    value,
                    nName,
                    isNgAttr,
                  );

                  if (nName !== ignoreDirective) {
                    addDirective(directives, nName, "A", maxPriority);
                  }
                }
              }

              if (
                nodeName === "input" &&
                node.getAttribute("type") === "hidden"
              ) {
                // Hidden input elements can have strange behaviour when navigating back to the page
                // This tells the browser not to try to cache and reinstate previous values
                node.setAttribute("autocomplete", "off");
              }

              break;
            case Node.TEXT_NODE:
              addTextInterpolateDirective(directives, node.nodeValue);
              break;
            default:
              break;
          }

          directives.sort(byPriority);
          return directives;
        }

        /**
         * A function generator that is used to support both eager and lazy compilation
         * linking function.
         * @param eager
         * @param {NodeList|Node} compileNodes
         * @param transcludeFn
         * @param maxPriority
         * @param ignoreDirective
         * @param previousCompileContext
         * @returns {PublicLinkFn|TranscludeFn}
         */
        function compilationGenerator(
          eager,
          compileNodes,
          transcludeFn,
          maxPriority,
          ignoreDirective,
          previousCompileContext,
        ) {
          let compiled;
          if (eager) {
            return compile(
              compileNodes,
              transcludeFn,
              maxPriority,
              ignoreDirective,
              previousCompileContext,
            );
          }

          return function lazyCompilation() {
            if (!compiled) {
              compiled = compile(
                compileNodes,
                transcludeFn,
                maxPriority,
                ignoreDirective,
                previousCompileContext,
              );

              // Null out all of these references for garbage collection
              compileNodes = transcludeFn = previousCompileContext = null;
            }
            const linked = compiled.apply(this, arguments);
            return linked;
          };
        }

        /**
         * Once the directives have been collected, their compile functions are executed. This method
         * is responsible for inlining directive templates as well as terminating the application
         * of the directives if the terminal directive has been reached.
         *
         * @param {Array} directives Array of collected directives to execute their compile function.
         *        this needs to be pre-sorted by priority order.
         * @param {Node | Element} compileNode  DOM node to apply the compile functions to
         * @param {Attributes} templateAttrs The shared attribute function
         * @param {TranscludeFn} transcludeFn
         * @param {Object=} originalReplaceDirective An optional directive that will be ignored when
         *                                           compiling the transclusion.
         * @param {Array.<Function>} [preLinkFns]
         * @param {Array.<Function>} [postLinkFns]
         * @param {Object} [previousCompileContext] Context used for previous compilation of the current
         *                                        node
         * @returns {NodeLinkFnCtx} node link function
         */
        function applyDirectivesToNode(
          directives,
          compileNode,
          templateAttrs,
          transcludeFn,
          originalReplaceDirective,
          preLinkFns,
          postLinkFns,
          previousCompileContext,
        ) {
          previousCompileContext = previousCompileContext || {};

          let terminalPriority = -Number.MAX_VALUE;
          let terminal = false;
          let {
            newScopeDirective,
            controllerDirectives,
            newIsolateScopeDirective,
            templateDirective,
            nonTlbTranscludeDirective,
            hasElementTranscludeDirective,
            ctxNodeRef,
            parentNodeRef,
          } = previousCompileContext;
          let hasTranscludeDirective = false;
          let hasTemplate = false;
          let compileNodeRef = new NodeRef(compileNode);
          const index = previousCompileContext.index;
          templateAttrs.$nodeRef = compileNodeRef;
          let directive;
          let directiveName;
          let $template;
          let replaceDirective = originalReplaceDirective;
          /** @type {TranscludeFn} */
          let childTranscludeFn = transcludeFn;

          let didScanForMultipleTransclusion = false;
          let mightHaveMultipleTransclusionError = false;
          let directiveValue;

          /**
           * Links all the directives of a single node.
           * @type {NodeLinkFn}
           */
          // @ts-ignore
          let nodeLinkFn = function (
            childLinkFn,
            scope,
            linkNode,
            boundTranscludeFn,
          ) {
            let i;
            let ii;
            let isolateScope;
            let controllerScope;
            let elementControllers;
            let transcludeFn;

            /** @type {NodeRef} */
            let $element;
            /** @type {Attributes} */
            let attrs;
            let scopeBindingInfo;

            if (compileNode === linkNode) {
              attrs = templateAttrs;
              $element = templateAttrs.$nodeRef;
            } else {
              $element = new NodeRef(linkNode);
              attrs = new Attributes(
                $rootScope,
                $animate,
                $exceptionHandler,
                $sce,
                $element,
                templateAttrs,
              );
            }

            controllerScope = scope;
            if (newIsolateScopeDirective) {
              isolateScope = scope.$newIsolate();
            } else if (newScopeDirective) {
              controllerScope = scope.$parent;
            }

            if (boundTranscludeFn) {
              // track `boundTranscludeFn` so it can be unwrapped if `transcludeFn`
              // is later passed as `parentBoundTranscludeFn` to `publicLinkFn`
              transcludeFn = controllersBoundTransclude;
              transcludeFn["$$boundTransclude"] = boundTranscludeFn;
              // expose the slots on the `$transclude` function
              transcludeFn["isSlotFilled"] = function (slotName) {
                return !!boundTranscludeFn.$$slots[slotName];
              };
            }

            if (controllerDirectives) {
              elementControllers = setupControllers(
                $element,
                attrs,
                transcludeFn,
                controllerDirectives,
                isolateScope,
                scope,
                newIsolateScopeDirective,
              );
            }

            if (newIsolateScopeDirective) {
              isolateScope.$target.$$isolateBindings =
                newIsolateScopeDirective.$$isolateBindings;
              scopeBindingInfo = initializeDirectiveBindings(
                scope,
                attrs,
                isolateScope,
                isolateScope.$$isolateBindings,
                newIsolateScopeDirective,
              );
              if (scopeBindingInfo.removeWatches) {
                isolateScope.$on("$destroy", scopeBindingInfo.removeWatches);
              }
            }

            // Initialize bindToController bindings
            for (const name in elementControllers) {
              const controllerDirective = controllerDirectives[name];
              const controller = elementControllers[name];
              const bindings = controllerDirective.$$bindings.bindToController;

              // Controller instance is bound to the scope
              const controllerInstance = controller();
              controller.instance = controllerScope.$new(controllerInstance);
              setCacheData(
                $element.node,
                `$${controllerDirective.name}Controller`,
                controller.instance,
              );
              controller.bindingInfo = initializeDirectiveBindings(
                controllerScope,
                attrs,
                controller.instance,
                bindings,
                controllerDirective,
              );
            }

            // Bind the required controllers to the controller, if `require` is an object and `bindToController` is truthy
            if (controllerDirectives) {
              Object.entries(controllerDirectives).forEach(
                ([name, controllerDirective]) => {
                  const { require } = controllerDirective;
                  if (
                    controllerDirective.bindToController &&
                    !Array.isArray(require) &&
                    isObject(require)
                  ) {
                    extend(
                      elementControllers[name].instance,
                      getControllers(
                        name,
                        require,
                        $element.element,
                        elementControllers,
                      ),
                    );
                  }
                },
              );
            }

            // Handle the init and destroy lifecycle hooks on all controllers that have them
            if (elementControllers) {
              Object.values(elementControllers).forEach((controller) => {
                const controllerInstance = controller.instance;
                if (isFunction(controllerInstance.$onChanges)) {
                  try {
                    controllerInstance.$onChanges(
                      controller.bindingInfo.initialChanges,
                    );
                  } catch (e) {
                    $exceptionHandler(e);
                  }
                }
                if (isFunction(controllerInstance.$onInit)) {
                  try {
                    controllerInstance.$target.$onInit();
                  } catch (e) {
                    $exceptionHandler(e);
                  }
                }
                if (isFunction(controllerInstance.$onDestroy)) {
                  controllerScope.$on("$destroy", () => {
                    controllerInstance.$onDestroy();
                  });
                }
              });
            }

            // PRELINKING
            for (i = 0, ii = preLinkFns.length; i < ii; i++) {
              let preLinkFn = preLinkFns[i];
              const controllers =
                preLinkFn["require"] &&
                getControllers(
                  preLinkFn["directiveName"],
                  preLinkFn["require"],
                  $element.element,
                  elementControllers,
                );

              // invoke link function
              try {
                preLinkFn(
                  preLinkFn["isolateScope"] ? isolateScope : scope,
                  $element.node, // Prelink functions accept a Node
                  attrs,
                  controllers,
                  transcludeFn,
                );
              } catch (e) {
                $exceptionHandler(e, startingTag($element.getAny()));
              }
            }

            // RECURSION
            // We only pass the isolate scope, if the isolate directive has a template,
            // otherwise the child elements do not belong to the isolate directive.
            var scopeToChild = scope;
            if (
              newIsolateScopeDirective &&
              (newIsolateScopeDirective.template ||
                newIsolateScopeDirective.templateUrl === null)
            ) {
              scopeToChild = isolateScope;
            }
            if (
              childLinkFn &&
              linkNode &&
              linkNode.childNodes &&
              linkNode.childNodes.length
            ) {
              childLinkFn(
                scopeToChild,
                new NodeRef(linkNode.childNodes),
                boundTranscludeFn,
              );
            }
            // POSTLINKING
            for (i = postLinkFns.length - 1; i >= 0; i--) {
              let postLinkFn = postLinkFns[i];
              const controllers =
                postLinkFn["require"] &&
                getControllers(
                  postLinkFn["directiveName"],
                  postLinkFn["require"],
                  /** @type {Element} */ ($element.node),
                  elementControllers,
                );

              // invoke link function
              try {
                if (postLinkFn["isolateScope"]) {
                  setIsolateScope($element.element, isolateScope);
                }

                postLinkFn(
                  postLinkFn["isolateScope"] ? isolateScope : scope,
                  $element.node,
                  attrs,
                  controllers,
                  transcludeFn,
                );
              } catch (e) {
                $exceptionHandler(e, startingTag($element.getAny()));
              }
            }

            if (elementControllers) {
              // Trigger $postLink lifecycle hooks
              Object.values(elementControllers).forEach((controller) => {
                const controllerInstance = controller.instance;
                if (isFunction(controllerInstance.$postLink)) {
                  controllerInstance.$postLink();
                }
              });
            }

            // This is the function that is injected as `$transclude` or
            // the fifth parameter to the link function.
            // Example: function link (scope, element, attrs, ctrl, transclude) {}
            // Note: all arguments are optional!
            function controllersBoundTransclude(
              scope,
              cloneAttachFn,
              futureParentElement,
              slotName,
            ) {
              let transcludeControllers;
              // No scope passed in:
              if (!isScope(scope)) {
                slotName = futureParentElement;
                futureParentElement = cloneAttachFn;
                cloneAttachFn = scope;
                scope = undefined;
              }
              if (hasElementTranscludeDirective) {
                transcludeControllers = elementControllers;
              }
              if (!futureParentElement) {
                futureParentElement = hasElementTranscludeDirective
                  ? $element.node.parentElement
                  : $element.node;
              }
              if (slotName) {
                // slotTranscludeFn can be one of three things:
                //  * a transclude function - a filled slot
                //  * `null` - an optional slot that was not filled
                //  * `undefined` - a slot that was not declared (i.e. invalid)
                const slotTranscludeFn = boundTranscludeFn.$$slots[slotName];
                if (slotTranscludeFn) {
                  const slotTranscludeRes = slotTranscludeFn(
                    scope,
                    cloneAttachFn,
                    transcludeControllers,
                    futureParentElement,
                    scopeToChild,
                  );
                  return slotTranscludeRes;
                }

                if (isUndefined(slotTranscludeFn)) {
                  throw $compileMinErr(
                    "noslot",
                    'No parent directive that requires a transclusion with slot name "{0}". ' +
                      "Element: {1}",
                    slotName,
                    startingTag($element.element),
                  );
                }
              } else {
                const boundTranscludeRes = boundTranscludeFn(
                  scope,
                  cloneAttachFn,
                  transcludeControllers,
                  futureParentElement,
                  scopeToChild,
                );
                return boundTranscludeRes;
              }
            }
          };

          // executes all directives on the current element
          for (let i = 0, ii = directives.length; i < ii; i++) {
            directive = directives[i];
            $template = undefined;

            if (terminalPriority > directive.priority) {
              break; // prevent further processing of directives
            }

            directiveValue = directive.scope;

            if (directiveValue) {
              // skip the check for directives with async templates, we'll check the derived sync
              // directive when the template arrives
              if (!directive.templateUrl) {
                if (isObject(directiveValue)) {
                  // This directive is trying to add an isolated scope.
                  // Check that there is no scope of any kind already
                  assertNoDuplicate(
                    "new/isolated scope",
                    newIsolateScopeDirective || newScopeDirective,
                    directive,
                    compileNodeRef,
                  );
                  newIsolateScopeDirective = directive;
                } else {
                  // This directive is trying to add a child scope.
                  // Check that there is no isolated scope already
                  assertNoDuplicate(
                    "new/isolated scope",
                    newIsolateScopeDirective,
                    directive,
                    compileNodeRef,
                  );
                }
              }

              newScopeDirective = newScopeDirective || directive;
            }

            directiveName = directive.name;

            // If we encounter a condition that can result in transclusion on the directive,
            // then scan ahead in the remaining directives for others that may cause a multiple
            // transclusion error to be thrown during the compilation process.  If a matching directive
            // is found, then we know that when we encounter a transcluded directive, we need to eagerly
            // compile the `transclude` function rather than doing it lazily in order to throw
            // exceptions at the correct time
            const hasReplacedTemplate =
              directive.replace &&
              (directive.templateUrl || directive.template);
            const shouldTransclude =
              directive.transclude &&
              !EXCLUDED_DIRECTIVES.includes(directive.name);
            if (
              !didScanForMultipleTransclusion &&
              (hasReplacedTemplate || shouldTransclude)
            ) {
              let candidateDirective;

              for (
                let scanningIndex = i + 1;
                (candidateDirective = directives[scanningIndex++]);

              ) {
                if (
                  (candidateDirective.transclude &&
                    !EXCLUDED_DIRECTIVES.includes(candidateDirective.name)) ||
                  (candidateDirective.replace &&
                    (candidateDirective.templateUrl ||
                      candidateDirective.template))
                ) {
                  mightHaveMultipleTransclusionError = true;
                  break;
                }
              }

              didScanForMultipleTransclusion = true;
            }

            if (!directive.templateUrl && directive.controller) {
              controllerDirectives =
                controllerDirectives || Object.create(null);
              assertNoDuplicate(
                `'${directiveName}' controller`,
                controllerDirectives[directiveName],
                directive,
                compileNodeRef,
              );
              controllerDirectives[directiveName] = directive;
            }

            directiveValue = directive.transclude;

            if (directiveValue) {
              hasTranscludeDirective = true;

              // Special case ngIf and ngRepeat so that we don't complain about duplicate transclusion.
              // This option should only be used by directives that know how to safely handle element transclusion,
              // where the transcluded nodes are added or replaced after linking.
              if (!EXCLUDED_DIRECTIVES.includes(directive.name)) {
                assertNoDuplicate(
                  "transclusion",
                  nonTlbTranscludeDirective,
                  directive,
                  compileNodeRef,
                );
                nonTlbTranscludeDirective = directive;
              }

              if (directiveValue === "element") {
                hasElementTranscludeDirective = true;
                terminalPriority = directive.priority;
                $template = compileNodeRef;
                compileNodeRef = new NodeRef(document.createComment(""));
                templateAttrs.$nodeRef = compileNodeRef;
                compileNode = compileNodeRef.node;
                ctxNodeRef.node = compileNode;
                replaceWith(
                  new NodeRef($template.getAny()),
                  compileNode,
                  index,
                );

                // @ts-ignore
                childTranscludeFn = compilationGenerator(
                  mightHaveMultipleTransclusionError,
                  $template.getAny(),
                  transcludeFn,
                  terminalPriority,
                  replaceDirective && replaceDirective.name,
                  {
                    // Don't pass in:
                    // - controllerDirectives - otherwise we'll create duplicates controllers
                    // - newIsolateScopeDirective or templateDirective - combining templates with
                    //   element transclusion doesn't make sense.
                    //
                    // We need only nonTlbTranscludeDirective so that we prevent putting transclusion
                    // on the same element more than once.
                    nonTlbTranscludeDirective,
                  },
                );
              } else {
                const slots = Object.create(null);

                if (!isObject(directiveValue)) {
                  //
                  // Clone childnodes before clearing contents on transcluded directives
                  $template = compileNode.cloneNode(true).childNodes;
                } else {
                  // We have transclusion slots,
                  // collect them up, compile them and store their transclusion functions
                  $template = document.createDocumentFragment();

                  const slotMap = Object.create(null);
                  const filledSlots = Object.create(null);

                  // Parse the element selectors
                  Object.entries(directiveValue).forEach(
                    ([slotName, elementSelector]) => {
                      // If an element selector starts with a ? then it is optional
                      const optional = elementSelector.charAt(0) === "?";
                      elementSelector = optional
                        ? elementSelector.substring(1)
                        : elementSelector;

                      slotMap[elementSelector] = slotName;

                      // We explicitly assign `null` since this implies that a slot was defined but not filled.
                      // Later when calling boundTransclusion functions with a slot name we only error if the
                      // slot is `undefined`
                      slots[slotName] = null;

                      // filledSlots contains `true` for all slots that are either optional or have been
                      // filled. This is used to check that we have not missed any required slots
                      filledSlots[slotName] = optional;
                    },
                  );

                  // Add the matching elements into their slot
                  compileNodeRef.element.childNodes.forEach((node) => {
                    const slotName =
                      slotMap[
                        directiveNormalize(
                          getNodeName(/** @type {Element} */ (node)),
                        )
                      ];
                    if (slotName) {
                      filledSlots[slotName] = true;
                      slots[slotName] =
                        slots[slotName] || document.createDocumentFragment();
                      slots[slotName].appendChild(node);
                    } else {
                      $template.appendChild(node);
                    }
                  });

                  // Check for required slots that were not filled
                  Object.entries(filledSlots).forEach(([slotName, filled]) => {
                    if (!filled) {
                      throw $compileMinErr(
                        "reqslot",
                        "Required transclusion slot `{0}` was not filled.",
                        slotName,
                      );
                    }
                  });

                  for (const slotName in slots) {
                    if (slots[slotName]) {
                      // Only define a transclusion function if the slot was filled
                      const slotCompileNodes = slots[slotName].childNodes;
                      slots[slotName] = compilationGenerator(
                        mightHaveMultipleTransclusionError,
                        slotCompileNodes,
                        transcludeFn,
                      );
                    }
                  }

                  $template = $template.childNodes;
                }

                emptyElement(/** @type {Element} */ (compileNode)); // clear contents on transcluded directives

                // lazily compile transcluded template and generate a transcluded link function
                // @ts-ignore
                childTranscludeFn = compilationGenerator(
                  mightHaveMultipleTransclusionError,
                  $template,
                  transcludeFn,
                  undefined,
                  undefined,
                  {
                    needsNewScope:
                      directive.$$isolateScope || directive.$$newScope,
                  },
                );
                childTranscludeFn["$$slots"] = slots;
              }
            }

            if (directive.template) {
              hasTemplate = true;
              assertNoDuplicate(
                "template",
                templateDirective,
                directive,
                compileNodeRef,
              );
              templateDirective = directive;

              directiveValue = isFunction(directive.template)
                ? directive.template(compileNodeRef.node, templateAttrs)
                : directive.template;

              directiveValue = denormalizeTemplate(directiveValue);
              if (directive.replace) {
                replaceDirective = directive;
                if (isTextNode(directiveValue)) {
                  $template = [];
                } else {
                  $template = removeComments(
                    wrapTemplate(
                      directive.templateNamespace,
                      trim(directiveValue),
                    ),
                  );
                }

                if (isString($template)) {
                  $template = Array.from(
                    createNodelistFromHTML($template),
                  ).filter((x) => x.nodeType === Node.ELEMENT_NODE);
                }
                compileNode = $template[0];

                if (
                  $template.length !== 1 ||
                  compileNode.nodeType !== Node.ELEMENT_NODE
                ) {
                  throw $compileMinErr(
                    "tplrt",
                    "Template for directive '{0}' must have exactly one root element. {1}",
                    directiveName,
                    "",
                  );
                }

                replaceWith(compileNodeRef, compileNode);

                if (parentNodeRef) {
                  parentNodeRef.setIndex(index, compileNode);
                }

                const newTemplateAttrs = { $attr: {} };

                // combine directives from the original node and from the template:
                // - take the array of directives for this element
                // - split it into two parts, those that already applied (processed) and those that weren't (unprocessed)
                // - collect directives from the template and sort them by priority
                // - combine directives as: processed + template + unprocessed
                const templateDirectives = collectDirectives(
                  /** @type {Element} */ (compileNode),
                  newTemplateAttrs,
                );
                const unprocessedDirectives = directives.splice(
                  i + 1,
                  directives.length - (i + 1),
                );

                if (newIsolateScopeDirective || newScopeDirective) {
                  // The original directive caused the current element to be replaced but this element
                  // also needs to have a new scope, so we need to tell the template directives
                  // that they would need to get their scope from further up, if they require transclusion
                  markDirectiveScope(
                    templateDirectives,
                    newIsolateScopeDirective,
                    newScopeDirective,
                  );
                }
                directives = directives
                  .concat(templateDirectives)
                  .concat(unprocessedDirectives);

                mergeTemplateAttributes(templateAttrs, newTemplateAttrs);

                ii = directives.length;
              } else {
                if (compileNodeRef.isElement()) {
                  compileNodeRef.element.innerHTML = directiveValue;
                }
              }
            }

            if (directive.templateUrl) {
              hasTemplate = true;
              assertNoDuplicate(
                "template",
                templateDirective,
                directive,
                compileNodeRef,
              );
              templateDirective = directive;

              if (directive.replace) {
                replaceDirective = directive;
              }
              // @ts-ignore
              nodeLinkFn = compileTemplateUrl(
                directives.splice(i, directives.length - i),
                compileNodeRef,
                templateAttrs,
                /** @type {Element} */ (compileNode),
                hasTranscludeDirective && childTranscludeFn,
                preLinkFns,
                postLinkFns,
                {
                  index,
                  controllerDirectives,
                  newScopeDirective:
                    newScopeDirective !== directive && newScopeDirective,
                  newIsolateScopeDirective,
                  templateDirective,
                  nonTlbTranscludeDirective,
                  futureParentElement:
                    previousCompileContext.futureParentElement,
                },
              );
              ii = directives.length;
            } else if (directive.compile) {
              try {
                /** @type {PublicLinkFn} */
                const linkFn = directive.compile(
                  compileNodeRef.getAny(),
                  templateAttrs,
                  childTranscludeFn,
                );
                const context = directive.$$originalDirective || directive;
                if (isFunction(linkFn)) {
                  addLinkFns(null, bind(context, linkFn));
                } else if (linkFn) {
                  addLinkFns(
                    bind(context, linkFn["pre"]),
                    bind(context, linkFn["post"]),
                  );
                }
              } catch (e) {
                $exceptionHandler(e, startingTag(compileNodeRef.getAny()));
              }
            }

            if (directive.terminal) {
              terminal = true;
              terminalPriority = Math.max(terminalPriority, directive.priority);
            }
          }

          previousCompileContext.hasElementTranscludeDirective =
            hasElementTranscludeDirective;

          // might be normal or delayed nodeLinkFn depending on if templateUrl is present
          return {
            nodeLinkFn,
            terminal,
            transclude: childTranscludeFn,
            transcludeOnThisElement: hasTranscludeDirective,
            templateOnThisElement: hasTemplate,
            newScope: newScopeDirective && newScopeDirective.scope === true,
          };

          /// /////////////////
          function addLinkFns(pre, post) {
            if (pre) {
              pre.require = directive.require;
              pre.directiveName = directiveName;
              if (
                newIsolateScopeDirective === directive ||
                directive.$$isolateScope
              ) {
                pre = cloneAndAnnotateFn(pre, { isolateScope: true });
              }
              preLinkFns.push(pre);
            }
            if (post) {
              post.require = directive.require;
              post.directiveName = directiveName;
              if (
                newIsolateScopeDirective === directive ||
                directive.$$isolateScope
              ) {
                post = cloneAndAnnotateFn(post, { isolateScope: true });
              }
              postLinkFns.push(post);
            }
          }
        }

        /**
         *
         * @param {*} directiveName
         * @param {*} require
         * @param {Element} $element
         * @param {*} elementControllers
         * @returns
         */
        function getControllers(
          directiveName,
          require,
          $element,
          elementControllers,
        ) {
          let value;

          if (isString(require)) {
            const match = require.match(REQUIRE_PREFIX_REGEXP);
            const name = require.substring(match[0].length);
            const inheritType = match[1] || match[3];
            const optional = match[2] === "?";

            // If only parents then start at the parent element
            if (inheritType === "^^") {
              if ($element.parentElement) {
                $element = $element.parentElement;
              } else {
                $element = undefined;
              }
              // Otherwise attempt getting the controller from elementControllers in case
              // the element is transcluded (and has no data) and to avoid .data if possible
            } else {
              value = elementControllers && elementControllers[name];
              value = value && value.instance;
            }

            if (!value) {
              const dataName = `$${name}Controller`;
              if (
                inheritType === "^^" &&
                $element &&
                $element.nodeType === Node.DOCUMENT_NODE
              ) {
                // inheritedData() uses the documentElement when it finds the document, so we would
                // require from the element itself.
                value = null;
              } else {
                value = $element
                  ? inheritType
                    ? getInheritedData($element, dataName)
                    : getCacheData($element, dataName)
                  : undefined;
              }
            }
            if (!value && !optional) {
              throw $compileMinErr(
                "ctreq",
                "Controller '{0}', required by directive '{1}', can't be found!",
                name,
                directiveName,
              );
            }
          } else if (Array.isArray(require)) {
            value = [];
            for (let i = 0, ii = require.length; i < ii; i++) {
              value[i] = getControllers(
                directiveName,
                require[i],
                $element,
                elementControllers,
              );
            }
          } else if (isObject(require)) {
            value = {};
            Object.entries(require).forEach(([property, controller]) => {
              value[property] = getControllers(
                directiveName,
                controller,
                $element,
                elementControllers,
              );
            });
          }

          return value || null;
        }

        /**
         * @param {NodeRef} $element
         * @param attrs
         * @param transcludeFn
         * @param controllerDirectives
         * @param isolateScope
         * @param scope
         * @param newIsolateScopeDirective
         * @returns {any}
         */
        function setupControllers(
          $element,
          attrs,
          transcludeFn,
          controllerDirectives,
          isolateScope,
          scope,
          newIsolateScopeDirective,
        ) {
          const elementControllers = Object.create(null);
          for (const controllerKey in controllerDirectives) {
            const directive = controllerDirectives[controllerKey];
            const locals = {
              $scope:
                directive === newIsolateScopeDirective ||
                directive.$$isolateScope
                  ? isolateScope
                  : scope,
              $element: $element.node,
              $attrs: attrs,
              $transclude: transcludeFn,
            };

            let { controller } = directive;
            if (controller === "@") {
              controller = attrs[directive.name];
            }

            const controllerInstance = $controller(
              controller,
              locals,
              true,
              directive.controllerAs,
            );

            // For directives with element transclusion the element is a comment.
            // In this case .data will not attach any data.
            // Instead, we save the controllers for the element in a local hash and attach to .data
            // later, once we have the actual element.
            elementControllers[directive.name] = controllerInstance;
            if ($element.isElement()) {
              setCacheData(
                $element.element,
                `$${directive.name}Controller`,
                controllerInstance.instance,
              );
            }
          }
          return elementControllers;
        }

        // Depending upon the context in which a directive finds itself it might need to have a new isolated
        // or child scope created. For instance:
        // * if the directive has been pulled into a template because another directive with a higher priority
        // asked for element transclusion
        // * if the directive itself asks for transclusion but it is at the root of a template and the original
        // element was replaced. See https://github.com/angular/angular.js/issues/12936
        function markDirectiveScope(directives, isolateScope, newScope) {
          for (let j = 0, jj = directives.length; j < jj; j++) {
            directives[j] = inherit(directives[j], {
              $$isolateScope: isolateScope,
              $$newScope: newScope,
            });
          }
        }

        /**
         * looks up the directive and decorates it with exception handling and proper parameters. We
         * call this the boundDirective.
         *
         * @param {string} name name of the directive to look up.
         * @param {string} location The directive must be found in specific format.
         *   String containing any of these characters:
         *
         *   * `E`: element name
         *   * `A': attribute
         * @returns {boolean} true if directive was added.
         */
        function addDirective(tDirectives, name, location, maxPriority) {
          let match = false;
          if (hasOwn(hasDirectives, name)) {
            for (
              let directive,
                directives = $injector.get(name + DirectiveSuffix),
                i = 0,
                ii = directives.length;
              i < ii;
              i++
            ) {
              directive = directives[i];
              if (
                (isUndefined(maxPriority) ||
                  maxPriority > directive.priority) &&
                directive.restrict.indexOf(location) !== -1
              ) {
                if (!directive.$$bindings) {
                  const bindings = (directive.$$bindings =
                    parseDirectiveBindings(directive, directive.name));
                  if (isObject(bindings.isolateScope)) {
                    directive.$$isolateBindings = bindings.isolateScope;
                  }
                }
                tDirectives.push(directive);
                match = directive;
              }
            }
          }
          return match;
        }

        /**
         * When the element is replaced with HTML template then the new attributes
         * on the template need to be merged with the existing attributes in the DOM.
         * The desired effect is to have both of the attributes present.
         *
         * @param {object} dst destination attributes (original DOM)
         * @param {object} src source attributes (from the directive template)
         */
        function mergeTemplateAttributes(dst, src) {
          const srcAttr = src.$attr;
          const dstAttr = dst.$attr;

          // reapply the old attributes to the new element
          Object.entries(dst).forEach(([key, value]) => {
            if (key.charAt(0) !== "$") {
              if (src[key] && src[key] !== value) {
                if (value.length) {
                  value += (key === "style" ? ";" : " ") + src[key];
                } else {
                  value = src[key];
                }
              }
              dst.$set(key, value, true, srcAttr[key]);
            }
          });

          // copy the new attributes on the old attrs object
          Object.entries(src).forEach(([key, value]) => {
            // Check if we already set this attribute in the loop above.
            // `dst` will never contain hasOwnProperty as DOM parser won't let it.
            // You will get an "InvalidCharacterError: DOM Exception 5" error if you
            // have an attribute like "has-own-property" or "data-has-own-property", etc.
            if (!hasOwn(dst, key) && key.charAt(0) !== "$") {
              dst[key] = value;

              if (key !== "class" && key !== "style") {
                dstAttr[key] = srcAttr[key];
              }
            }
          });
        }

        /**
         *
         * @param {import("../../interface.ts").Directive[]} directives
         * @param {NodeRef} $compileNode
         * @param {Attributes} tAttrs
         * @param {Element} $rootElement
         * @param {*} childTranscludeFn
         * @param {Array} preLinkFns
         * @param {Array} postLinkFns
         * @param {*} previousCompileContext
         * @returns
         */
        function compileTemplateUrl(
          directives,
          $compileNode,
          tAttrs,
          $rootElement,
          childTranscludeFn,
          preLinkFns,
          postLinkFns,
          previousCompileContext,
        ) {
          let linkQueue = [];
          /** @type {any} */
          let afterTemplateNodeLinkFn;
          let afterTemplateChildLinkFn;
          let afterTemplateNodeLinkFnCtx;
          const beforeTemplateCompileNode = $compileNode.getAny();
          const origAsyncDirective = directives.shift();
          const derivedSyncDirective = inherit(origAsyncDirective, {
            templateUrl: null,
            transclude: null,
            replace: null,
            $$originalDirective: origAsyncDirective,
          });
          const templateUrl = isFunction(origAsyncDirective.templateUrl)
            ? /** @type { ((element: Element, tAttrs: Attributes) => string) } */ (
                origAsyncDirective.templateUrl
              )($compileNode.element, tAttrs)
            : origAsyncDirective.templateUrl;
          const { templateNamespace } = origAsyncDirective;

          emptyElement($compileNode.element);

          $templateRequest(templateUrl)
            .then((content) => {
              /** @type {Element} */
              let compileNode;
              let tempTemplateAttrs;
              let $template;
              let childBoundTranscludeFn;

              content = denormalizeTemplate(content);

              if (origAsyncDirective.replace) {
                if (isTextNode(content)) {
                  $template = [];
                } else if (isString(content)) {
                  $template = Array.from(
                    createNodelistFromHTML(content),
                  ).filter(
                    (node) =>
                      node.nodeType !== Node.COMMENT_NODE &&
                      node.nodeType !== Node.TEXT_NODE,
                  );
                } else {
                  $template = removeComments(
                    wrapTemplate(templateNamespace, trim(content)),
                  );
                }
                compileNode = $template[0];
                if (
                  $template.length !== 1 ||
                  compileNode.nodeType !== Node.ELEMENT_NODE
                ) {
                  throw $compileMinErr(
                    "tplrt",
                    "Template for directive '{0}' must have exactly one root element. {1}",
                    origAsyncDirective.name,
                    templateUrl,
                  );
                }

                tempTemplateAttrs = { $attr: {} };

                replaceWith(
                  $compileNode,
                  compileNode,
                  previousCompileContext.index,
                );

                const templateDirectives = collectDirectives(
                  compileNode,
                  tempTemplateAttrs,
                );

                if (isObject(origAsyncDirective.scope)) {
                  // the original directive that caused the template to be loaded async required
                  // an isolate scope
                  markDirectiveScope(templateDirectives, true);
                }
                directives = templateDirectives.concat(directives);

                mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
              } else {
                compileNode = /** @type {Element} */ (
                  beforeTemplateCompileNode
                );
                $compileNode.element.innerHTML = content;
              }

              directives.unshift(derivedSyncDirective);
              afterTemplateNodeLinkFnCtx = applyDirectivesToNode(
                directives,
                compileNode,
                tAttrs,
                childTranscludeFn,
                origAsyncDirective,
                preLinkFns,
                postLinkFns,
                { ...previousCompileContext, ctxNodeRef: $compileNode },
              );

              afterTemplateNodeLinkFn = afterTemplateNodeLinkFnCtx?.nodeLinkFn;
              if ($rootElement) {
                Object.entries($rootElement).forEach(([i, node]) => {
                  if (node === compileNode) {
                    $rootElement[i] = $compileNode;
                  }
                });
              }
              afterTemplateChildLinkFn = compileNodes(
                new NodeRef($compileNode.getAny().childNodes),
                childTranscludeFn,
              );

              while (linkQueue.length) {
                const scope = linkQueue.shift();
                const beforeTemplateLinkNode = linkQueue.shift();
                const boundTranscludeFn = linkQueue.shift();
                let linkNode = $compileNode.getAny();

                if (scope.$$destroyed) {
                  continue;
                }

                if (beforeTemplateLinkNode !== beforeTemplateCompileNode) {
                  const oldClasses = beforeTemplateLinkNode.className;

                  if (
                    !(
                      previousCompileContext.hasElementTranscludeDirective &&
                      origAsyncDirective.replace
                    )
                  ) {
                    // it was cloned therefore we have to clone as well.
                    linkNode = compileNode.cloneNode(true);
                    beforeTemplateLinkNode.appendChild(linkNode);
                  }
                  // Copy in CSS classes from original node
                  try {
                    if (oldClasses !== "") {
                      $compileNode.element.classList.forEach((cls) =>
                        beforeTemplateLinkNode.classList.add(cls),
                      );
                    }
                  } catch {
                    // ignore, since it means that we are trying to set class on
                    // SVG element, where class name is read-only.
                  }
                }
                if (afterTemplateNodeLinkFnCtx.transcludeOnThisElement) {
                  childBoundTranscludeFn = createBoundTranscludeFn(
                    scope,
                    afterTemplateNodeLinkFnCtx.transclude,
                    boundTranscludeFn,
                  );
                } else {
                  childBoundTranscludeFn = boundTranscludeFn;
                }

                afterTemplateNodeLinkFn(
                  afterTemplateChildLinkFn,
                  scope,
                  linkNode,
                  childBoundTranscludeFn,
                );
              }
              linkQueue = null;
            })
            .catch((error) => {
              if (isError(error)) {
                $exceptionHandler(error);
              }
            });

          return function delayedNodeLinkFn(
            _ignoreChildLinkFn,
            scope,
            node,
            rootElement,
            boundTranscludeFn,
          ) {
            let childBoundTranscludeFn = boundTranscludeFn;
            if (scope.$$destroyed) {
              return;
            }
            if (linkQueue) {
              linkQueue.push(scope, node, rootElement);
            } else {
              if (afterTemplateNodeLinkFn.transcludeOnThisElement) {
                childBoundTranscludeFn = createBoundTranscludeFn(
                  scope,
                  afterTemplateNodeLinkFn.transclude,
                  boundTranscludeFn,
                );
              }
              afterTemplateNodeLinkFn(
                afterTemplateChildLinkFn,
                scope,
                node,
                rootElement,
                childBoundTranscludeFn,
              );
            }
          };
        }

        /**
         * Sorting function for bound directives.
         */
        function byPriority(a, b) {
          const diff = b.priority - a.priority;
          if (diff !== 0) {
            return diff;
          }
          if (a.name !== b.name) {
            return a.name < b.name ? -1 : 1;
          }
          return a.index - b.index;
        }

        function assertNoDuplicate(
          what,
          previousDirective,
          directive,
          element,
        ) {
          function wrapModuleNameIfDefined(moduleName) {
            return moduleName ? ` (module: ${moduleName})` : "";
          }

          if (previousDirective) {
            throw $compileMinErr(
              "multidir",
              "Multiple directives [{0}{1}, {2}{3}] asking for {4} on: {5}",
              previousDirective.name,
              wrapModuleNameIfDefined(previousDirective.$$moduleName),
              directive.name,
              wrapModuleNameIfDefined(directive.$$moduleName),
              what,
              startingTag(element.getAny()),
            );
          }
        }

        function addTextInterpolateDirective(directives, text) {
          const interpolateFn = $interpolate(text, true);
          if (interpolateFn) {
            directives.push({
              priority: 0,
              compile: () => (scope, node) => {
                interpolateFn.expressions.forEach((x) => {
                  scope.$watch(x, () => {
                    const res = interpolateFn(
                      isProxy(scope) ? scope.$target : scope,
                    );
                    switch (node.nodeType) {
                      case 1:
                        node.innerHTML = res;
                        break;
                      default:
                        node.nodeValue = res;
                    }
                  });
                });
              },
            });
          }
        }

        /**
         * @param {string} type
         * @param {string} template
         * @returns
         */
        function wrapTemplate(type, template) {
          type = (type || "html").toLowerCase();
          switch (type) {
            case "svg":
            case "math":
              /** @type {HTMLDivElement} */
              var wrapper = document.createElement("div");
              wrapper.innerHTML = `<${type}>${template}</${type}>`;
              return wrapper.childNodes[0].childNodes;
            default:
              return template;
          }
        }

        function getTrustedAttrContext(nodeName, attrNormalizedName) {
          if (attrNormalizedName === "srcdoc") {
            return $sce.HTML;
          }
          // All nodes with src attributes require a RESOURCE_URL value, except for
          // img and various html5 media nodes, which require the MEDIA_URL context.
          if (attrNormalizedName === "src" || attrNormalizedName === "ngSrc") {
            if (
              ["img", "video", "audio", "source", "track"].indexOf(nodeName) ===
              -1
            ) {
              return $sce.RESOURCE_URL;
            }
            return $sce.MEDIA_URL;
          }
          if (attrNormalizedName === "xlinkHref") {
            // Some xlink:href are okay, most aren't
            if (nodeName === "image") {
              return $sce.MEDIA_URL;
            }
            if (nodeName === "a") {
              return $sce.URL;
            }
            return $sce.RESOURCE_URL;
          }
          if (
            // Formaction
            (nodeName === "form" && attrNormalizedName === "action") ||
            // If relative URLs can go where they are not expected to, then
            // all sorts of trust issues can arise.
            (nodeName === "base" && attrNormalizedName === "href") ||
            // links can be stylesheets or imports, which can run script in the current origin
            (nodeName === "link" && attrNormalizedName === "href")
          ) {
            return $sce.RESOURCE_URL;
          }
          if (
            nodeName === "a" &&
            (attrNormalizedName === "href" || attrNormalizedName === "ngHref")
          ) {
            return $sce.URL;
          }
        }

        function getTrustedPropContext(nodeName, propNormalizedName) {
          const prop = propNormalizedName.toLowerCase();
          return (
            PROP_CONTEXTS[`${nodeName}|${prop}`] || PROP_CONTEXTS[`*|${prop}`]
          );
        }

        function sanitizeSrcset(value, invokeType) {
          if (!value) {
            return value;
          }
          if (!isString(value)) {
            throw $compileMinErr(
              "srcset",
              'Can\'t pass trusted values to `{0}`: "{1}"',
              invokeType,
              value.toString(),
            );
          }

          // Such values are a bit too complex to handle automatically inside $sce.
          // Instead, we sanitize each of the URIs individually, which works, even dynamically.
          // It's not possible to work around this using `$sce.trustAsMediaUrl`.
          // If you want to programmatically set explicitly trusted unsafe URLs, you should use
          // `$sce.trustAsHtml` on the whole `img` tag and inject it into the DOM using the
          // `ng-bind-html` directive.
          var result = "";

          // first check if there are spaces because it's not the same pattern
          var trimmedSrcset = trim(value);
          //                (   999x   ,|   999w   ,|   ,|,   )
          var srcPattern = /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/;
          var pattern = /\s/.test(trimmedSrcset) ? srcPattern : /(,)/;

          // split srcset into tuple of uri and descriptor except for the last item
          var rawUris = trimmedSrcset.split(pattern);

          // for each tuples
          var nbrUrisWith2parts = Math.floor(rawUris.length / 2);
          for (var i = 0; i < nbrUrisWith2parts; i++) {
            var innerIdx = i * 2;
            // sanitize the uri
            result += $sce.getTrustedMediaUrl(trim(rawUris[innerIdx]));
            // add the descriptor
            result += " " + trim(rawUris[innerIdx + 1]);
          }

          // split the last item into uri and descriptor
          var lastTuple = trim(rawUris[i * 2]).split(/\s/);

          // sanitize the last uri
          result += $sce.getTrustedMediaUrl(trim(lastTuple[0]));

          // and add the last descriptor if any
          if (lastTuple.length === 2) {
            result += " " + trim(lastTuple[1]);
          }
          return result;
        }

        function addPropertyDirective(node, directives, attrName, propName) {
          if (EVENT_HANDLER_ATTR_REGEXP.test(propName)) {
            throw $compileMinErr(
              "nodomevents",
              "Property bindings for HTML DOM event properties are disallowed",
            );
          }

          const nodeName = getNodeName(node);
          const trustedContext = getTrustedPropContext(nodeName, propName);

          let sanitizer = (x) => x;
          // Sanitize img[srcset] + source[srcset] values.
          if (
            propName === "srcset" &&
            (nodeName === "img" || nodeName === "source")
          ) {
            sanitizer = (value) =>
              sanitizeSrcset($sce.valueOf(value), "ng-prop-srcset");
          } else if (trustedContext) {
            sanitizer = $sce.getTrusted.bind($sce, trustedContext);
          }

          directives.push({
            priority: 100,
            compile: function ngPropCompileFn(_, attr) {
              const ngPropGetter = $parse(attr[attrName]);
              return {
                pre: function ngPropPreLinkFn(scope, $element) {
                  function applyPropValue() {
                    const propValue = ngPropGetter(scope);
                    $element[propName] = sanitizer(propValue);
                  }

                  applyPropValue();
                  scope.$watch(propName, applyPropValue);
                  scope.$watch(attr[attrName], (val) => {
                    $sce.valueOf(val);
                    applyPropValue();
                  });
                },
              };
            },
          });
        }

        function addAttrInterpolateDirective(
          node,
          directives,
          value,
          name,
          isNgAttr,
        ) {
          const nodeName = getNodeName(node);
          const trustedContext = getTrustedAttrContext(nodeName, name);
          const mustHaveExpression = !isNgAttr;
          const allOrNothing = ALL_OR_NOTHING_ATTRS.includes(name) || isNgAttr;

          let interpolateFn = $interpolate(
            value,
            mustHaveExpression,
            trustedContext,
            allOrNothing,
          );

          // no interpolation found -> ignore
          if (!interpolateFn) {
            return;
          }

          if (name === "multiple" && nodeName === "select") {
            throw $compileMinErr(
              "selmulti",
              "Binding to the 'multiple' attribute is not supported. Element: {0}",
              startingTag(node.outerHTML),
            );
          }

          if (EVENT_HANDLER_ATTR_REGEXP.test(name)) {
            throw $compileMinErr(
              "nodomevents",
              "Interpolations for HTML DOM event attributes are disallowed",
            );
          }

          directives.push({
            priority: 100,
            compile() {
              return {
                pre: function attrInterpolatePreLinkFn(scope, element, attr) {
                  const $$observers =
                    attr.$$observers ||
                    (attr.$$observers = Object.create(null));

                  // If the attribute has changed since last $interpolate()ed
                  const newValue = attr[name];
                  if (newValue !== value) {
                    // we need to interpolate again since the attribute value has been updated
                    // (e.g. by another directive's compile function)
                    // ensure unset/empty values make interpolateFn falsy
                    interpolateFn =
                      newValue &&
                      $interpolate(
                        newValue,
                        true,
                        trustedContext,
                        allOrNothing,
                      );
                    value = newValue;
                  }

                  // if attribute was updated so that there is no interpolation going on we don't want to
                  // register any observers
                  if (!interpolateFn) {
                    return;
                  }

                  // initialize attr object so that it's ready in case we need the value for isolate
                  // scope initialization, otherwise the value would not be available from isolate
                  // directive's linking fn during linking phase
                  attr[name] = interpolateFn(scope);

                  ($$observers[name] || ($$observers[name] = [])).$$inter =
                    true;
                  interpolateFn.expressions.forEach((x) => {
                    const targetScope =
                      (attr.$$observers && attr.$$observers[name].$$scope) ||
                      scope;
                    targetScope.$watch(x, () => {
                      let newValue = interpolateFn(scope);
                      // special case for class attribute addition + removal
                      // so that class changes can tap into the animation
                      // hooks provided by the $animate service. Be sure to
                      // skip animations when the first digest occurs (when
                      // both the new and the old values are the same) since
                      // the CSS classes are the non-interpolated values
                      if (name === "class") {
                        attr.$updateClass(
                          newValue,
                          attr.$$element.classList.value,
                        );
                      } else {
                        attr.$set(name, newValue);
                      }
                    });
                  });

                  if (interpolateFn.expressions.length == 0) {
                    // if there is nothing to watch, its a constant
                    attr.$set(name, newValue);
                  }
                },
              };
            },
          });
        }

        /**
         *
         * @param {NodeRef} elementsToRemove The JQLite element which we are going to replace. We keep
         *                                  the shell, but replace its DOM node reference.
         * @param {Node} newNode The new DOM node.
         * @param {number} [index] Parent node index.
         */
        function replaceWith(elementsToRemove, newNode, index) {
          const firstElementToRemove = elementsToRemove.getAny();
          // const removeCount = elementsToRemove.length;
          const parent = firstElementToRemove.parentNode;

          if (parent) {
            if (isDefined(index)) {
              const oldChild = parent.childNodes[index];
              if (oldChild) {
                parent.replaceChild(newNode, oldChild);
              }
            } else {
              parent.insertBefore(newNode, parent.firstChild);
              //parent.append(newNode);
            }
          }

          // Append all the `elementsToRemove` to a fragment. This will...
          // - remove them from the DOM
          // - allow them to still be traversed with .nextSibling
          // - allow a single fragment.qSA to fetch all elements being removed
          const fragment = document.createDocumentFragment();
          elementsToRemove.collection().forEach((element) => {
            fragment.appendChild(element);
          });

          elementsToRemove.node = newNode;
        }

        function cloneAndAnnotateFn(fn, annotation) {
          return extend(
            function () {
              return fn.apply(null, arguments);
            },
            fn,
            annotation,
          );
        }

        function strictBindingsCheck(attrName, directiveName) {
          if (strictComponentBindingsEnabled) {
            throw $compileMinErr(
              "missingattr",
              "Attribute '{0}' of '{1}' is non-optional and must be set!",
              attrName,
              directiveName,
            );
          }
        }

        // Set up $watches for isolate scope and controller bindings.
        /**
         *
         * @param {import('../scope/scope.js').Scope} scope
         * @param {*} attrs
         * @param {import('../scope/scope.js').Scope}  destination - child scope or isolate scope
         * @param {*} bindings
         * @param {*} directive
         * @returns
         */
        function initializeDirectiveBindings(
          scope,
          attrs,
          destination,
          bindings,
          directive,
        ) {
          const removeWatchCollection = [];
          const initialChanges = {};
          let changes;

          if (bindings) {
            Object.entries(bindings).forEach(([scopeName, definition]) => {
              const {
                attrName,
                optional,
                mode, // @, =, <, or &
              } = definition;
              let lastValue;
              let parentGet;
              let parentSet;
              let compare;
              let removeWatch;
              let firstCall = true;
              let firstChange = true;

              switch (mode) {
                case "@":
                  if (!optional && !hasOwn(attrs, attrName)) {
                    strictBindingsCheck(attrName, directive.name);
                    destination[scopeName] = attrs[attrName] = undefined;
                  }

                  removeWatch = attrs.$observe(attrName, (value) => {
                    if (isString(value) || isBoolean(value)) {
                      recordChanges(scopeName, value, firstChange);

                      destination[scopeName] = value;
                      if (firstCall) {
                        firstCall = false;
                      } else {
                        triggerOnChangesHook();
                        firstChange = false;
                      }
                    }
                  });
                  attrs.$$observers[attrName].$$scope = scope;
                  lastValue = attrs[attrName];
                  if (isString(lastValue)) {
                    // If the attribute has been provided then we trigger an interpolation to ensure
                    // the value is there for use in the link fn
                    destination[scopeName] = $interpolate(lastValue)(scope);
                  } else if (isBoolean(lastValue)) {
                    // If the attributes is one of the BOOLEAN_ATTR then AngularTS will have converted
                    // the value to boolean rather than a string, so we special case this situation
                    destination[scopeName] = lastValue;
                  }

                  /**
                   * @type {SimpleChange}
                   */
                  initialChanges[scopeName] = {
                    currentValue: destination[scopeName],
                    firstChange: true,
                  };
                  removeWatchCollection.push(removeWatch);
                  break;

                case "=":
                  if (!hasOwn(attrs, attrName)) {
                    if (optional) {
                      break;
                    }
                    strictBindingsCheck(attrName, directive.name);
                    attrs[attrName] = undefined;
                  }
                  if (optional && !attrs[attrName]) {
                    break;
                  }

                  parentGet = $parse(attrs[attrName]);
                  var complexExpression = !!parentGet.inputs;
                  if (parentGet.literal) {
                    compare = equals;
                  } else {
                    compare = simpleCompare;
                  }

                  parentSet =
                    parentGet.assign ||
                    function () {
                      // reset the change, or we will throw this exception on every $digest
                      lastValue = destination.$target[scopeName] =
                        parentGet(scope);
                      throw $compileMinErr(
                        "nonassign",
                        "Expression '{0}' in attribute '{1}' used with directive '{2}' is non-assignable!",
                        attrs[attrName],
                        attrName,
                        directive.name,
                      );
                    };
                  // store the value that the parent scope had after the last check:
                  lastValue = destination.$target[scopeName] = parentGet(
                    scope.$target,
                  );
                  var parentValueWatch = function parentValueWatch(
                    parentValue,
                  ) {
                    if (!compare(parentValue, destination[scopeName])) {
                      // we are out of sync and need to copy
                      if (!compare(parentValue, lastValue)) {
                        // parent changed and it has precedence
                        destination[scopeName] = parentValue;
                      } else {
                        // if the parent can be assigned then do so
                        parentSet(
                          scope,
                          (parentValue = destination[scopeName]),
                        );
                      }
                    }
                    lastValue = parentValue;
                    return lastValue;
                  };
                  parentValueWatch.$stateful = true;
                  if (definition.collection) {
                    removeWatch = scope.$watch(
                      attrs[attrName],
                      parentValueWatch,
                    );
                  } else {
                    if (attrs[attrName]) {
                      let expr = attrs[attrName];
                      // make it lazy as we dont want to trigger the two way data binding at this point
                      scope.$watch(
                        expr,
                        (val) => {
                          var res = $parse(attrs[attrName], parentValueWatch);
                          if (val) {
                            if (parentGet.literal) {
                              scope.$target[attrName] = val;
                            } else {
                              scope[attrName] = val;
                            }
                            res(scope);
                          } else {
                            scope[attrName] = scope[attrs[attrName]];
                          }
                        },
                        true,
                      );
                    }

                    removeWatch = destination.$watch(
                      attrName,
                      (val) => {
                        if (
                          val === lastValue &&
                          !isUndefined(attrs[attrName])
                        ) {
                          return;
                        }
                        if (
                          (complexExpression && !parentGet.literal) ||
                          (isUndefined(attrs[attrName]) && isDefined(val))
                        ) {
                          destination.$target[attrName] = lastValue;
                          throw $compileMinErr(
                            "nonassign",
                            "Expression '{0}' in attribute '{1}' used with directive '{2}' is non-assignable!",
                            attrs[attrName],
                            attrName,
                            directive.name,
                          );
                        } else {
                          // manually set the handler to avoid watch cycles
                          if (isObject(val)) {
                            Object.entries(val).forEach(([key, value]) => {
                              scope.$target[key] = value;
                            });
                          } else {
                            parentSet(scope.$target, (lastValue = val));
                            scope.$handler.watchers
                              .get(attrs[attrName])
                              ?.forEach((watchFn) => {
                                watchFn.listenerFn(val);
                              });
                          }
                        }
                      },
                      true,
                    );
                  }
                  removeWatchCollection.push(removeWatch);
                  break;

                case "<":
                  if (!hasOwn(attrs, attrName)) {
                    if (optional) {
                      break;
                    }
                    strictBindingsCheck(attrName, directive.name);
                    attrs[attrName] = undefined;
                  }
                  if (optional && !attrs[attrName]) {
                    break;
                  }

                  parentGet = $parse(attrs[attrName]);

                  destination.$target[scopeName] = parentGet(scope.$target);
                  /** @type {SimpleChange} */
                  initialChanges[scopeName] = {
                    currentValue: destination.$target[scopeName],
                    firstChange: firstChange,
                  };
                  scope.$target.attrs = attrs;

                  if (attrs[attrName]) {
                    removeWatch = scope.$watch(
                      attrs[attrName],
                      (val) => {
                        destination.$target[scopeName] = val;
                        recordChanges(scopeName, val, firstChange);
                        if (firstChange) {
                          firstChange = false;
                        }
                      },
                      true,
                    );
                    removeWatchCollection.push(removeWatch);
                  }
                  break;

                case "&":
                  if (!optional && !hasOwn(attrs, attrName)) {
                    strictBindingsCheck(attrName, directive.name);
                  }
                  // Don't assign Object.prototype method to scope
                  parentGet = hasOwn(attrs, attrName)
                    ? $parse(attrs[attrName])
                    : () => {};

                  // Don't assign noop to destination if expression is not valid
                  if (
                    parentGet.toString() === (() => {}).toString() &&
                    optional
                  ) {
                    break;
                  }

                  destination.$target[scopeName] = function (locals) {
                    return parentGet(scope.$target, locals);
                  };

                  break;
              }
            });
          }

          function recordChanges(key, currentValue, initial) {
            if (isFunction(destination["$onChanges"])) {
              // If we have not already scheduled the top level onChangesQueue handler then do so now
              if (!onChangesQueue) {
                scope.$postUpdate(flushOnChangesQueue);
                onChangesQueue = [];
              }
              // If we have not already queued a trigger of onChanges for this controller then do so now
              if (!changes) {
                changes = {};
                onChangesQueue.push(triggerOnChangesHook);
              }
              // Store this change
              changes[key] = {
                currentValue: currentValue,
                firstChange: initial,
              };
            }
          }

          function triggerOnChangesHook() {
            destination["$onChanges"] && destination["$onChanges"](changes);
            // Now clear the changes so that we schedule onChanges when more changes arrive
            changes = undefined;
          }

          return {
            initialChanges,
            removeWatches:
              removeWatchCollection.length &&
              function removeWatches() {
                for (
                  let i = 0, ii = removeWatchCollection.length;
                  i < ii;
                  ++i
                ) {
                  removeWatchCollection[i]();
                }
              },
          };
        }
      },
    ];
  }
}

function removeComments(jqNodes) {
  let i = jqNodes.length;

  if (i <= 1) {
    return jqNodes;
  }

  while (i--) {
    const node = jqNodes[i];
    if (
      node.nodeType === Node.COMMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === "")
    ) {
      [].splice.call(jqNodes, i, 1);
    }
  }
  return jqNodes;
}

/**
 * @param {String} name
 * @returns {void}
 */
function assertValidDirectiveName(name) {
  const letter = name.charAt(0);
  if (!letter || letter !== lowercase(letter)) {
    throw $compileMinErr(
      "baddir",
      "Directive/Component name '{0}' is invalid. The first character must be a lowercase letter",
      name,
    );
  }
  if (name !== name.trim()) {
    throw $compileMinErr(
      "baddir",
      "Directive/Component name '{0}' is invalid. The name should not contain leading or trailing whitespaces",
      name,
    );
  }
}
