import { $injectTokens as $ } from "../../injection-tokens.js";
import {
  callBackAfterFirst,
  isDefined,
  isObject,
  toKeyValue,
  wait,
} from "../../shared/utils.js";

/**
 * @param {"get" | "delete" | "post" | "put"} method
 * @returns {ng.DirectiveFactory}
 */
function defineDirective(method, attrOverride) {
  const attrName =
    attrOverride || "ng" + method.charAt(0).toUpperCase() + method.slice(1);
  const directive = createHttpDirective(method, attrName);
  directive["$inject"] = [
    $.$http,
    $.$compile,
    $.$log,
    $.$parse,
    $.$state,
    $.$sse,
  ];
  return directive;
}

/** @type {ng.DirectiveFactory} */
export const ngGetDirective = defineDirective("get");

/** @type {ng.DirectiveFactory} */
export const ngDeleteDirective = defineDirective("delete");

/** @type {ng.DirectiveFactory} */
export const ngPostDirective = defineDirective("post");

/** @type {ng.DirectiveFactory} */
export const ngPutDirective = defineDirective("put");

/** @type {ng.DirectiveFactory} */
export const ngSseDirective = defineDirective("get", "ngSse");

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
 * @param {import("./interface.ts").SwapModeType} swap
 * @param {Element} target - The target DOM element to apply the swap to.
 * @param {ng.Scope} scope
 * @param {ng.CompileService} $compile
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
 * @returns {ng.DirectiveFactory}
 */
export function createHttpDirective(method, attrName) {
  /**
   * @param {ng.HttpService} $http
   * @param {ng.CompileService} $compile
   * @param {ng.LogService} $log
   * @param {ng.ParseService} $parse
   * @param {ng.StateService} $state
   * @param {ng.SseService} $sse
   * @returns {ng.Directive}
   */
  return function ($http, $compile, $log, $parse, $state, $sse) {
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
              /** @type {import("./interface.ts").SwapModeType} */ (swap),
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
            let data;
            const config = {};
            if (attrs["enctype"]) {
              config.headers = {
                "Content-Type": attrs["enctype"],
              };
              data = toKeyValue(collectFormData(element));
            } else {
              data = collectFormData(element);
            }
            $http[method](url, data, config).then(handler).catch(handler);
          } else {
            // If SSE mode is enabled
            if (method === "get" && attrs["ngSse"]) {
              const sseUrl = url;
              const config = {
                withCredentials: attrs["withCredentials"] === "true",
                transformMessage: (data) => {
                  try {
                    return JSON.parse(data);
                  } catch {
                    return data;
                  }
                },
                onOpen: () => {
                  $log.info(`${attrName}: SSE connection opened to ${sseUrl}`);
                  if (isDefined(attrs["loading"])) attrs.$set("loading", false);
                  if (isDefined(attrs["loadingClass"]))
                    attrs.$removeClass(attrs["loadingClass"]);
                },
                onMessage: (data) => {
                  const res = { status: 200, data };
                  handler(res);
                },
                onError: (err) => {
                  $log.error(`${attrName}: SSE error`, err);
                  const res = { status: 500, data: err };
                  handler(res);
                },
              };

              // Open the SSE connection using the injected service
              const source = $sse(sseUrl, config);

              // Cleanup on scope destroy
              scope.$on("$destroy", () => {
                $log.info(`${attrName}: closing SSE connection`);
                source.close();
              });
            } else {
              $http[method](url).then(handler).catch(handler);
            }
          }
        });

        if (intervalId) {
          scope.$on("$destroy", () => clearInterval(intervalId));
        }

        // Eagerly execute for 'load' event
        if (eventName == "load") {
          element.dispatchEvent(new Event("load"));
        }
      },
    };
  };
}
