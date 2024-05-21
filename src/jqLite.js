import {
  minErr,
  arrayRemove,
  concat,
  extend,
  forEach,
  isArray,
  isDefined,
  isFunction,
  isObject,
  isString,
  isUndefined,
  lowercase,
  nodeName_,
  shallowCopy,
  trim,
} from "./core/utils";
import { CACHE } from "./core/cache";

/**
 * @ngdoc function
 * @name angular.element
 * @module ng
 * @kind function
 *
 * @description
 * Wraps a raw DOM element or HTML string as a [jQuery](http://jquery.com) element. Regardless of the presence of jQuery, `angular.element`
 * delegates to AngularJS's built-in subset of jQuery, called "jQuery lite" or **jqLite**.
 *
 * jqLite is a tiny, API-compatible subset of jQuery that allows
 * AngularJS to manipulate the DOM in a cross-browser compatible way. jqLite implements only the most
 * commonly needed functionality with the goal of having a very small footprint.
 *
 *
 * <div class="alert alert-info">**Note:** All element references in AngularJS are always wrapped with
 * jqLite (such as the element argument in a directive's compile / link function). They are never raw DOM references.</div>
 *
 * <div class="alert alert-warning">**Note:** Keep in mind that this function will not find elements
 * by tag name / CSS selector. For lookups by tag name, try instead `angular.element(document).find(...)`
 * or `$document.find()`, or use the standard DOM APIs, e.g. `document.querySelectorAll()`.</div>
 *
 * ## AngularJS's jqLite
 * jqLite provides only the following jQuery methods:
 *
 * - [`addClass()`](http://api.jquery.com/addClass/) - Does not support a function as first argument
 * - [`after()`](http://api.jquery.com/after/)
 * - [`append()`](http://api.jquery.com/append/) - Contrary to jQuery, this doesn't clone elements
 *   so will not work correctly when invoked on a jqLite object containing more than one DOM node
 * - [`attr()`](http://api.jquery.com/attr/) - Does not support functions as parameters
 * - [`bind()`](http://api.jquery.com/bind/) (_deprecated_, use [`on()`](http://api.jquery.com/on/)) - Does not support namespaces, selectors or eventData
 * - [`children()`](http://api.jquery.com/children/) - Does not support selectors
 * - [`data()`](http://api.jquery.com/data/)
 * - [`empty()`](http://api.jquery.com/empty/)
 * - [`eq()`](http://api.jquery.com/eq/)
 * - [`html()`](http://api.jquery.com/html/)
 * - [`on()`](http://api.jquery.com/on/) - Does not support namespaces, selectors or eventData
 * - [`off()`](http://api.jquery.com/off/) - Does not support namespaces, selectors or event object as parameter
 * - [`one()`](http://api.jquery.com/one/) - Does not support namespaces or selectors
 * - [`parent()`](http://api.jquery.com/parent/) - Does not support selectors
 * - [`prepend()`](http://api.jquery.com/prepend/)
 * - [`prop()`](http://api.jquery.com/prop/)
 * - [`remove()`](http://api.jquery.com/remove/)
 * - [`removeData()`](http://api.jquery.com/removeData/)
 * - [`replaceWith()`](http://api.jquery.com/replaceWith/)
 * - [`text()`](http://api.jquery.com/text/)
 * - [`triggerHandler()`](http://api.jquery.com/triggerHandler/) - Passes a dummy event object to handlers
 * - [`val()`](http://api.jquery.com/val/)
 *
 * ## jQuery/jqLite Extras
 * AngularJS also provides the following additional methods and events to both jQuery and jqLite:
 *
 * ### Events
 * - `$destroy` - AngularJS intercepts all jqLite/jQuery's DOM destruction apis and fires this event
 *    on all DOM nodes being removed.  This can be used to clean up any 3rd party bindings to the DOM
 *    element before it is removed.
 *
 * ### Methods
 * - `controller(name)` - retrieves the controller of the current element or its parent. By default
 *   retrieves controller associated with the `ngController` directive. If `name` is provided as
 *   camelCase directive name, then the controller for this directive will be retrieved (e.g.
 *   `'ngModel'`).
 * - `injector()` - retrieves the injector of the current element or its parent.
 * - `scope()` - retrieves the {@link ng.$rootScope.Scope scope} of the current
 *   element or its parent. Requires {@link guide/production#disabling-debug-data Debug Data} to
 *   be enabled.
 * - `isolateScope()` - retrieves an isolate {@link ng.$rootScope.Scope scope} if one is attached directly to the
 *   current element. This getter should be used only on elements that contain a directive which starts a new isolate
 *   scope. Calling `scope()` on this element always returns the original non-isolate scope.
 *   Requires {@link guide/production#disabling-debug-data Debug Data} to be enabled.
 * - `inheritedData()` - same as `data()`, but walks up the DOM until a value is found or the top
 *   parent element is reached.
 *
 * @knownIssue You cannot spy on `angular.element` if you are using Jasmine version 1.x. See
 * https://github.com/angular/angular.js/issues/14251 for more information.
 *
 * @param {string|Element} element HTML string or Element to be wrapped into jQuery.
 * @returns {Object} jQuery object.
 */

JQLite.cache = CACHE;

const EXPANDO = "ngId";
let jqId = 1;

/**
 * !!! This is an undocumented "private" function !!!
 * @param {JQLite|Element} node
 * @returns
 */
JQLite._data = (node) => JQLite.cache.get(node[EXPANDO]) || {};

function jqNextId() {
  return ++jqId;
}

const DASH_LOWERCASE_REGEXP = /-([a-z])/g;
const UNDERSCORE_LOWERCASE_REGEXP = /_([a-z])/g;
const MOUSE_EVENT_MAP = { mouseleave: "mouseout", mouseenter: "mouseover" };
const jqLiteMinErr = minErr("jqLite");

/**
 * @param {string} _all
 * @param {string} letter
 * @returns {string}
 */
function fnCamelCaseReplace(_all, letter) {
  return letter.toUpperCase();
}

/**
 * Converts kebab-case to camelCase.
 * @param {string} name Name to normalize
 * @returns {string}
 */
export function kebabToCamel(name) {
  return name.replace(DASH_LOWERCASE_REGEXP, fnCamelCaseReplace);
}

/**
 * Converts sname to camelCase.
 * @param {string} name
 * @returns {string}
 */
export function snakeToCamel(name) {
  return name.replace(UNDERSCORE_LOWERCASE_REGEXP, fnCamelCaseReplace);
}

const SINGLE_TAG_REGEXP = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/;
const TAG_NAME_REGEXP = /<([\w:-]+)/;

// Table parts need to be wrapped with `<table>` or they're
// stripped to their contents when put in a div.
// XHTML parsers do not magically insert elements in the
// same way that tag soup parsers do, so we cannot shorten
// this by omitting <tbody> or other required elements.
const wrapMap = {
  thead: ["table"],
  col: ["colgroup", "table"],
  tr: ["tbody", "table"],
  td: ["tr", "tbody", "table"],
};

wrapMap.tbody =
  wrapMap.tfoot =
  wrapMap.colgroup =
  wrapMap.caption =
    wrapMap.thead;
wrapMap.th = wrapMap.td;

/**
 * Checks if the string contains HTML tags or entities.
 * @param {string} html
 * @returns {boolean}
 */
export function isTextNode(html) {
  return !/<|&#?\w+;/.test(html);
}

/**
 *
 * @param {Element} node
 * @returns {boolean}
 */
function elementAcceptsData(node) {
  // The window object can accept data but has no nodeType
  // Otherwise we are only interested in elements (1) and documents (9)
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
    case Node.DOCUMENT_NODE:
    case undefined:
      return true;
    default:
      return false;
  }
}

function jqLiteHasData(node) {
  for (const key in JQLite.cache.get(node[EXPANDO])) {
    return true;
  }
  return false;
}

export function jqLiteBuildFragment(html, context) {
  let tmp;
  let tag;
  let wrap;
  let finalHtml;
  const fragment = context.createDocumentFragment();
  let nodes = [];
  let i;

  if (isTextNode(html)) {
    // Convert non-html into a text node
    nodes.push(context.createTextNode(html));
  } else {
    // Convert html into DOM nodes
    tmp = fragment.appendChild(context.createElement("div"));
    tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();
    finalHtml = html;

    wrap = wrapMap[tag] || [];

    // Create wrappers & descend into them
    i = wrap.length;
    while (--i > -1) {
      tmp.appendChild(window.document.createElement(wrap[i]));
      tmp = tmp.firstChild;
    }

    tmp.innerHTML = finalHtml;

    nodes = concat(nodes, tmp.childNodes);

    tmp = fragment.firstChild;
    tmp.textContent = "";
  }

  // Remove wrapper from fragment
  fragment.textContent = "";
  fragment.innerHTML = ""; // Clear inner HTML
  forEach(nodes, (node) => {
    fragment.appendChild(node);
  });

  return fragment;
}

function jqLiteParseHTML(html, context) {
  context = context || window.document;
  let parsed;

  if ((parsed = SINGLE_TAG_REGEXP.exec(html))) {
    return [context.createElement(parsed[1])];
  }

  if ((parsed = jqLiteBuildFragment(html, context))) {
    return parsed.childNodes;
  }

  return [];
}

// IE9-11 has no method "contains" in SVG element and in Node.prototype. Bug #10259.
const jqLiteContains =
  window.Node.prototype.contains ||
  function (arg) {
    return !!(this.compareDocumentPosition(arg) & 16);
  };

/// //////////////////////////////////////////
export function JQLite(element) {
  if (element instanceof JQLite) {
    return element;
  }

  let argIsString;

  if (isString(element)) {
    element = trim(element);
    argIsString = true;
  }
  if (!(this instanceof JQLite)) {
    if (argIsString && element.charAt(0) !== "<") {
      throw jqLiteMinErr(
        "nosel",
        "Looking up elements via selectors is not supported by jqLite! See: http://docs.angularjs.org/api/angular.element",
      );
    }
    return new JQLite(element);
  }

  if (argIsString) {
    jqLiteAddNodes(this, jqLiteParseHTML(element));
  } else if (isFunction(element)) {
    jqLiteReady(element);
  } else {
    jqLiteAddNodes(this, element);
  }
}
export var jqLite = JQLite;

export function dealoc(element, onlyDescendants) {
  if (!element) return;
  if (!onlyDescendants && elementAcceptsData(element))
    jqLiteCleanData([element]);

  if (element.querySelectorAll) {
    jqLiteCleanData(element.querySelectorAll("*"));
  }
}

/**
 * If `ExpandoStore.data` and `ExpandoStore.events` are empty,
 * then delete element's `ExpandoStore` and set its `ExpandoId`
 * to undefined.
 * @param {Element} element
 */
function removeIfEmptyData(element) {
  const expandoId = element[EXPANDO];
  const { events, data } = JQLite.cache.get(expandoId);

  if (
    (!data || !Object.keys(data).length) &&
    (!events || !Object.keys(events).length)
  ) {
    JQLite.cache.delete(expandoId);
    element[EXPANDO] = undefined; // don't delete DOM expandos. IE and Chrome don't like it
  }
}

function jqLiteOff(element, type, fn, unsupported) {
  if (isDefined(unsupported))
    throw jqLiteMinErr(
      "offargs",
      "jqLite#off() does not support the `selector` argument",
    );

  const expandoStore = jqLiteExpandoStore(element);
  const events = expandoStore && expandoStore.events;
  const handle = expandoStore && expandoStore.handle;

  if (!handle) return; // no listeners registered

  if (!type) {
    for (type in events) {
      if (type !== "$destroy") {
        element.removeEventListener(type, handle);
      }
      delete events[type];
    }
  } else {
    const removeHandler = function (type) {
      const listenerFns = events[type];
      if (isDefined(fn)) {
        arrayRemove(listenerFns || [], fn);
      }
      if (!(isDefined(fn) && listenerFns && listenerFns.length > 0)) {
        element.removeEventListener(type, handle);
        delete events[type];
      }
    };

    forEach(type.split(" "), (type) => {
      removeHandler(type);
      if (MOUSE_EVENT_MAP[type]) {
        removeHandler(MOUSE_EVENT_MAP[type]);
      }
    });
  }

  removeIfEmptyData(element);
}

/**
 * Removes expando data from this element. If key is provided, only
 * its field is removed. If data is empty, also removes `ExpandoStore`
 * from cache.
 * @param {Element} element
 * @param {string} [name] - key of field to remove
 */
function jqLiteRemoveData(element, name) {
  const expandoId = element[EXPANDO];
  const expandoStore = expandoId && JQLite.cache.get(expandoId);

  if (expandoStore) {
    if (name) {
      delete expandoStore.data[name];
    } else {
      expandoStore.data = {};
    }

    removeIfEmptyData(element);
  }
}

/**
 *
 * @param {Element} element
 * @param {boolean} createIfNecessary
 * @returns {import("./core/cache").ExpandoStore}
 */
function jqLiteExpandoStore(element, createIfNecessary = false) {
  let expandoId = element[EXPANDO];
  let expandoStore = expandoId && JQLite.cache.get(expandoId);

  if (createIfNecessary && !expandoStore) {
    element[EXPANDO] = expandoId = jqNextId();
    expandoStore = {
      events: {},
      data: {},
      handle: null,
    };
    JQLite.cache.set(expandoId, expandoStore);
  }

  return expandoStore;
}

function jqLiteData(element, key, value) {
  if (elementAcceptsData(element)) {
    let prop;

    const isSimpleSetter = isDefined(value);
    const isSimpleGetter = !isSimpleSetter && key && !isObject(key);
    const massGetter = !key;
    const expandoStore = jqLiteExpandoStore(element, !isSimpleGetter);
    const data = expandoStore && expandoStore.data;

    if (isSimpleSetter) {
      // data('key', value)
      data[kebabToCamel(key)] = value;
    } else {
      if (massGetter) {
        // data()
        return data;
      }
      if (isSimpleGetter) {
        // data('key')
        // don't force creation of expandoStore if it doesn't exist yet
        return data && data[kebabToCamel(key)];
      }
      // mass-setter: data({key1: val1, key2: val2})
      for (prop in key) {
        data[kebabToCamel(prop)] = key[prop];
      }
    }
  }
}

function jqLiteAddNodes(root, elements) {
  // THIS CODE IS VERY HOT. Don't make changes without benchmarking.

  if (elements) {
    // if a Node (the most common case)
    if (elements.nodeType) {
      root[root.length++] = elements;
    } else {
      const { length } = elements;

      // if an Array or NodeList and not a Window
      if (typeof length === "number" && elements.window !== elements) {
        if (length) {
          for (let i = 0; i < length; i++) {
            root[root.length++] = elements[i];
          }
        }
      } else {
        root[root.length++] = elements;
      }
    }
  }
}

function jqLiteController(element, name) {
  return jqLiteInheritedData(element, `$${name || "ngController"}Controller`);
}

function jqLiteInheritedData(element, name, value) {
  // if element is the document object work with the html element instead
  // this makes $(document).scope() possible
  if (element.nodeType === Node.DOCUMENT_NODE) {
    element = element.documentElement;
  }
  const names = isArray(name) ? name : [name];

  while (element) {
    for (let i = 0, ii = names.length; i < ii; i++) {
      if (isDefined((value = jqLiteData(element, names[i])))) return value;
    }

    // If dealing with a document fragment node with a host element, and no parent, use the host
    // element as the parent. This enables directives within a Shadow DOM or polyfilled Shadow DOM
    // to lookup parent controllers.
    element =
      element.parentNode ||
      (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE && element.host);
  }
}

function jqLiteEmpty(element) {
  dealoc(element, true);
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function jqLiteRemove(element, keepData) {
  if (!keepData) dealoc(element);
  const parent = element.parentNode;
  if (parent) parent.removeChild(element);
}

function jqLiteReady(fn) {
  function trigger() {
    window.document.removeEventListener("DOMContentLoaded", trigger);
    window.removeEventListener("load", trigger);
    fn();
  }

  // check if document is already loaded
  if (window.document.readyState === "complete") {
    window.setTimeout(fn);
  } else {
    // We can not use jqLite since we are not done loading and jQuery could be loaded later.

    // Works for modern browsers and IE9
    window.document.addEventListener("DOMContentLoaded", trigger);

    // Fallback to window.onload for others
    window.addEventListener("load", trigger);
  }
}

/// ///////////////////////////////////////
// Functions which are declared directly.
/// ///////////////////////////////////////
JQLite.prototype = {
  ready: jqLiteReady,
  toString() {
    const value = [];
    forEach(this, (e) => {
      value.push(`${e}`);
    });
    return `[${value.join(", ")}]`;
  },

  eq(index) {
    return index >= 0 ? jqLite(this[index]) : jqLite(this[this.length + index]);
  },

  length: 0,
  push: [].push,
  sort: [].sort,
  splice: [].splice,
};

/// ///////////////////////////////////////
// Functions iterating getter/setters.
// these functions return self on setter and
// value on get.
/// ///////////////////////////////////////
export const BOOLEAN_ATTR = {};
"multiple,selected,checked,disabled,readOnly,required,open"
  .split(",")
  .forEach((value) => {
    BOOLEAN_ATTR[lowercase(value)] = value;
  });
const BOOLEAN_ELEMENTS = {};
"input,select,option,textarea,button,form,details"
  .split(",")
  .forEach((value) => {
    BOOLEAN_ELEMENTS[value] = true;
  });

export function getBooleanAttrName(element, name) {
  // check dom last since we will most likely fail on name
  const booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];

  // booleanAttr is here twice to minimize DOM access
  return booleanAttr && BOOLEAN_ELEMENTS[nodeName_(element)] && booleanAttr;
}

export function jqLiteCleanData(nodes) {
  for (let i = 0, ii = nodes.length; i < ii; i++) {
    var events = (jqLite._data(nodes[i]) || {}).events;
    if (events && events.$destroy) {
      jqLite(nodes[i]).triggerHandler("$destroy");
    }
    jqLiteRemoveData(nodes[i]);
    jqLiteOff(nodes[i]);
  }
}

forEach(
  {
    data: jqLiteData,
    removeData: jqLiteRemoveData,
    hasData: jqLiteHasData,
    cleanData: jqLiteCleanData,
  },
  (fn, name) => {
    JQLite[name] = fn;
  },
);

forEach(
  {
    data: jqLiteData,
    inheritedData: jqLiteInheritedData,

    scope(element) {
      // Can't use jqLiteData here directly so we stay compatible with jQuery!
      return (
        jqLiteData(element, "$scope") ||
        jqLiteInheritedData(element.parentNode || element, [
          "$isolateScope",
          "$scope",
        ])
      );
    },

    isolateScope(element) {
      // Can't use jqLiteData here directly so we stay compatible with jQuery!
      return (
        jqLiteData(element, "$isolateScope") ||
        jqLiteData(element, "$isolateScopeNoTemplate")
      );
    },

    controller: jqLiteController,

    injector(element) {
      return jqLiteInheritedData(element, "$injector");
    },

    attr(element, name, value) {
      let ret;
      const { nodeType } = element;
      if (
        nodeType === Node.TEXT_NODE ||
        nodeType === Node.ATTRIBUTE_NODE ||
        nodeType === Node.COMMENT_NODE ||
        !element.getAttribute
      ) {
        return;
      }

      const lowercasedName = lowercase(name);
      const isBooleanAttr = BOOLEAN_ATTR[lowercasedName];

      if (isDefined(value)) {
        // setter

        if (value === null || (value === false && isBooleanAttr)) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, isBooleanAttr ? lowercasedName : value);
        }
      } else {
        // getter

        ret = element.getAttribute(name);

        if (isBooleanAttr && ret !== null) {
          ret = lowercasedName;
        }
        // Normalize non-existing attributes to undefined (as jQuery).
        return ret === null ? undefined : ret;
      }
    },

    prop(element, name, value) {
      if (isDefined(value)) {
        element[name] = value;
      } else {
        return element[name];
      }
    },

    text: (function () {
      getText.$dv = "";
      return getText;

      function getText(element, value) {
        if (isUndefined(value)) {
          const { nodeType } = element;
          return nodeType === Node.ELEMENT_NODE || nodeType === Node.TEXT_NODE
            ? element.textContent
            : "";
        }
        element.textContent = value;
      }
    })(),

    val(element, value) {
      if (isUndefined(value)) {
        if (element.multiple && nodeName_(element) === "select") {
          const result = [];
          forEach(element.options, (option) => {
            if (option.selected) {
              result.push(option.value || option.text);
            }
          });
          return result;
        }
        return element.value;
      }
      element.value = value;
    },

    html(element, value) {
      if (isUndefined(value)) {
        return element.innerHTML;
      }
      dealoc(element, true);
      element.innerHTML = value;
    },

    empty: jqLiteEmpty,
  },
  (fn, name) => {
    /**
     * Properties: writes return selection, reads return first value
     */
    JQLite.prototype[name] = function (arg1, arg2) {
      let i;
      let key;
      const nodeCount = this.length;

      // jqLiteHasClass has only two arguments, but is a getter-only fn, so we need to special-case it
      // in a way that survives minification.
      // jqLiteEmpty takes no arguments but is a setter.
      if (
        fn !== jqLiteEmpty &&
        isUndefined(fn.length === 2 && fn !== jqLiteController ? arg1 : arg2)
      ) {
        if (isObject(arg1)) {
          // we are a write, but the object properties are the key/values
          for (i = 0; i < nodeCount; i++) {
            if (fn === jqLiteData) {
              // data() takes the whole object in jQuery
              fn(this[i], arg1);
            } else {
              for (key in arg1) {
                fn(this[i], key, arg1[key]);
              }
            }
          }
          // return self for chaining
          return this;
        }
        // we are a read, so read the first child.
        // TODO: do we still need this?
        let value = fn.$dv;
        // Only if we have $dv do we iterate over all, otherwise it is just the first element.
        const jj = isUndefined(value) ? Math.min(nodeCount, 1) : nodeCount;
        for (let j = 0; j < jj; j++) {
          const nodeValue = fn(this[j], arg1, arg2);
          value = value ? value + nodeValue : nodeValue;
        }
        return value;
      }
      // we are a write, so apply to all children
      for (i = 0; i < nodeCount; i++) {
        fn(this[i], arg1, arg2);
      }
      // return self for chaining
      return this;
    };
  },
);

function createEventHandler(element, events) {
  const eventHandler = function (event, type) {
    // jQuery specific api
    event.isDefaultPrevented = function () {
      return event.defaultPrevented;
    };

    let eventFns = events[type || event.type];
    const eventFnsLength = eventFns ? eventFns.length : 0;

    if (!eventFnsLength) return;

    if (isUndefined(event.immediatePropagationStopped)) {
      const originalStopImmediatePropagation = event.stopImmediatePropagation;
      event.stopImmediatePropagation = function () {
        event.immediatePropagationStopped = true;

        if (event.stopPropagation) {
          event.stopPropagation();
        }

        if (originalStopImmediatePropagation) {
          originalStopImmediatePropagation.call(event);
        }
      };
    }

    event.isImmediatePropagationStopped = function () {
      return event.immediatePropagationStopped === true;
    };

    // Some events have special handlers that wrap the real handler
    const handlerWrapper =
      eventFns.specialHandlerWrapper || defaultHandlerWrapper;

    // Copy event handlers in case event handlers array is modified during execution.
    if (eventFnsLength > 1) {
      eventFns = shallowCopy(eventFns);
    }

    for (let i = 0; i < eventFnsLength; i++) {
      if (!event.isImmediatePropagationStopped()) {
        handlerWrapper(element, event, eventFns[i]);
      }
    }
  };

  // TODO: this is a hack for angularMocks/clearDataCache that makes it possible to deregister all
  //       events on `element`
  eventHandler.elem = element;
  return eventHandler;
}

function defaultHandlerWrapper(element, event, handler) {
  handler.call(element, event);
}

function specialMouseHandlerWrapper(target, event, handler) {
  // Refer to jQuery's implementation of mouseenter & mouseleave
  // Read about mouseenter and mouseleave:
  // http://www.quirksmode.org/js/events_mouse.html#link8
  const related = event.relatedTarget;
  // For mousenter/leave call the handler if related is outside the target.
  // NB: No relatedTarget if the mouse left/entered the browser window
  if (
    !related ||
    (related !== target && !jqLiteContains.call(target, related))
  ) {
    handler.call(target, event);
  }
}

/// ///////////////////////////////////////
// Functions iterating traversal.
// These functions chain results into a single
// selector.
/// ///////////////////////////////////////
forEach(
  {
    removeData: jqLiteRemoveData,
    on: function jqLiteOn(element, type, fn, unsupported) {
      if (isDefined(unsupported))
        throw jqLiteMinErr(
          "onargs",
          "jqLite#on() does not support the `selector` or `eventData` parameters",
        );

      // Do not add event handlers to non-elements because they will not be cleaned up.
      if (!elementAcceptsData(element)) {
        return;
      }

      const expandoStore = jqLiteExpandoStore(element, true);
      const { events } = expandoStore;
      let { handle } = expandoStore;

      if (!handle) {
        handle = expandoStore.handle = createEventHandler(element, events);
      }

      // http://jsperf.com/string-indexof-vs-split
      const types = type.indexOf(" ") >= 0 ? type.split(" ") : [type];
      let i = types.length;

      const addHandler = function (
        type,
        specialHandlerWrapper,
        noEventListener,
      ) {
        let eventFns = events[type];

        if (!eventFns) {
          eventFns = events[type] = [];
          eventFns.specialHandlerWrapper = specialHandlerWrapper;
          if (type !== "$destroy" && !noEventListener) {
            element.addEventListener(type, handle);
          }
        }

        eventFns.push(fn);
      };

      while (i--) {
        type = types[i];
        if (MOUSE_EVENT_MAP[type]) {
          addHandler(MOUSE_EVENT_MAP[type], specialMouseHandlerWrapper);
          addHandler(type, undefined, true);
        } else {
          addHandler(type);
        }
      }
    },

    off: jqLiteOff,

    one(element, type, fn) {
      element = jqLite(element);

      // add the listener twice so that when it is called
      // you can remove the original function and still be
      // able to call element.off(ev, fn) normally
      element.on(type, function onFn() {
        element.off(type, fn);
        element.off(type, onFn);
      });
      element.on(type, fn);
    },

    replaceWith(element, replaceNode) {
      let index;
      const parent = element.parentNode;
      dealoc(element);
      forEach(new JQLite(replaceNode), (node) => {
        if (index) {
          parent.insertBefore(node, index.nextSibling);
        } else {
          parent.replaceChild(node, element);
        }
        index = node;
      });
    },

    children(element) {
      return Array.from(element.childNodes).filter(
        (child) => child.nodeType === Node.ELEMENT_NODE,
      );
    },

    append(element, node) {
      const { nodeType } = element;
      if (
        nodeType !== Node.ELEMENT_NODE &&
        nodeType !== Node.DOCUMENT_FRAGMENT_NODE
      )
        return;

      node = new JQLite(node);

      for (let i = 0, ii = node.length; i < ii; i++) {
        const child = node[i];
        element.appendChild(child);
      }
    },

    prepend(element, node) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const index = element.firstChild;
        forEach(new JQLite(node), (child) => {
          element.insertBefore(child, index);
        });
      }
    },

    remove: jqLiteRemove,

    detach(element) {
      jqLiteRemove(element, true);
    },

    after(element, newElement) {
      let index = element;
      const parent = element.parentNode;

      if (parent) {
        newElement = new JQLite(newElement);

        for (let i = 0, ii = newElement.length; i < ii; i++) {
          const node = newElement[i];
          parent.insertBefore(node, index.nextSibling);
          index = node;
        }
      }
    },

    parent(element) {
      const parent = element.parentNode;
      return parent && parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
        ? parent
        : null;
    },

    // TODO: remove after migrating tests away from jqLite
    find(element, selector) {
      if (element.getElementsByTagName) {
        return element.getElementsByTagName(selector);
      }
      return [];
    },

    triggerHandler(element, event, extraParameters) {
      let dummyEvent;
      let eventFnsCopy;
      let handlerArgs;
      const eventName = event.type || event;
      const expandoStore = jqLiteExpandoStore(element);
      const events = expandoStore && expandoStore.events;
      const eventFns = events && events[eventName];

      if (eventFns) {
        // Create a dummy event to pass to the handlers
        dummyEvent = {
          preventDefault() {
            this.defaultPrevented = true;
          },
          isDefaultPrevented() {
            return this.defaultPrevented === true;
          },
          stopImmediatePropagation() {
            this.immediatePropagationStopped = true;
          },
          isImmediatePropagationStopped() {
            return this.immediatePropagationStopped === true;
          },
          stopPropagation: () => {},
          type: eventName,
          target: element,
        };

        // If a custom event was provided then extend our dummy event with it
        if (event.type) {
          dummyEvent = extend(dummyEvent, event);
        }

        // Copy event handlers in case event handlers array is modified during execution.
        eventFnsCopy = shallowCopy(eventFns);
        handlerArgs = extraParameters
          ? [dummyEvent].concat(extraParameters)
          : [dummyEvent];

        forEach(eventFnsCopy, (fn) => {
          if (!dummyEvent.isImmediatePropagationStopped()) {
            fn.apply(element, handlerArgs);
          }
        });
      }
    },
  },
  (fn, name) => {
    /**
     * chaining functions
     */
    JQLite.prototype[name] = function (arg1, arg2, arg3) {
      let value;

      for (let i = 0, ii = this.length; i < ii; i++) {
        if (isUndefined(value)) {
          value = fn(this[i], arg1, arg2, arg3);
          if (isDefined(value)) {
            // any function which returns a value needs to be wrapped
            value = jqLite(value);
          }
        } else {
          jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
        }
      }
      return isDefined(value) ? value : this;
    };
  },
);

/**
 * @param {string} elementStr
 * @returns {string} Returns the string representation of the element.
 */
export function startingTag(elementStr) {
  const clone = jqLite(elementStr)[0].cloneNode(true);
  const element = jqLite(clone).empty();
  var elemHtml = jqLite("<div></div>").append(element).html();
  try {
    return element[0].nodeType === Node.TEXT_NODE
      ? lowercase(elemHtml)
      : elemHtml
          .match(/^(<[^>]+>)/)[1]
          .replace(/^<([\w-]+)/, function (match, nodeName) {
            return "<" + lowercase(nodeName);
          });
  } catch (e) {
    return lowercase(elemHtml);
  }
}

/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {Array} nodes An array-like object
 * @returns {Array} the inputted object or a jqLite collection containing the nodes
 */
export function getBlockNodes(nodes) {
  // TODO(perf): update `nodes` instead of creating a new object?
  let node = nodes[0];
  const endNode = nodes[nodes.length - 1];
  let blockNodes;

  for (let i = 1; node !== endNode && (node = node.nextSibling); i++) {
    if (blockNodes || nodes[i] !== node) {
      if (!blockNodes) {
        // use element to avoid circular dependency
        blockNodes = jqLite(Array.prototype.slice.call(nodes, 0, i));
      }
      blockNodes.push(node);
    }
  }

  return blockNodes || nodes;
}
