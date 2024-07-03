import { TransitionHookScope, TransitionHookPhase } from "./interface";
import { Transition } from "./transition";
import { makeEvent } from "./hook-registry";
import {
  registerAddCoreResolvables,
  treeChangesCleanup,
} from "../hooks/core-resolvables";
import {
  registerOnExitHook,
  registerOnRetainHook,
  registerOnEnterHook,
} from "../hooks/on-enter-exit-retain";
import {
  registerEagerResolvePath,
  registerLazyResolveState,
  registerResolveRemaining,
} from "../hooks/resolve";
import {
  registerActivateViews,
  registerLoadEnteringViews,
} from "../hooks/views";
import { registerUpdateGlobalState } from "../hooks/update-globals";

import { registerLazyLoadHook } from "../hooks/lazy-load";
import { TransitionEventType } from "./transition-event-type";
import { TransitionHook } from "./transition-hook";
import { isDefined } from "../../shared/utils";
import { createProxyFunctions } from "../../shared/common";
import { val } from "../../shared/hof";
import { registerIgnoredTransitionHook } from "../hooks/ignored-transition";
import { registerInvalidTransitionHook } from "../hooks/invalid-transition";
import { registerRedirectToHook } from "../hooks/redirect-to";
import { registerUpdateUrl } from "../hooks/url";
/**
 * The default [[Transition]] options.
 *
 * Include this object when applying custom defaults:
 * let reloadOpts = { reload: true, notify: true }
 * let options = defaults(theirOpts, customDefaults, defaultOptions);
 */
export let defaultTransOpts = {
  location: true,
  relative: null,
  inherit: false,
  notify: true,
  reload: false,
  supercede: true,
  custom: {},
  current: () => null,
  source: "unknown",
};
/**
 * This class provides services related to Transitions.
 *
 * - Most importantly, it allows global Transition Hooks to be registered.
 * - It allows the default transition error handler to be set.
 * - It also has a factory function for creating new [[Transition]] objects, (used internally by the [[StateService]]).
 *
 * At bootstrap, [[UIRouter]] creates a single instance (singleton) of this class.
 *
 * This API is located at `router.transitionService` ([[UIRouter.transitionService]])
 */
export class TransitionService {
  static $inject = ["$routerGlobalsProvider", "$viewProvider"];

  /**
   * @param {import('../globals').UIRouterGlobals} globals
   */
  constructor(globals, viewService) {
    this._transitionCount = 0;
    /** The transition hook types, such as `onEnter`, `onStart`, etc */
    this._eventTypes = [];
    /** @internal The registered transition hooks */
    this._registeredHooks = {};
    /** The  paths on a criteria object */
    this._criteriaPaths = {};
    this.globals = globals;
    this.$view = viewService;
    this._deregisterHookFns = {};
    this._pluginapi = createProxyFunctions(val(this), {}, val(this), [
      "_definePathType",
      "_defineEvent",
      "_getPathTypes",
      "_getEvents",
      "getHooks",
    ]);
    this._defineCorePaths();
    this._defineCoreEvents();
    this._registerCoreTransitionHooks();
    globals.successfulTransitions.onEvict(treeChangesCleanup);
  }

  $get = [
    "$state",
    "$urlService",
    "$stateRegistry",
    "$view",
    (stateService, urlService, stateRegistry, viewService) => {
      // Lazy load state trees
      this._deregisterHookFns.lazyLoad = registerLazyLoadHook(
        this,
        stateService,
        urlService,
        stateRegistry,
      );

      // After globals.current is updated at priority: 10000
      this._deregisterHookFns.updateUrl = registerUpdateUrl(
        this,
        stateService,
        urlService,
      );

      // Wire up redirectTo hook
      this._deregisterHookFns.redirectTo = registerRedirectToHook(
        this,
        stateService,
      );

      this._deregisterHookFns.activateViews = registerActivateViews(
        this,
        viewService,
      );
      return this;
    },
  ];
  /**
   * Registers a [[TransitionHookFn]], called *while a transition is being constructed*.
   *
   * Registers a transition lifecycle hook, which is invoked during transition construction.
   *
   * This low level hook should only be used by plugins.
   * This can be a useful time for plugins to add resolves or mutate the transition as needed.
   * The Sticky States plugin uses this hook to modify the treechanges.
   *
   * ### Lifecycle
   *
   * `onCreate` hooks are invoked *while a transition is being constructed*.
   *
   * ### Return value
   *
   * The hook's return value is ignored
   *
   * @internal
   * @param criteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be invoked.
   * @param options the registration options
   * @returns a function which deregisters the hook.
   */

  /**
   * Creates a new [[Transition]] object
   *
   * This is a factory function for creating new Transition objects.
   * It is used internally by the [[StateService]] and should generally not be called by application code.
   *
   * @internal
   * @param fromPath the path to the current state (the from state)
   * @param targetState the target state (destination)
   * @returns a Transition
   */
  create(fromPath, targetState) {
    return new Transition(fromPath, targetState, this, this.globals);
  }

  _defineCoreEvents() {
    const Phase = TransitionHookPhase;
    const TH = TransitionHook;
    const paths = this._criteriaPaths;
    const NORMAL_SORT = false,
      REVERSE_SORT = true;
    const SYNCHRONOUS = true;
    this._defineEvent(
      "onCreate",
      Phase.CREATE,
      0,
      paths.to,
      NORMAL_SORT,
      TH.LOG_REJECTED_RESULT,
      TH.THROW_ERROR,
      SYNCHRONOUS,
    );
    this._defineEvent("onBefore", Phase.BEFORE, 0, paths.to);
    this._defineEvent("onStart", Phase.RUN, 0, paths.to);
    this._defineEvent("onExit", Phase.RUN, 100, paths.exiting, REVERSE_SORT);
    this._defineEvent("onRetain", Phase.RUN, 200, paths.retained);
    this._defineEvent("onEnter", Phase.RUN, 300, paths.entering);
    this._defineEvent("onFinish", Phase.RUN, 400, paths.to);
    this._defineEvent(
      "onSuccess",
      Phase.SUCCESS,
      0,
      paths.to,
      NORMAL_SORT,
      TH.LOG_REJECTED_RESULT,
      TH.LOG_ERROR,
      SYNCHRONOUS,
    );
    this._defineEvent(
      "onError",
      Phase.ERROR,
      0,
      paths.to,
      NORMAL_SORT,
      TH.LOG_REJECTED_RESULT,
      TH.LOG_ERROR,
      SYNCHRONOUS,
    );
  }

  _defineCorePaths() {
    const { STATE, TRANSITION } = TransitionHookScope;
    this._definePathType("to", TRANSITION);
    this._definePathType("from", TRANSITION);
    this._definePathType("exiting", STATE);
    this._definePathType("retained", STATE);
    this._definePathType("entering", STATE);
  }

  _defineEvent(
    name,
    hookPhase,
    hookOrder,
    criteriaMatchPath,
    reverseSort = false,
    getResultHandler = TransitionHook.HANDLE_RESULT,
    getErrorHandler = TransitionHook.REJECT_ERROR,
    synchronous = false,
  ) {
    const eventType = new TransitionEventType(
      name,
      hookPhase,
      hookOrder,
      criteriaMatchPath,
      reverseSort,
      getResultHandler,
      getErrorHandler,
      synchronous,
    );
    this._eventTypes.push(eventType);
    makeEvent(this, this, eventType);
  }

  _getEvents(phase) {
    const transitionHookTypes = isDefined(phase)
      ? this._eventTypes.filter((type) => type.hookPhase === phase)
      : this._eventTypes.slice();
    return transitionHookTypes.sort((l, r) => {
      const cmpByPhase = l.hookPhase - r.hookPhase;
      return cmpByPhase === 0 ? l.hookOrder - r.hookOrder : cmpByPhase;
    });
  }
  /**
   * Adds a Path to be used as a criterion against a TreeChanges path
   *
   * For example: the `exiting` path in [[HookMatchCriteria]] is a STATE scoped path.
   * It was defined by calling `defineTreeChangesCriterion('exiting', TransitionHookScope.STATE)`
   * Each state in the exiting path is checked against the criteria and returned as part of the match.
   *
   * Another example: the `to` path in [[HookMatchCriteria]] is a TRANSITION scoped path.
   * It was defined by calling `defineTreeChangesCriterion('to', TransitionHookScope.TRANSITION)`
   * Only the tail of the `to` path is checked against the criteria and returned as part of the match.
   *
   * @internal
   */
  _definePathType(name, hookScope) {
    this._criteriaPaths[name] = { name, scope: hookScope };
  }

  _getPathTypes() {
    return this._criteriaPaths;
  }

  getHooks(hookName) {
    return this._registeredHooks[hookName];
  }

  _registerCoreTransitionHooks() {
    const fns = this._deregisterHookFns;
    fns.addCoreResolves = registerAddCoreResolvables(this);
    fns.ignored = registerIgnoredTransitionHook(this);
    fns.invalid = registerInvalidTransitionHook(this);

    // Wire up onExit/Retain/Enter state hooks
    fns.onExit = registerOnExitHook(this);
    fns.onRetain = registerOnRetainHook(this);
    fns.onEnter = registerOnEnterHook(this);
    // Wire up Resolve hooks
    fns.eagerResolve = registerEagerResolvePath(this);
    fns.lazyResolve = registerLazyResolveState(this);
    fns.resolveAll = registerResolveRemaining(this);
    // Wire up the View management hooks
    fns.loadViews = registerLoadEnteringViews(this);

    // Updates global state after a transition
    fns.updateGlobals = registerUpdateGlobalState(this);
    // Lazy load state trees
    fns.lazyLoad = registerLazyLoadHook(this);
  }
}
