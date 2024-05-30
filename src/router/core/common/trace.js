/**
 * # Transition tracing (debug)
 *
 * Enable transition tracing to print transition information to the console,
 * in order to help debug your application.
 * Tracing logs detailed information about each Transition to your console.
 *
 * To enable tracing, import the [[Trace]] singleton and enable one or more categories.
 *
 * ### ES6
 * ```js
 * import {trace} from "@uirouter/core/index";
 * trace.enable(1, 5); // TRANSITION and VIEWCONFIG
 * ```
 *
 * ### CJS
 * ```js
 * let trace = require("@uirouter/core").trace;
 * trace.enable("TRANSITION", "VIEWCONFIG");
 * ```
 *
 * ### Globals
 * ```js
 * let trace = window["@uirouter/core"].trace;
 * trace.enable(); // Trace everything (very verbose)
 * ```
 *
 * ### Angular 1:
 * ```js
 * app.run($trace => $trace.enable());
 * ```
 *
 * @packageDocumentation
 */
import { parse } from "../common/hof";
import { isNumber } from "../common/predicates";
import { stringify, functionToString, maxLength, padString } from "./strings";
import { safeConsole } from "./safeConsole";
function uiViewString(uiview) {
  if (!uiview) return "ui-view (defunct)";
  const state = uiview.creationContext
    ? uiview.creationContext.name || "(root)"
    : "(none)";
  return `[ui-view#${uiview.id} ${uiview.$type}:${uiview.fqn} (${uiview.name}@${state})]`;
}
const viewConfigString = (viewConfig) => {
  const view = viewConfig.viewDecl;
  const state = view.$context.name || "(root)";
  return `[View#${viewConfig.$id} from '${state}' state]: target ui-view: '${view.$uiViewName}@${view.$uiViewContextAnchor}'`;
};
function normalizedCat(input) {
  return isNumber(input) ? Category[input] : Category[Category[input]];
}
/**
 * Trace categories Enum
 *
 * Enable or disable a category using [[Trace.enable]] or [[Trace.disable]]
 *
 * `trace.enable(Category.TRANSITION)`
 *
 * These can also be provided using a matching string, or position ordinal
 *
 * `trace.enable("TRANSITION")`
 *
 * `trace.enable(1)`
 */
var Category;
(function (Category) {
  Category[(Category["RESOLVE"] = 0)] = "RESOLVE";
  Category[(Category["TRANSITION"] = 1)] = "TRANSITION";
  Category[(Category["HOOK"] = 2)] = "HOOK";
  Category[(Category["UIVIEW"] = 3)] = "UIVIEW";
  Category[(Category["VIEWCONFIG"] = 4)] = "VIEWCONFIG";
})(Category || (Category = {}));
export { Category };
const _tid = parse("$id");
const _rid = parse("router.$id");
const transLbl = (trans) => `Transition #${_tid(trans)}-${_rid(trans)}`;
/**
 * Prints UI-Router Transition trace information to the console.
 */
export class Trace {
  /** @internal */
  constructor() {
    /** @internal */
    this._enabled = {};
    this.approximateDigests = 0;
  }
  /** @internal */
  _set(enabled, categories) {
    if (!categories.length) {
      categories = Object.keys(Category)
        .map((k) => parseInt(k, 10))
        .filter((k) => !isNaN(k))
        .map((key) => Category[key]);
    }
    categories
      .map(normalizedCat)
      .forEach((category) => (this._enabled[category] = enabled));
  }
  enable(...categories) {
    this._set(true, categories);
  }
  disable(...categories) {
    this._set(false, categories);
  }
  /**
   * Retrieves the enabled stateus of a [[Category]]
   *
   * ```js
   * trace.enabled("VIEWCONFIG"); // true or false
   * ```
   *
   * @returns boolean true if the category is enabled
   */
  enabled(category) {
    return !!this._enabled[normalizedCat(category)];
  }
  /** @internal called by ui-router code */
  traceTransitionStart(trans) {
    if (!this.enabled(Category.TRANSITION)) return;
    safeConsole.log(`${transLbl(trans)}: Started  -> ${stringify(trans)}`);
  }
  /** @internal called by ui-router code */
  traceTransitionIgnored(trans) {
    if (!this.enabled(Category.TRANSITION)) return;
    safeConsole.log(`${transLbl(trans)}: Ignored  <> ${stringify(trans)}`);
  }
  /** @internal called by ui-router code */
  traceHookInvocation(step, trans, options) {
    if (!this.enabled(Category.HOOK)) return;
    const event = parse("traceData.hookType")(options) || "internal",
      context =
        parse("traceData.context.state.name")(options) ||
        parse("traceData.context")(options) ||
        "unknown",
      name = functionToString(step.registeredHook.callback);
    safeConsole.log(
      `${transLbl(trans)}:   Hook -> ${event} context: ${context}, ${maxLength(200, name)}`,
    );
  }
  /** @internal called by ui-router code */
  traceHookResult(hookResult, trans, transitionOptions) {
    if (!this.enabled(Category.HOOK)) return;
    safeConsole.log(
      `${transLbl(trans)}:   <- Hook returned: ${maxLength(200, stringify(hookResult))}`,
    );
  }
  /** @internal called by ui-router code */
  traceResolvePath(path, when, trans) {
    if (!this.enabled(Category.RESOLVE)) return;
    safeConsole.log(`${transLbl(trans)}:         Resolving ${path} (${when})`);
  }
  /** @internal called by ui-router code */
  traceResolvableResolved(resolvable, trans) {
    if (!this.enabled(Category.RESOLVE)) return;
    safeConsole.log(
      `${transLbl(trans)}:               <- Resolved  ${resolvable} to: ${maxLength(200, stringify(resolvable.data))}`,
    );
  }
  /** @internal called by ui-router code */
  traceError(reason, trans) {
    if (!this.enabled(Category.TRANSITION)) return;
    safeConsole.log(
      `${transLbl(trans)}: <- Rejected ${stringify(trans)}, reason: ${reason}`,
    );
  }
  /** @internal called by ui-router code */
  traceSuccess(finalState, trans) {
    if (!this.enabled(Category.TRANSITION)) return;
    safeConsole.log(
      `${transLbl(trans)}: <- Success  ${stringify(trans)}, final state: ${finalState.name}`,
    );
  }
  /** @internal called by ui-router code */
  traceUIViewEvent(event, viewData, extra = "") {
    if (!this.enabled(Category.UIVIEW)) return;
    safeConsole.log(
      `ui-view: ${padString(30, event)} ${uiViewString(viewData)}${extra}`,
    );
  }
  /** @internal called by ui-router code */
  traceUIViewConfigUpdated(viewData, context) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUIViewEvent(
      "Updating",
      viewData,
      ` with ViewConfig from context='${context}'`,
    );
  }
  /** @internal called by ui-router code */
  traceUIViewFill(viewData, html) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUIViewEvent("Fill", viewData, ` with: ${maxLength(200, html)}`);
  }
  /** @internal called by ui-router code */
  traceViewSync(pairs) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    const uivheader = "uiview component fqn";
    const cfgheader = "view config state (view name)";
    const mapping = pairs
      .map(({ uiView, viewConfig }) => {
        const uiv = uiView && uiView.fqn;
        const cfg =
          viewConfig &&
          `${viewConfig.viewDecl.$context.name}: (${viewConfig.viewDecl.$name})`;
        return { [uivheader]: uiv, [cfgheader]: cfg };
      })
      .sort((a, b) => (a[uivheader] || "").localeCompare(b[uivheader] || ""));
    safeConsole.table(mapping);
  }
  /** @internal called by ui-router code */
  traceViewServiceEvent(event, viewConfig) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    safeConsole.log(`VIEWCONFIG: ${event} ${viewConfigString(viewConfig)}`);
  }
  /** @internal called by ui-router code */
  traceViewServiceUIViewEvent(event, viewData) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    safeConsole.log(`VIEWCONFIG: ${event} ${uiViewString(viewData)}`);
  }
}
/**
 * The [[Trace]] singleton
 *
 * #### Example:
 * ```js
 * import {trace} from "@uirouter/core/index";
 * trace.enable(1, 5);
 * ```
 */
export const trace = new Trace();
