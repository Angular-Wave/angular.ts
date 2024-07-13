import {
  minErr,
  arrayRemove,
  concat,
  extend,
  forEach,
  isDefined,
  isFunction,
  isObject,
  isString,
  isUndefined,
  lowercase,
  nodeName_,
  shallowCopy,
} from "../../shared/utils";
import { CACHE, EXPANDO } from "../../core/cache/cache";

/**
 * @name angular.element
 * @module ng
 * @kind function
 *
 * @description
 * Wraps a raw DOM element or HTML string as a [jQuery](http://jquery.com) element. Regardless of the presence of jQuery, `angular.element`
 * delegates to AngularJS's built-in subset of jQuery, called "jQuery lite" or **jqLite**.
 *
 * JQLite is a tiny, API-compatible subset of jQuery that allows
 * AngularJS to manipulate the DOM in a cross-browser compatible way. JQLite implements only the most
 * commonly needed functionality with the goal of having a very small footprint.
 *
 * <div class="alert alert-info">**Note:** All element references in AngularJS are always wrapped with
 * JQLite (such as the element argument in a directive's compile / link function). They are never raw DOM references.</div>
 *
 * <div class="alert alert-warning">**Note:** Keep in mind that this function will not find elements
 * by tag name / CSS selector. For lookups by tag name, try instead `angular.element(document).find(...)`
 * or `$document.find()`, or use the standard DOM APIs, e.g. `document.querySelectorAll()`.</div>
 *
 * ## AngularJS's JQLite
 * JQLite provides only the following jQuery methods:
 *
 * - [`after()`](http://api.jquery.com/after/)
 * - [`append()`](http://api.jquery.com/append/) - Contrary to jQuery, this doesn't clone elements
 *   so will not work correctly when invoked on a JQLite object containing more than one DOM node
 * - [`attr()`](http://api.jquery.com/attr/) - Does not support functions as parameters
 * - [`children()`](http://api.jquery.com/children/) - Does not support selectors
 * - [`data()`](http://api.jquery.com/data/)
 * - [`empty()`](http://api.jquery.com/empty/)
 * - [`eq()`](http://api.jquery.com/eq/)
 * - [`html()`](http://api.jquery.com/html/)
 * - [`on()`](http://api.jquery.com/on/) - Does not support namespaces, selectors or eventData
 * - [`off()`](http://api.jquery.com/off/) - Does not support namespaces, selectors or event object as parameter
 * - [`parent()`](http://api.jquery.com/parent/) - Does not support selectors
 * - [`prepend()`](http://api.jquery.com/prepend/)
 * - [`remove()`](http://api.jquery.com/remove/)
 * - [`removeData()`](http://api.jquery.com/removeData/)
 * - [`replaceWith()`](http://api.jquery.com/replaceWith/)
 * - [`text()`](http://api.jquery.com/text/)
 * - [`triggerHandler()`](http://api.jquery.com/triggerHandler/) - Passes a dummy event object to handlers
 * - [`val()`](http://api.jquery.com/val/)
 *
 * ## jQuery/jqLite Extras
 * AngularJS also provides the following additional methods and events to both jQuery and JQLite:
 *
 * ### Events
 * - `$destroy` - AngularJS intercepts all JQLite/jQuery's DOM destruction apis and fires this event
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

/** @type {number} */
let jqId = 1;

function jqNextId() {
  return ++jqId;
}

const DASH_LOWERCASE_REGEXP = /-([a-z])/g;
const UNDERSCORE_LOWERCASE_REGEXP = /_([a-z])/g;
const MOUSE_EVENT_MAP = { mouseleave: "mouseout", mouseenter: "mouseover" };
const JQLiteMinErr = minErr("jqLite");

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
 * @returns {boolean} True if the string is plain text, false if it contains HTML tags or entities.
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

/**
 * @param {string} html
 * @returns {DocumentFragment}
 */
export function buildFragment(html) {
  let tmp;
  let tag;
  let wrap;
  let tempFragment = document.createDocumentFragment();
  let nodes = [];
  let i;

  if (isTextNode(html)) {
    // Convert non-html into a text node
    nodes.push(document.createTextNode(html));
  } else {
    // Convert html into DOM nodes
    tmp = tempFragment.appendChild(document.createElement("div"));
    tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();

    wrap = wrapMap[tag] || [];

    // Create wrappers & descend into them
    i = wrap.length;
    while (--i > -1) {
      tmp.appendChild(window.document.createElement(wrap[i]));
      tmp = tmp.firstChild;
    }
    tmp.innerHTML = html;

    nodes = concat(nodes, tmp.childNodes);

    tmp = tempFragment.firstChild;
    tmp.textContent = "";
  }

  let fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}

/**
 * @param {string} html
 * @returns {NodeListOf<ChildNode> | HTMLElement[]}
 */
function parseHtml(html) {
  let regEx = SINGLE_TAG_REGEXP.exec(html);
  if (regEx) {
    return [document.createElement(regEx[1])];
  }
  let fragment = buildFragment(html);
  if (fragment) {
    return fragment.childNodes;
  }

  return [];
}

/**
 * @param {string|Element|Document|Window|JQLite|ArrayLike<Element>|(() => void)} element
 * @returns {JQLite}
 */
export function JQLite(element) {
  if (element instanceof JQLite) {
    return element;
  }

  let argIsString = false;

  if (isString(element)) {
    element = /** @type {string} */ (element).trim();
    argIsString = true;
  }

  if (!(this instanceof JQLite)) {
    if (argIsString && /** @type {string} */ (element).charAt(0) !== "<") {
      throw JQLiteMinErr(
        "nosel",
        "Looking up elements via selectors is not supported by JQLite! See: http://docs.angularjs.org/api/angular.element",
      );
    }
    return new JQLite(element);
  }

  if (argIsString) {
    const parsed = parseHtml(/** @type {string} */ (element));
    addNodes(this, parsed);
  } else if (isFunction(element)) {
    onReady(/** @type {Function} */ (element));
  } else {
    addNodes(this, element);
  }
}

/**
 * @param {Element} element
 * @param {boolean} [onlyDescendants]
 * @returns {void}
 */
export function dealoc(element, onlyDescendants) {
  if (!element) return;
  if (!onlyDescendants && elementAcceptsData(element))
    JQLiteCleanData([element]);

  if (element.querySelectorAll) {
    JQLiteCleanData(element.querySelectorAll("*"));
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
  const { events, data } = CACHE.get(expandoId);

  if (
    (!data || !Object.keys(data).length) &&
    (!events || !Object.keys(events).length)
  ) {
    CACHE.delete(expandoId);
    element[EXPANDO] = undefined; // don't delete DOM expandos. Chrome don't like it
  }
}

function JQLiteOff(element, type, fn, unsupported) {
  if (isDefined(unsupported))
    throw JQLiteMinErr(
      "offargs",
      "jqLite#off() does not support the `selector` argument",
    );

  const expandoStore = JQLiteExpandoStore(element);
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
      if (isDefined(fn) && Array.isArray(listenerFns)) {
        arrayRemove(listenerFns, fn);
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
function JQLiteRemoveData(element, name) {
  const expandoId = element[EXPANDO];
  const expandoStore = expandoId && CACHE.get(expandoId);

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
 * Stores data associated with an element inside the expando property of the DOM element.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Expando MDN Glossary: Expando}
 *
 * @param {Element} element
 * @param {boolean} [createIfNecessary=false]
 * @returns {import("../../core/cache/cache").ExpandoStore}
 */
function JQLiteExpandoStore(element, createIfNecessary = false) {
  let expandoId = element[EXPANDO];
  let expandoStore = expandoId && CACHE.get(expandoId);

  if (createIfNecessary && !expandoStore) {
    element[EXPANDO] = expandoId = jqNextId();
    expandoStore = {
      events: {},
      data: {},
      handle: null,
    };
    CACHE.set(expandoId, expandoStore);
  }

  return expandoStore;
}

function JQLiteData(element, key, value) {
  if (elementAcceptsData(element)) {
    let prop;

    const isSimpleSetter = isDefined(value);
    const isSimpleGetter = !isSimpleSetter && key && !isObject(key);
    const massGetter = !key;
    const expandoStore = JQLiteExpandoStore(element, !isSimpleGetter);
    const data = expandoStore && expandoStore.data;

    if (isSimpleSetter) {
      data[kebabToCamel(key)] = value;
    } else {
      if (massGetter) {
        return data;
      }
      if (isSimpleGetter) {
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

/**
 * Adds nodes or elements to the root array-like object.
 *
 * @param {Array} root - The array-like object to which elements will be added.
 * @param {(Node|Array|NodeList|Object)} elements - The elements to add to the root. This can be a single DOM node, an array-like object (such as an Array or NodeList), or any other object.
 */
function addNodes(root, elements) {
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

function JQLiteController(element, name) {
  return JQLiteInheritedData(element, `$${name || "ngController"}Controller`);
}

function JQLiteInheritedData(element, name, value) {
  // if element is the document object work with the html element instead
  // this makes $(document).scope() possible
  if (element.nodeType === Node.DOCUMENT_NODE) {
    element = element.documentElement;
  }
  const names = Array.isArray(name) ? name : [name];

  while (element) {
    for (let i = 0, ii = names.length; i < ii; i++) {
      if (isDefined((value = JQLiteData(element, names[i])))) return value;
    }

    // If dealing with a document fragment node with a host element, and no parent, use the host
    // element as the parent. This enables directives within a Shadow DOM or polyfilled Shadow DOM
    // to lookup parent controllers.
    element =
      element.parentNode ||
      (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE && element.host);
  }
}

function JQLiteEmpty(element) {
  dealoc(element, true);
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function JQLiteRemove(element, keepData) {
  if (!keepData) dealoc(element);
  const parent = element.parentNode;
  if (parent) parent.removeChild(element);
}

/**
 * Executea a function on `DOMContentLoaded`
 * @param {Function} fn
 */
function onReady(fn) {
  function trigger() {
    window.document.removeEventListener("DOMContentLoaded", trigger);
    fn();
  }
  // check if document is already loaded
  if (window.document.readyState === "complete") {
    window.setTimeout(fn);
  } else {
    // We can not use JQLite since we are not done loading.
    window.document.addEventListener("DOMContentLoaded", trigger);
  }
}

/// ///////////////////////////////////////
// Functions which are declared directly.
/// ///////////////////////////////////////
JQLite.prototype = {
  toString() {
    const value = [];
    forEach(this, (e) => {
      value.push(`${e}`);
    });
    return `[${value.join(", ")}]`;
  },

  eq(index) {
    return index >= 0 ? JQLite(this[index]) : JQLite(this[this.length + index]);
  },

  length: 0,
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

export function JQLiteCleanData(nodes) {
  for (let i = 0, ii = nodes.length; i < ii; i++) {
    var events = (CACHE.get(nodes[i][EXPANDO]) || {}).events;
    if (events && events.$destroy) {
      JQLite(nodes[i]).triggerHandler("$destroy");
    }
    JQLiteRemoveData(nodes[i]);
    JQLiteOff(nodes[i]);
  }
}

forEach(
  {
    data: JQLiteData,
    removeData: JQLiteRemoveData,
    cleanData: JQLiteCleanData,
  },
  (fn, name) => {
    JQLite[name] = fn;
  },
);

forEach(
  {
    data: JQLiteData,
    inheritedData: JQLiteInheritedData,

    scope(element) {
      // Can't use JQLiteData here directly so we stay compatible with jQuery!
      return (
        JQLiteData(element, "$scope") ||
        JQLiteInheritedData(element.parentNode || element, [
          "$isolateScope",
          "$scope",
        ])
      );
    },

    isolateScope(element) {
      // Can't use JQLiteData here directly so we stay compatible with jQuery!
      return (
        JQLiteData(element, "$isolateScope") ||
        JQLiteData(element, "$isolateScopeNoTemplate")
      );
    },

    controller: JQLiteController,

    injector(element) {
      return JQLiteInheritedData(element, "$injector");
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

    empty: JQLiteEmpty,
  },
  (fn, name) => {
    /**
     * Properties: writes return selection, reads return first value
     */
    JQLite.prototype[name] = function (arg1, arg2) {
      let i;
      let key;
      const nodeCount = this.length;

      // JQLiteEmpty takes no arguments but is a setter.
      if (
        fn !== JQLiteEmpty &&
        isUndefined(fn.length === 2 && fn !== JQLiteController ? arg1 : arg2)
      ) {
        if (isObject(arg1)) {
          // we are a write, but the object properties are the key/values
          for (i = 0; i < nodeCount; i++) {
            if (fn === JQLiteData) {
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

/**
 * @param {Node} target
 * @param {*} event
 * @param {*} handler
 */
function specialMouseHandlerWrapper(target, event, handler) {
  // Refer to jQuery's implementation of mouseenter & mouseleave
  // Read about mouseenter and mouseleave:
  // http://www.quirksmode.org/js/events_mouse.html#link8
  const related = event.relatedTarget;
  // For mousenter/leave call the handler if related is outside the target.
  // NB: No relatedTarget if the mouse left/entered the browser window
  if (!related || (related !== target && !target.contains(related))) {
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
    removeData: JQLiteRemoveData,
    on: (element, type, fn) => {
      // Do not add event handlers to non-elements because they will not be cleaned up.
      if (!elementAcceptsData(element)) {
        return;
      }

      const expandoStore = JQLiteExpandoStore(element, true);
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

    off: JQLiteOff,

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

    remove: JQLiteRemove,

    detach(element) {
      JQLiteRemove(element, true);
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

    // TODO: remove after migrating tests away from JQLite
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
      const expandoStore = JQLiteExpandoStore(element);
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
            value = JQLite(value);
          }
        } else {
          addNodes(value, fn(this[i], arg1, arg2, arg3));
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
  const clone = JQLite(elementStr)[0].cloneNode(true);
  const element = JQLite(clone).empty();
  var elemHtml = JQLite("<div></div>").append(element).html();
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
 * @returns {JQLite} the inputted object or a JQLite collection containing the nodes
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
        blockNodes = Array.prototype.slice.call(nodes, 0, i);
      }
      blockNodes.push(node);
    }
  }

  return JQLite(blockNodes || nodes);
}
