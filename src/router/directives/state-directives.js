/**
 * # Angular 1 Directives
 *
 * These are the directives included in ng-router for Angular 1.
 * These directives are used in templates to create viewports and link/navigate to states.
 *
 */
import {
  forEach,
  tail,
  unnestR,
  uniqR,
  inArray,
  removeFrom,
} from "../../shared/common";
import { isString, isObject } from "../../shared/utils";

import { parse } from "../../shared/hof";
/** @hidden */
function parseStateRef(ref) {
  const paramsOnly = ref.match(/^\s*({[^}]*})\s*$/);
  if (paramsOnly) ref = "(" + paramsOnly[1] + ")";
  const parsed = ref
    .replace(/\n/g, " ")
    .match(/^\s*([^(]*?)\s*(\((.*)\))?\s*$/);
  if (!parsed || parsed.length !== 4)
    throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1] || null, paramExpr: parsed[3] || null };
}
/** @hidden */
function stateContext(el) {
  const $ngView = el.parent().inheritedData("$ngView");
  const path = parse("$cfg.path")($ngView);
  return path ? tail(path).state.name : undefined;
}
/** @hidden */
function processedDef($state, $element, def) {
  const ngState = def.ngState || $state.current.name;
  const ngStateOpts = Object.assign(
    defaultOpts($element, $state),
    def.ngStateOpts || {},
  );
  const href = $state.href(ngState, def.ngStateParams, ngStateOpts);
  return { ngState, ngStateParams: def.ngStateParams, ngStateOpts, href };
}
/** @hidden */
function getTypeInfo(el) {
  // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
  const isSvg =
    Object.prototype.toString.call(el[0].getAttribute("href")) ===
    "[object SVGAnimatedString]";
  const isForm = el[0].nodeName === "FORM";
  return {
    attr: isForm ? "action" : isSvg ? "xlink:href" : "href",
    isAnchor: el[0].nodeName === "A",
    clickable: !isForm,
  };
}
/** @hidden */
function clickHook(el, $state, $timeout, type, getDef) {
  return function (e) {
    const button = e.which || e.button,
      target = getDef();

    let res =
      button > 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey ||
      el.attr("target");
    if (!res) {
      // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
      const transition = $timeout(function () {
        if (!el.attr("disabled")) {
          $state.go(target.ngState, target.ngStateParams, target.ngStateOpts);
        }
      });
      e.preventDefault();
      // if the state has no URL, ignore one preventDefault from the <a> directive.
      let ignorePreventDefaultCount = type.isAnchor && !target.href ? 1 : 0;
      e.preventDefault = function () {
        if (ignorePreventDefaultCount-- <= 0) $timeout.cancel(transition);
      };
    } else {
      // ignored
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
}
/** @hidden */
function defaultOpts(el, $state) {
  return {
    relative: stateContext(el) || $state.$current,
    inherit: true,
    source: "sref",
  };
}
/** @hidden */
function bindEvents(element, scope, hookFn, ngStateOpts) {
  let events;
  if (ngStateOpts) {
    events = ngStateOpts.events;
  }
  if (!Array.isArray(events)) {
    events = ["click"];
  }
  const on = element.on ? "on" : "bind";
  for (const event of events) {
    element[on](event, hookFn);
  }
  scope.$on("$destroy", function () {
    const off = element.off ? "off" : "unbind";
    for (const event of events) {
      element[off](event, hookFn);
    }
  });
}
/**
 * `ui-sref`: A directive for linking to a state
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * ### Linked State
 * The attribute value of the `ui-sref` is the name of the state to link to.
 *
 * #### Example:
 * This will activate the `home` state when the link is clicked.
 * ```html
 * <a ui-sref="home">Home</a>
 * ```
 *
 * ### Relative Links
 * You can also use relative state paths within `ui-sref`, just like a relative path passed to `$state.go()` ([[StateService.go]]).
 * You just need to be aware that the path is relative to the state that *created* the link.
 * This allows a state to create a relative `ui-sref` which always targets the same destination.
 *
 * #### Example:
 * Both these links are relative to the parent state, even when a child state is currently active.
 * ```html
 * <a ui-sref=".child1">child 1 state</a>
 * <a ui-sref=".child2">child 2 state</a>
 * ```
 *
 * This link activates the parent state.
 * ```html
 * <a ui-sref="^">Return</a>
 * ```
 *
 * ### hrefs
 * If the linked state has a URL, the directive will automatically generate and
 * update the `href` attribute (using the [[StateService.href]]  method).
 *
 * #### Example:
 * Assuming the `users` state has a url of `/users/`
 * ```html
 * <a ui-sref="users" href="/users/">Users</a>
 * ```
 *
 * ### Parameter Values
 * In addition to the state name, a `ui-sref` can include parameter values which are applied when activating the state.
 * Param values can be provided in the `ui-sref` value after the state name, enclosed by parentheses.
 * The content inside the parentheses is an expression, evaluated to the parameter values.
 *
 * #### Example:
 * This example renders a list of links to users.
 * The state's `userId` parameter value comes from each user's `user.id` property.
 * ```html
 * <li ng-repeat="user in users">
 *   <a ui-sref="users.detail({ userId: user.id })">{{ user.displayName }}</a>
 * </li>
 * ```
 *
 * Note:
 * The parameter values expression is `$watch`ed for updates.
 *
 * ### Transition Options
 * You can specify [[TransitionOptions]] to pass to [[StateService.go]] by using the `ui-sref-opts` attribute.
 * Options are restricted to `location`, `inherit`, and `reload`.
 *
 * #### Example:
 * ```html
 * <a ui-sref="home" ui-sref-opts="{ reload: true }">Home</a>
 * ```
 *
 * ### Other DOM Events
 *
 * You can also customize which DOM events to respond to (instead of `click`) by
 * providing an `events` array in the `ui-sref-opts` attribute.
 *
 * #### Example:
 * ```html
 * <input type="text" ui-sref="contacts" ui-sref-opts="{ events: ['change', 'blur'] }">
 * ```
 *
 * ### Highlighting the active link
 * This directive can be used in conjunction with [[ngSrefActive]] to highlight the active link.
 *
 * ### Examples
 * If you have the following template:
 *
 * ```html
 * <a ui-sref="home">Home</a>
 * <a ui-sref="about">About</a>
 * <a ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * ```
 *
 * Then (assuming the current state is `contacts`) the rendered html including hrefs would be:
 *
 * ```html
 * <a href="#/home" ui-sref="home">Home</a>
 * <a href="#/about" ui-sref="about">About</a>
 * <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a href="#/home" ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * ```
 *
 * ### Notes
 *
 * - You can use `ui-sref` to change **only the parameter values** by omitting the state name and parentheses.
 * #### Example:
 * Sets the `lang` parameter to `en` and remains on the same state.
 *
 * ```html
 * <a ui-sref="{ lang: 'en' }">English</a>
 * ```
 *
 * - A middle-click, right-click, or ctrl-click is handled (natively) by the browser to open the href in a new window, for example.
 *
 * - Unlike the parameter values expression, the state name is not `$watch`ed (for performance reasons).
 * If you need to dynamically update the state being linked to, use the fully dynamic [[ngState]] directive.
 */
export let ngSrefDirective = [
  "$router",
  "$timeout",
  function $StateRefDirective($router, $timeout) {
    const $state = $router.stateService;
    return {
      restrict: "A",
      require: ["?^ngSrefActive", "?^ngSrefActiveEq"],
      link: (scope, element, attrs, ngSrefActive) => {
        const type = getTypeInfo(element);
        const active = ngSrefActive[1] || ngSrefActive[0];
        let unlinkInfoFn = null;
        const rawDef = {};
        const getDef = () => processedDef($state, element, rawDef);
        const ref = parseStateRef(attrs.ngSref);
        rawDef.ngState = ref.state;
        rawDef.ngStateOpts = attrs.ngSrefOpts
          ? scope.$eval(attrs.ngSrefOpts)
          : {};
        function update() {
          const def = getDef();
          if (unlinkInfoFn) unlinkInfoFn();
          if (active)
            unlinkInfoFn = active.$$addStateInfo(
              def.ngState,
              def.ngStateParams,
            );
          if (def.href != null) attrs.$set(type.attr, def.href);
        }
        if (ref.paramExpr) {
          scope.$watch(
            ref.paramExpr,
            function (val) {
              rawDef.ngStateParams = Object.assign({}, val);
              update();
            },
            true,
          );
          rawDef.ngStateParams = Object.assign({}, scope.$eval(ref.paramExpr));
        }
        update();
        scope.$on("$destroy", $router.stateRegistry.onStatesChanged(update));
        scope.$on("$destroy", $router.transitionService.onSuccess({}, update));
        if (!type.clickable) return;
        const hookFn = clickHook(element, $state, $timeout, type, getDef);
        bindEvents(element, scope, hookFn, rawDef.ngStateOpts);
      },
    };
  },
];
/**
 * `ng-state`: A fully dynamic directive for linking to a state
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * **This directive is very similar to [[ngSref]], but it `$observe`s and `$watch`es/evaluates all its inputs.**
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * ### Linked State
 * The attribute value of `ng-state` is an expression which is `$watch`ed and evaluated as the state to link to.
 * **This is in contrast with `ui-sref`, which takes a state name as a string literal.**
 *
 * #### Example:
 * Create a list of links.
 * ```html
 * <li ng-repeat="link in navlinks">
 *   <a ng-state="link.state">{{ link.displayName }}</a>
 * </li>
 * ```
 *
 * ### Relative Links
 * If the expression evaluates to a relative path, it is processed like [[ngSref]].
 * You just need to be aware that the path is relative to the state that *created* the link.
 * This allows a state to create relative `ng-state` which always targets the same destination.
 *
 * ### hrefs
 * If the linked state has a URL, the directive will automatically generate and
 * update the `href` attribute (using the [[StateService.href]]  method).
 *
 * ### Parameter Values
 * In addition to the state name expression, a `ng-state` can include parameter values which are applied when activating the state.
 * Param values should be provided using the `ng-state-params` attribute.
 * The `ng-state-params` attribute value is `$watch`ed and evaluated as an expression.
 *
 * #### Example:
 * This example renders a list of links with param values.
 * The state's `userId` parameter value comes from each user's `user.id` property.
 * ```html
 * <li ng-repeat="link in navlinks">
 *   <a ng-state="link.state" ng-state-params="link.params">{{ link.displayName }}</a>
 * </li>
 * ```
 *
 * ### Transition Options
 * You can specify [[TransitionOptions]] to pass to [[StateService.go]] by using the `ng-state-opts` attribute.
 * Options are restricted to `location`, `inherit`, and `reload`.
 * The value of the `ng-state-opts` is `$watch`ed and evaluated as an expression.
 *
 * #### Example:
 * ```html
 * <a ng-state="returnto.state" ng-state-opts="{ reload: true }">Home</a>
 * ```
 *
 * ### Other DOM Events
 *
 * You can also customize which DOM events to respond to (instead of `click`) by
 * providing an `events` array in the `ng-state-opts` attribute.
 *
 * #### Example:
 * ```html
 * <input type="text" ng-state="contacts" ng-state-opts="{ events: ['change', 'blur'] }">
 * ```
 *
 * ### Highlighting the active link
 * This directive can be used in conjunction with [[ngSrefActive]] to highlight the active link.
 *
 * ### Notes
 *
 * - You can use `ui-params` to change **only the parameter values** by omitting the state name and supplying only `ng-state-params`.
 *   However, it might be simpler to use [[ngSref]] parameter-only links.
 *
 * #### Example:
 * Sets the `lang` parameter to `en` and remains on the same state.
 *
 * ```html
 * <a ng-state="" ng-state-params="{ lang: 'en' }">English</a>
 * ```
 *
 * - A middle-click, right-click, or ctrl-click is handled (natively) by the browser to open the href in a new window, for example.
 * ```
 */
export let ngStateDirective = [
  "$router",
  "$timeout",
  function $StateRefDynamicDirective($router, $timeout) {
    const $state = $router.stateService;
    return {
      restrict: "A",
      require: ["?^ngSrefActive", "?^ngSrefActiveEq"],
      link: function (scope, element, attrs, ngSrefActive) {
        const type = getTypeInfo(element);
        const active = ngSrefActive[1] || ngSrefActive[0];
        let unlinkInfoFn = null;
        let hookFn;
        const rawDef = {};
        const getDef = () => processedDef($state, element, rawDef);
        const inputAttrs = ["ngState", "ngStateParams", "ngStateOpts"];
        const watchDeregFns = inputAttrs.reduce(
          (acc, attr) => ((acc[attr] = () => {}), acc),
          {},
        );
        function update() {
          const def = getDef();
          if (unlinkInfoFn) unlinkInfoFn();
          if (active)
            unlinkInfoFn = active.$$addStateInfo(
              def.ngState,
              def.ngStateParams,
            );
          if (def.href != null) attrs.$set(type.attr, def.href);
        }
        inputAttrs.forEach((field) => {
          rawDef[field] = attrs[field] ? scope.$eval(attrs[field]) : null;
          attrs.$observe(field, (expr) => {
            watchDeregFns[field]();
            watchDeregFns[field] = scope.$watch(
              expr,
              (newval) => {
                rawDef[field] = newval;
                update();
              },
              true,
            );
          });
        });
        update();
        scope.$on("$destroy", $router.stateRegistry.onStatesChanged(update));
        scope.$on("$destroy", $router.transitionService.onSuccess({}, update));
        if (!type.clickable) return;
        hookFn = clickHook(element, $state, $timeout, type, getDef);
        bindEvents(element, scope, hookFn, rawDef.ngStateOpts);
      },
    };
  },
];
/**
 * `ui-sref-active` and `ui-sref-active-eq`: A directive that adds a CSS class when a `ui-sref` is active
 *
 * A directive working alongside [[ngSref]] and [[ngState]] to add classes to an element when the
 * related directive's state is active (and remove them when it is inactive).
 *
 * The primary use-case is to highlight the active link in navigation menus,
 * distinguishing it from the inactive menu items.
 *
 * ### Linking to a `ui-sref` or `ng-state`
 * `ui-sref-active` can live on the same element as `ui-sref`/`ng-state`, or it can be on a parent element.
 * If a `ui-sref-active` is a parent to more than one `ui-sref`/`ng-state`, it will apply the CSS class when **any of the links are active**.
 *
 * ### Matching
 *
 * The `ui-sref-active` directive applies the CSS class when the `ui-sref`/`ng-state`'s target state **or any child state is active**.
 * This is a "fuzzy match" which uses [[StateService.includes]].
 *
 * The `ui-sref-active-eq` directive applies the CSS class when the `ui-sref`/`ng-state`'s target state is directly active (not when child states are active).
 * This is an "exact match" which uses [[StateService.is]].
 *
 * ### Parameter values
 * If the `ui-sref`/`ng-state` includes parameter values, the current parameter values must match the link's values for the link to be highlighted.
 * This allows a list of links to the same state with different parameters to be rendered, and the correct one highlighted.
 *
 * #### Example:
 * ```html
 * <li ng-repeat="user in users" ui-sref-active="active">
 *   <a ui-sref="user.details({ userId: user.id })">{{ user.lastName }}</a>
 * </li>
 * ```
 *
 * ### Examples
 *
 * Given the following template:
 * #### Example:
 * ```html
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * ```
 *
 * When the app state is `app.user` (or any child state),
 * and contains the state parameter "user" with value "bilbobaggins",
 * the resulting HTML will appear as (note the 'active' class):
 *
 * ```html
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * ```
 *
 * ### Glob mode
 *
 * It is possible to pass `ui-sref-active` an expression that evaluates to an object.
 * The objects keys represent active class names and values represent the respective state names/globs.
 * `ui-sref-active` will match if the current active state **includes** any of
 * the specified state names/globs, even the abstract ones.
 *
 * #### Example:
 * Given the following template, with "admin" being an abstract state:
 * ```html
 * <div ui-sref-active="{'active': 'admin.**'}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * ```
 *
 * Arrays are also supported as values in the `ngClass`-like interface.
 * This allows multiple states to add `active` class.
 *
 * #### Example:
 * Given the following template, with "admin.roles" being the current state, the class will be added too:
 * ```html
 * <div ui-sref-active="{'active': ['owner.**', 'admin.**']}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * ```
 *
 * When the current state is "admin.roles" the "active" class will be applied to both the `<div>` and `<a>` elements.
 * It is important to note that the state names/globs passed to `ui-sref-active` override any state provided by a linked `ui-sref`.
 *
 * ### Notes:
 *
 * - The class name is interpolated **once** during the directives link time (any further changes to the
 * interpolated value are ignored).
 *
 * - Multiple classes may be specified in a space-separated format: `ui-sref-active='class1 class2 class3'`
 */
export let ngSrefActiveDirective = [
  "$state",
  "$stateParams",
  "$interpolate",
  "$router",
  function $StateRefActiveDirective(
    $state,
    $stateParams,
    $interpolate,
    $router,
  ) {
    return {
      restrict: "A",
      controller: [
        "$scope",
        "$element",
        "$attrs",
        function ($scope, $element, $attrs) {
          let states = [];
          let activeEqClass;
          let ngSrefActive;
          // There probably isn't much point in $observing this
          // ngSrefActive and ngSrefActiveEq share the same directive object with some
          // slight difference in logic routing
          activeEqClass = $interpolate(
            $attrs.ngSrefActiveEq || "",
            false,
          )($scope);
          try {
            ngSrefActive = $scope.$eval($attrs.ngSrefActive);
          } catch (e) {
            // Do nothing. ngSrefActive is not a valid expression.
            // Fall back to using $interpolate below
          }
          ngSrefActive =
            ngSrefActive ||
            $interpolate($attrs.ngSrefActive || "", false)($scope);
          setStatesFromDefinitionObject(ngSrefActive);
          // Allow ngSref to communicate with ngSrefActive[Equals]
          this.$$addStateInfo = function (newState, newParams) {
            // we already got an explicit state provided by ui-sref-active, so we
            // shadow the one that comes from ui-sref
            if (isObject(ngSrefActive) && states.length > 0) {
              return;
            }
            const deregister = addState(newState, newParams, ngSrefActive);
            update();
            return deregister;
          };
          function updateAfterTransition(trans) {
            trans.promise.then(update, () => {});
          }
          $scope.$on("$destroy", setupEventListeners());
          if ($router.globals.transition) {
            updateAfterTransition($router.globals.transition);
          }
          function setupEventListeners() {
            const deregisterStatesChangedListener =
              $router.stateRegistry.onStatesChanged(handleStatesChanged);
            const deregisterOnStartListener = $router.transitionService.onStart(
              {},
              updateAfterTransition,
            );
            const deregisterStateChangeSuccessListener = $scope.$on(
              "$stateChangeSuccess",
              update,
            );
            return function cleanUp() {
              deregisterStatesChangedListener();
              deregisterOnStartListener();
              deregisterStateChangeSuccessListener();
            };
          }
          function handleStatesChanged() {
            setStatesFromDefinitionObject(ngSrefActive);
          }
          function setStatesFromDefinitionObject(statesDefinition) {
            if (isObject(statesDefinition)) {
              states = [];
              forEach(statesDefinition, function (stateOrName, activeClass) {
                // Helper function to abstract adding state.
                const addStateForClass = function (stateOrName, activeClass) {
                  const ref = parseStateRef(stateOrName);
                  addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
                };
                if (isString(stateOrName)) {
                  // If state is string, just add it.
                  addStateForClass(stateOrName, activeClass);
                } else if (Array.isArray(stateOrName)) {
                  // If state is an array, iterate over it and add each array item individually.
                  forEach(stateOrName, function (stateOrName) {
                    addStateForClass(stateOrName, activeClass);
                  });
                }
              });
            }
          }
          function addState(stateName, stateParams, activeClass) {
            const state = $state.get(stateName, stateContext($element));
            const stateInfo = {
              state: state || { name: stateName },
              params: stateParams,
              activeClass: activeClass,
            };
            states.push(stateInfo);
            return function removeState() {
              removeFrom(states)(stateInfo);
            };
          }
          // Update route state
          function update() {
            const splitClasses = (str) => str.split(/\s/).filter(Boolean);
            const getClasses = (stateList) =>
              stateList
                .map((x) => x.activeClass)
                .map(splitClasses)
                .reduce(unnestR, []);
            const allClasses = getClasses(states)
              .concat(splitClasses(activeEqClass))
              .reduce(uniqR, []);
            const fuzzyClasses = getClasses(
              states.filter((x) => $state.includes(x.state.name, x.params)),
            );
            const exactlyMatchesAny = !!states.filter((x) =>
              $state.is(x.state.name, x.params),
            ).length;
            const exactClasses = exactlyMatchesAny
              ? splitClasses(activeEqClass)
              : [];
            const addClasses = fuzzyClasses
              .concat(exactClasses)
              .reduce(uniqR, []);
            const removeClasses = allClasses.filter(
              (cls) => !inArray(addClasses, cls),
            );
            $scope.$evalAsync(() => {
              addClasses.forEach((className) =>
                $element[0].classList.add(className),
              );
              removeClasses.forEach((className) =>
                $element[0].classList.remove(className),
              );
            });
          }
          update();
        },
      ],
    };
  },
];
