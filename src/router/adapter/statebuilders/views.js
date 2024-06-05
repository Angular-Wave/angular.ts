import { pick, forEach, tail } from "../../../shared/common";
import { isDefined, isString } from "../../../shared/utils";
import { isInjectable } from "../../../shared/predicates";
import { services } from "../../core/common/coreservices";
import { trace } from "../../core/common/trace";
import { ViewService } from "../../core/view/view";
import { ResolveContext } from "../../core/resolve/resolveContext";
import { Resolvable } from "../../core/resolve/resolvable";

/** @internalapi */
export function getNg1ViewConfigFactory() {
  let templateFactory = null;
  return (path, view) => {
    templateFactory =
      templateFactory || services.$injector.get("$templateFactory");
    return [new Ng1ViewConfig(path, view, templateFactory)];
  };
}
/** @internalapi */
const hasAnyKey = (keys, obj) =>
  keys.reduce((acc, key) => acc || isDefined(obj[key]), false);
/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to @uirouter/angularjs (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 *
 * @internalapi
 */
export function ng1ViewsBuilder(state) {
  // Do not process root state
  if (!state.parent) return {};
  const tplKeys = [
      "templateProvider",
      "templateUrl",
      "template",
      "notify",
      "async",
    ],
    ctrlKeys = [
      "controller",
      "controllerProvider",
      "controllerAs",
      "resolveAs",
    ],
    compKeys = ["component", "bindings", "componentProvider"],
    nonCompKeys = tplKeys.concat(ctrlKeys),
    allViewKeys = compKeys.concat(nonCompKeys);
  // Do not allow a state to have both state-level props and also a `views: {}` property.
  // A state without a `views: {}` property can declare properties for the `$default` view as properties of the state.
  // However, the `$default` approach should not be mixed with a separate `views: ` block.
  if (isDefined(state.views) && hasAnyKey(allViewKeys, state)) {
    throw new Error(
      `State '${state.name}' has a 'views' object. ` +
        `It cannot also have "view properties" at the state level.  ` +
        `Move the following properties into a view (in the 'views' object): ` +
        ` ${allViewKeys.filter((key) => isDefined(state[key])).join(", ")}`,
    );
  }
  const views = {},
    viewsObject = state.views || { $default: pick(state, allViewKeys) };
  forEach(viewsObject, function (config, name) {
    // Account for views: { "": { template... } }
    name = name || "$default";
    // Account for views: { header: "headerComponent" }
    if (isString(config)) config = { component: config };
    // Make a shallow copy of the config object
    config = Object.assign({}, config);
    // Do not allow a view to mix props for component-style view with props for template/controller-style view
    if (hasAnyKey(compKeys, config) && hasAnyKey(nonCompKeys, config)) {
      throw new Error(
        `Cannot combine: ${compKeys.join("|")} with: ${nonCompKeys.join("|")} in stateview: '${name}@${state.name}'`,
      );
    }
    config.resolveAs = config.resolveAs || "$resolve";
    config.$type = "ng1";
    config.$context = state;
    config.$name = name;
    const normalized = ViewService.normalizeUIViewTarget(
      config.$context,
      config.$name,
    );
    config.$uiViewName = normalized.uiViewName;
    config.$uiViewContextAnchor = normalized.uiViewContextAnchor;
    views[name] = config;
  });
  return views;
}
/** @hidden */
let id = 0;
/** @internalapi */
export class Ng1ViewConfig {
  constructor(path, viewDecl, factory) {
    this.path = path;
    this.viewDecl = viewDecl;
    this.factory = factory;
    this.$id = id++;
    this.loaded = false;
    this.getTemplate = (uiView, context) =>
      this.component
        ? this.factory.makeComponentTemplate(
            uiView,
            context,
            this.component,
            this.viewDecl.bindings,
          )
        : this.template;
  }
  load() {
    const $q = services.$q;
    const context = new ResolveContext(this.path);
    const params = this.path.reduce(
      (acc, node) => Object.assign(acc, node.paramValues),
      {},
    );
    const promises = {
      template: $q.when(
        this.factory.fromConfig(this.viewDecl, params, context),
      ),
      controller: $q.when(this.getController(context)),
    };
    return $q.all(promises).then((results) => {
      trace.traceViewServiceEvent("Loaded", this);
      this.controller = results.controller;
      Object.assign(this, results.template); // Either { template: "tpl" } or { component: "cmpName" }
      return this;
    });
  }
  /**
   * Gets the controller for a view configuration.
   *
   * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
   */
  getController(context) {
    const provider = this.viewDecl.controllerProvider;
    if (!isInjectable(provider)) return this.viewDecl.controller;
    const deps = services.$injector.annotate(provider);
    const providerFn = Array.isArray(provider) ? tail(provider) : provider;
    const resolvable = new Resolvable("", providerFn, deps);
    return resolvable.get(context);
  }
}
