import { $injectTokens as $ } from "../../injection-tokens.js";
import { wait } from "../../shared/test-utils";
import { callBackAfterFirst, isDefined, isObject } from "../../shared/utils.js";

/**
 * @param {"get" | "delete" | "post" | "put"} method
 * @returns {import('../../interface.ts').DirectiveFactory}
 */
function defineDirective(method) {
  const attrName = "ng" + method.charAt(0).toUpperCase() + method.slice(1);
  const directive = createHttpDirective(method, attrName);
  directive["$inject"] = [$.$http, $.$compile, $.$log, $.$parse, $.$state];
  return directive;
}

export const ngGetDirective = defineDirective("get");
export const ngDeleteDirective = defineDirective("delete");
export const ngPostDirective = defineDirective("post");
export const ngPutDirective = defineDirective("put");

/**
 * @typedef {"click" | "change" | "submit"} EventType
 */

/**
 * Selects DOM event to listen for based on the element type.
 *
 * @param {Element} element - The DOM element to inspect.
 * @returns {EventType} The name of the event to listen for.
 */
export function getEventNameForElement(element) {
  const tag = element.tagName.toLowerCase();
  if (["input", "textarea", "select"].includes(tag)) {
    return "change";
  } else if (tag === "form") {
    return "submit";
  }
  return "click";
}

/**
 * Handles DOM manipulation based on a swap strategy and server-rendered HTML.
 *
 * @param {string} html - The HTML string returned from the server.
 * @param {import("../../interface.ts").SwapInsertPosition} swap
 * @param {Element} target - The target DOM element to apply the swap to.
 * @param {import('../../core/scope/scope.js').Scope} scope
 * @param {import('../../core/compile/compile.js').CompileFn} $compile
 */
export function handleSwapResponse(html, swap, target, scope, $compile) {
  let nodes = [];
  if (!["textcontent", "delete", "none"].includes(swap)) {
    if (!html) {
      return;
    }

    if (isObject(html)) {
      scope.$merge(html);
      return;
    }

    const compiled = $compile(html)(scope);
    nodes =
      compiled instanceof DocumentFragment
        ? Array.from(compiled.childNodes)
        : [compiled];
  }

  switch (swap) {
    case "innerHTML":
      target.replaceChildren(...nodes);
      break;

    case "outerHTML": {
      const parent = target.parentNode;
      if (!parent) return;
      const frag = document.createDocumentFragment();
      nodes.forEach((n) => frag.appendChild(n));
      parent.replaceChild(frag, target);
      break;
    }

    case "textContent":
      target.textContent = html;
      break;

    case "beforebegin":
      nodes.forEach((node) => target.parentNode.insertBefore(node, target));
      break;

    case "afterbegin":
      nodes
        .slice()
        .reverse()
        .forEach((node) => target.insertBefore(node, target.firstChild));
      break;

    case "beforeend":
      nodes.forEach((node) => target.appendChild(node));
      break;

    case "afterend":
      nodes
        .slice()
        .reverse()
        .forEach((node) =>
          target.parentNode.insertBefore(node, target.nextSibling),
        );
      break;

    case "delete":
      target.remove();
      break;

    case "none":
      break;

    default:
      target.replaceChildren(...nodes);
      break;
  }
}

/**
 * Creates an HTTP directive factory that supports GET, DELETE, POST, PUT.
 *
 * @param {"get" | "delete" | "post" | "put"} method - HTTP method to use.
 * @param {string} attrName - Attribute name containing the URL.
 * @returns {import('../../interface.ts').DirectiveFactory}
 */
export function createHttpDirective(method, attrName) {
  /**
   * @param {import("interface.ts").HttpService} $http
   * @param {import("../../core/compile/compile.js").CompileFn} $compile
   * @param {import("../../services/log/interface.ts").LogService} $log
   * @param {import("../../core/parse/interface.ts").ParseService} $parse
   * @param {import("../../router/state/state-service.js").StateProvider} $state
   * @returns {import('../../interface.ts').Directive}
   */
  return function ($http, $compile, $log, $parse, $state) {
    /**
     * Collects form data from the element or its associated form.
     *
     * @param {HTMLElement} element
     * @returns {Object<string, any>}
     */
    function collectFormData(element) {
      /** @type {HTMLFormElement | null} */
      let form = null;

      const tag = element.tagName.toLowerCase();

      if (tag === "form") {
        /** @type {HTMLFormElement} */
        form = /** @type {HTMLFormElement} */ (element);
      } else if ("form" in element && element.form) {
        /** @type {HTMLFormElement} */
        form = /** @type {HTMLFormElement} */ (element.form);
      } else if (element.hasAttribute("form")) {
        const formId = element.getAttribute("form");
        if (formId) {
          /** @type {HTMLElement | null} */
          const maybeForm = document.getElementById(formId);
          if (maybeForm && maybeForm.tagName.toLowerCase() === "form") {
            form = /** @type {HTMLFormElement} */ (maybeForm);
          }
        }
      }

      if (!form) {
        if (
          "name" in element &&
          typeof element.name === "string" &&
          element.name.length > 0
        ) {
          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) {
            const key = element.name;
            const value = element.value;
            return { [key]: value };
          }
        }
        return {};
      }

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return data;
    }

    return {
      restrict: "A",
      terminal: true,
      link(scope, element, attrs) {
        const eventName =
          attrs["trigger"] ||
          /** @type {EventType} */ getEventNameForElement(element);

        const tag = element.tagName.toLowerCase();

        if (isDefined(attrs["latch"])) {
          attrs.$observe(
            "latch",
            callBackAfterFirst(() =>
              element.dispatchEvent(new Event(eventName)),
            ),
          );
        }

        let throttled = false;
        let intervalId;

        if (isDefined(attrs["interval"])) {
          element.dispatchEvent(new Event(eventName));
          intervalId = setInterval(
            () => element.dispatchEvent(new Event(eventName)),
            parseInt(attrs["interval"]) || 1000,
          );
        }

        element.addEventListener(eventName, async (event) => {
          if (/** @type {HTMLButtonElement} */ (element).disabled) return;
          if (tag === "form") event.preventDefault();

          const swap = attrs["swap"] || "innerHTML";
          const targetSelector = attrs["target"];
          const target = targetSelector
            ? document.querySelector(targetSelector)
            : element;

          if (!target) {
            $log.warn(`${attrName}: target "${targetSelector}" not found`);
            return;
          }

          const url = attrs[attrName];
          if (!url) {
            $log.warn(`${attrName}: no URL specified`);
            return;
          }

          const handler = (res) => {
            if (isDefined(attrs["loading"])) {
              attrs.$set("loading", false);
            }

            if (isDefined(attrs["loadingClass"])) {
              attrs.$removeClass(attrs["loadingClass"]);
            }

            const html = res.data;
            if (200 <= res.status && res.status <= 299) {
              if (isDefined(attrs["success"])) {
                $parse(attrs["success"])(scope, { $res: html });
              }

              if (isDefined(attrs["stateSuccess"])) {
                $state.go(attrs["stateSuccess"]);
              }
            } else if (400 <= res.status && res.status <= 599) {
              if (isDefined(attrs["error"])) {
                $parse(attrs["error"])(scope, { $res: html });
              }

              if (isDefined(attrs["stateError"])) {
                $state.go(attrs["stateError"]);
              }
            }

            handleSwapResponse(
              html,
              /** @type {import("../../interface.ts").SwapInsertPosition} */ (
                swap
              ),
              target,
              scope,
              $compile,
            );
          };

          if (isDefined(attrs["delay"])) {
            await wait(parseInt(attrs["delay"]) | 0);
          }

          if (throttled) {
            return;
          }

          if (isDefined(attrs["throttle"])) {
            throttled = true;
            attrs.$set("throttled", true);
            setTimeout(() => {
              attrs.$set("throttled", false);
              throttled = false;
            }, parseInt(attrs["throttle"]));
          }

          if (isDefined(attrs["loading"])) {
            attrs.$set("loading", true);
          }

          if (isDefined(attrs["loadingClass"])) {
            attrs.$addClass(attrs["loadingClass"]);
          }

          if (method === "post" || method === "put") {
            const data = collectFormData(element);
            $http[method](url, data).then(handler).catch(handler);
          } else {
            $http[method](url).then(handler).catch(handler);
          }
        });

        scope.$on("$destroy", () => clearInterval(intervalId));
      },
    };
  };
}
